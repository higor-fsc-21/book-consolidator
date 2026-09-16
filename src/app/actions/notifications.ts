"use server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import * as notificationsService from "@/domain/services/notifications";
import {
  NotificationPreferencesSchema,
  PushSubscriptionEndpointSchema,
  PushSubscriptionSchema,
  type ActionResult,
} from "@/lib/validators";

export async function getNotificationPreferencesAction(): Promise<
  ActionResult<{
    enabled: boolean;
    reminderTimeMinutes: number;
    timezone: string;
    subscriptionCount: number;
  }>
> {
  const user = await getCurrentUser();
  try {
    return {
      success: true,
      data: await notificationsService.getNotificationPreferences(user.id),
    };
  } catch (error) {
    logger.error("notification.preferences.read_failed", error, {
      userId: user.id,
    });
    return { success: false, error: "Erro ao carregar preferências" };
  }
}

export async function updateNotificationPreferencesAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  const parsed = NotificationPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Preferências de notificação inválidas" };
  }

  try {
    await notificationsService.updateNotificationPreferences(
      user.id,
      parsed.data,
    );
    logger.info("notification.preferences.updated", { userId: user.id });
    return { success: true };
  } catch (error) {
    logger.error("notification.preferences.update_failed", error, {
      userId: user.id,
    });
    return { success: false, error: "Erro ao atualizar preferências" };
  }
}

export async function savePushSubscriptionAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  const parsed = PushSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Subscription de notificação inválida" };
  }

  try {
    await notificationsService.savePushSubscription(user.id, parsed.data);
    logger.info("notification.subscription.saved", { userId: user.id });
    return { success: true };
  } catch (error) {
    logger.error("notification.subscription.save_failed", error, {
      userId: user.id,
    });
    return { success: false, error: "Erro ao ativar notificações" };
  }
}

export async function removePushSubscriptionAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  const parsed = PushSubscriptionEndpointSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Endpoint de notificação inválido" };
  }

  try {
    await notificationsService.removePushSubscription(
      user.id,
      parsed.data.endpoint,
    );
    logger.info("notification.subscription.removed", { userId: user.id });
    return { success: true };
  } catch (error) {
    logger.error("notification.subscription.remove_failed", error, {
      userId: user.id,
    });
    return { success: false, error: "Erro ao desativar notificações" };
  }
}
