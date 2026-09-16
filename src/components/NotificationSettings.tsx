"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getNotificationPreferencesAction,
  removePushSubscriptionAction,
  savePushSubscriptionAction,
  updateNotificationPreferencesAction,
} from "@/app/actions/notifications";

const DEFAULT_TIMEZONE = "UTC";
const DEFAULT_TIME = 9 * 60;

function decodeVapidKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
}

function readTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;
}

function readMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function NotificationSettings() {
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState(readTime(DEFAULT_TIME));
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE,
  );
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void getNotificationPreferencesAction().then((result) => {
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      if (!result.data) {
        setMessage("Preferências indisponíveis");
        return;
      }
      setEnabled(result.data.enabled);
      setTime(readTime(result.data.reminderTimeMinutes));
      setTimezone(result.data.timezone);
      setSubscriptionCount(result.data.subscriptionCount);
    });
  }, []);

  const savePreferences = (nextEnabled: boolean) => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateNotificationPreferencesAction({
        enabled: nextEnabled,
        reminderTimeMinutes: readMinutes(time),
        timezone,
      });
      if (!result.success) setMessage(result.error);
    });
  };

  const enableNotifications = () => {
    setMessage(null);
    startTransition(async () => {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setMessage("Este navegador não oferece notificações push.");
        return;
      }
      if (!window.isSecureContext) {
        setMessage("Notificações exigem uma conexão HTTPS.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("A permissão foi recusada. O lembrete continuará no app.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const applicationServerKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!applicationServerKey) {
        setMessage("As notificações ainda não estão configuradas no servidor.");
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(applicationServerKey),
      });
      const result = await savePushSubscriptionAction(subscription.toJSON());
      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setSubscriptionCount(1);
      setEnabled(true);
      await updateNotificationPreferencesAction({
        enabled: true,
        reminderTimeMinutes: readMinutes(time),
        timezone,
      });
      setMessage("Notificações ativadas.");
    });
  };

  const disableNotifications = () => {
    setMessage(null);
    startTransition(async () => {
      const registration = await navigator.serviceWorker.ready.catch(
        () => null,
      );
      const subscription = await registration?.pushManager
        .getSubscription()
        .catch(() => null);
      if (subscription) {
        await removePushSubscriptionAction({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      const result = await updateNotificationPreferencesAction({
        enabled: false,
        reminderTimeMinutes: readMinutes(time),
        timezone,
      });
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setEnabled(false);
      setSubscriptionCount(0);
      setMessage("Notificações desativadas.");
    });
  };

  const saveSchedule = () => savePreferences(enabled);

  return (
    <section className="bg-white rounded-xl p-6 shadow-paper max-w-xl">
      <div className="text-[10px] text-[#74777d] font-[600] uppercase tracking-widest mb-2">
        Lembretes de revisão
      </div>
      <h1 className="font-display text-3xl text-[#1b1c1c]">
        Escolha quando o Book Consolidator lembra você.
      </h1>
      <p className="text-sm text-[#74777d] mt-2 leading-6">
        Você controla os lembretes. Eles ajudam a retomar o conhecimento sem
        transformar a revisão em cobrança.
      </p>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#e4e2e2] pt-5">
        <div>
          <div className="text-sm font-[600] text-[#1b1c1c]">
            Notificações push
          </div>
          <div className="text-xs text-[#74777d] mt-1">
            {subscriptionCount > 0 ? "Ativas neste dispositivo" : "Desativadas"}
          </div>
        </div>
        {enabled ? (
          <button
            type="button"
            onClick={disableNotifications}
            disabled={isPending}
            className="text-xs px-4 py-2 rounded-lg border border-[#c4c6cd] text-[#43474d] font-[600] disabled:opacity-50"
          >
            Desativar
          </button>
        ) : (
          <button
            type="button"
            onClick={enableNotifications}
            disabled={isPending}
            className="text-xs px-4 py-2 rounded-lg bg-[#1a2e44] text-white font-[600] disabled:opacity-50"
          >
            Ativar notificações
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="text-xs text-[#74777d]">
          Horário local
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#c4c6cd] px-3 py-2 text-sm text-[#1b1c1c]"
          />
        </label>
        <label className="text-xs text-[#74777d]">
          Fuso horário
          <input
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#c4c6cd] px-3 py-2 text-sm text-[#1b1c1c]"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={saveSchedule}
        disabled={isPending}
        className="mt-5 text-xs px-4 py-2 rounded-lg border border-[#c4c6cd] text-[#43474d] font-[600] disabled:opacity-50"
      >
        Salvar horário
      </button>

      {message && (
        <p className="mt-4 text-xs text-[#53636a]" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
