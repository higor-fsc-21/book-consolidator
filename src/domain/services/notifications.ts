import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";
import { startOfUtcDay } from "../scheduling";
import type {
  NotificationPreferencesInput,
  PushSubscriptionInput,
} from "@/lib/validators";

const isValidTimezone = (timezone: string): boolean => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
};

export async function getNotificationPreferences(userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      revisionRemindersEnabled: true,
      reminderTimeMinutes: true,
      timezone: true,
      _count: { select: { pushSubscriptions: true } },
    },
  });

  return {
    enabled: user.revisionRemindersEnabled,
    reminderTimeMinutes: user.reminderTimeMinutes,
    timezone: user.timezone,
    subscriptionCount: user._count.pushSubscriptions,
  };
}

export async function updateNotificationPreferences(
  userId: string,
  data: NotificationPreferencesInput,
) {
  if (!isValidTimezone(data.timezone)) {
    throw new Error("Fuso horário inválido");
  }

  return db.user.update({
    where: { id: userId },
    data: {
      revisionRemindersEnabled: data.enabled,
      reminderTimeMinutes: data.reminderTimeMinutes,
      timezone: data.timezone,
    },
    select: {
      revisionRemindersEnabled: true,
      reminderTimeMinutes: true,
      timezone: true,
    },
  });
}

export async function savePushSubscription(
  userId: string,
  data: PushSubscriptionInput,
) {
  return db.pushSubscription.upsert({
    where: { endpoint: data.endpoint },
    create: {
      userId,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
    },
    update: {
      userId,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
    },
  });
}

export async function removePushSubscription(userId: string, endpoint: string) {
  return db.pushSubscription.deleteMany({
    where: { userId, endpoint },
  });
}

const dateKey = (date: Date): string =>
  startOfUtcDay(date).toISOString().slice(0, 10);

const localHour = (date: Date, timezone: string): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  return Number(parts.find((part) => part.type === "hour")?.value ?? 0);
};

const localDateKey = (date: Date, timezone: string): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const isDueForLocalDate = (
  revisionDate: Date,
  now: Date,
  timezone: string,
): boolean => dateKey(revisionDate) <= localDateKey(now, timezone);

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("Web Push não está configurado");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export interface NotificationRunResult {
  considered: number;
  sent: number;
  skipped: number;
  failed: number;
}

export async function sendDueRevisionNotifications(
  now: Date = new Date(),
): Promise<NotificationRunResult> {
  configureWebPush();
  const users = await db.user.findMany({
    where: {
      deletedAt: null,
      revisionRemindersEnabled: true,
      pushSubscriptions: { some: {} },
    },
    select: {
      id: true,
      timezone: true,
      reminderTimeMinutes: true,
      pushSubscriptions: {
        select: { id: true, endpoint: true, p256dh: true, auth: true },
      },
      books: {
        where: {
          deletedAt: null,
          status: "completed",
          consolidationState: { not: "archived" },
          nextRevision: { not: null },
        },
        select: { id: true, title: true, nextRevision: true },
      },
    },
  });

  const result: NotificationRunResult = {
    considered: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  for (const user of users) {
    if (
      localHour(now, user.timezone) !==
      Math.floor(user.reminderTimeMinutes / 60)
    ) {
      continue;
    }

    for (const book of user.books) {
      if (
        !book.nextRevision ||
        !isDueForLocalDate(book.nextRevision, now, user.timezone)
      ) {
        continue;
      }

      result.considered += 1;
      const revisionDate = dateKey(book.nextRevision);
      const dedupeKey = `${user.id}:${book.id}:web_push:${revisionDate}`;
      let delivery;
      try {
        delivery = await db.notificationDelivery.create({
          data: {
            userId: user.id,
            bookId: book.id,
            channel: "web_push",
            revisionDate: startOfUtcDay(book.nextRevision),
            dedupeKey,
            attemptCount: 1,
          },
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2002"
        ) {
          const retry = await db.notificationDelivery.updateMany({
            where: { dedupeKey, status: "failed" },
            data: {
              status: "pending",
              attemptCount: { increment: 1 },
              lastError: null,
            },
          });
          if (retry.count === 0) {
            result.skipped += 1;
            continue;
          }
          delivery = await db.notificationDelivery.findUniqueOrThrow({
            where: { dedupeKey },
          });
        } else {
          throw error;
        }
      }

      let delivered = 0;
      let lastError: string | null = null;
      const payload = JSON.stringify({
        title: "Hora de revisar",
        body: `Retome ${book.title} no seu ritmo.`,
        url: `/livros/${book.id}`,
      });

      for (const subscription of user.pushSubscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            payload,
          );
          delivered += 1;
        } catch (error) {
          const statusCode =
            error && typeof error === "object" && "statusCode" in error
              ? error.statusCode
              : undefined;
          if (statusCode === 404 || statusCode === 410) {
            await db.pushSubscription.delete({
              where: { id: subscription.id },
            });
          }
          lastError = statusCode ? `http_${statusCode}` : "send_failed";
        }
      }

      if (delivered > 0) {
        await db.notificationDelivery.update({
          where: { id: delivery.id },
          data: { status: "sent", sentAt: new Date() },
        });
        result.sent += 1;
      } else {
        await db.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "failed",
            lastError: lastError ?? "no_subscription_delivered",
          },
        });
        result.failed += 1;
      }
    }
  }

  return result;
}
