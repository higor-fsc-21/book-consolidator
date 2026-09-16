import { NotificationSettings } from "@/components/NotificationSettings";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="text-xs text-[#74777d] font-[500] uppercase tracking-widest mb-1">
          Preferências
        </div>
        <h1 className="font-display text-4xl text-[#1b1c1c]">Configurações</h1>
      </div>
      <NotificationSettings />
    </div>
  );
}
