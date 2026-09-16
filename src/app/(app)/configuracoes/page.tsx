import { NotificationSettings } from "@/components/NotificationSettings";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <div className="text-xs text-[#74777d] font-[500] uppercase tracking-widest mb-1">
          Preferências
        </div>
        <h1 className="font-display text-3xl text-[#1b1c1c] sm:text-4xl">
          Configurações
        </h1>
      </div>
      <NotificationSettings />
    </div>
  );
}
