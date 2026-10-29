"use client";

// State for Profile Tab

// State for Goals Tab

// Derived statistics
/* Page Header */ /* Tabs navigation */ /* Tab 1: Perfil */ /* Tab 2: Metas */ /* Meta anual de livros */ /* Quick select presets */ /* Live progress preview */ /* Meta semanal de revisões */ /* Quick select presets */ /* Live progress preview */ /* Tab 3: Estatísticas */ /* Overview Grid */ /* Performance por modalidade */ /* Tab 4: Lembretes */

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Book, UserProfile, SessionMode } from "@/domain/types";
import { modeLabels } from "@/domain/constants";
import { userJourneyStats } from "@/domain/derived";
import {
  updateUserGoalsAction,
  updateUserProfileAction,
} from "@/app/actions/profile";
import { NotificationSettings } from "@/components/NotificationSettings";
import { useSingleFlightTransition } from "@/hooks/useSingleFlightTransition";

type TabId = "perfil" | "metas" | "estatisticas" | "lembretes";

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabItem[] = [
  {
    id: "perfil",
    label: "Perfil",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: "metas",
    label: "Metas",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: "estatisticas",
    label: "Estatísticas",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: "lembretes",
    label: "Lembretes",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

interface ProfileSettingsViewProps {
  profile: UserProfile;
  books: Book[];
}

export function ProfileSettingsView({
  profile,
  books,
}: ProfileSettingsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") as TabId | null;
  const activeTab: TabId =
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : "perfil";

  const handleTabChange = (nextTab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const [name, setName] = useState(profile.name);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSavingProfile, startProfileTransition] = useSingleFlightTransition();
  const [annualGoal, setAnnualGoal] = useState<number>(profile.annualBooksGoal);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(
    profile.weeklyRevisionsGoal,
  );
  const [goalsMessage, setGoalsMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSavingGoals, startGoalsTransition] = useSingleFlightTransition();
  const stats = userJourneyStats(books);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setProfileMessage({ type: "error", text: "Nome não pode ficar vazio" });
      return;
    }

    startProfileTransition(async () => {
      const result = await updateUserProfileAction({ name: trimmed });
      if (result.success) {
        setProfileMessage({
          type: "success",
          text: "Nome de exibição atualizado com sucesso!",
        });
      } else {
        setProfileMessage({
          type: "error",
          text: result.error || "Erro ao salvar perfil",
        });
      }
    });
  };

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    setGoalsMessage(null);

    if (annualGoal < 1 || annualGoal > 200) {
      setGoalsMessage({
        type: "error",
        text: "A meta anual de livros deve estar entre 1 e 200.",
      });
      return;
    }
    if (weeklyGoal < 1 || weeklyGoal > 50) {
      setGoalsMessage({
        type: "error",
        text: "A meta semanal de revisões deve estar entre 1 e 50.",
      });
      return;
    }

    startGoalsTransition(async () => {
      const result = await updateUserGoalsAction({
        annualBooksGoal: annualGoal,
        weeklyRevisionsGoal: weeklyGoal,
      });
      if (result.success) {
        setGoalsMessage({
          type: "success",
          text: "Metas de leitura e revisão salvas com sucesso!",
        });
      } else {
        setGoalsMessage({
          type: "error",
          text: result.error || "Erro ao salvar metas",
        });
      }
    });
  };

  const memberSince = new Date(profile.createdAt).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const annualGoalProgressPercent = Math.min(
    100,
    Math.round((stats.completedBooksCount / Math.max(1, annualGoal)) * 100),
  );

  const weeklyGoalProgressPercent = Math.min(
    100,
    Math.round((stats.sessionsThisWeek / Math.max(1, weeklyGoal)) * 100),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      {}
      <div>
        <div className="text-xs text-[#74777d] font-[500] uppercase tracking-widest mb-1">
          Sua conta & Preferências
        </div>
        <h1
          style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
          className="text-3xl text-[#1b1c1c] tracking-[-0.02em] sm:text-4xl"
        >
          Perfil e Preferências
        </h1>
        <p className="text-[#74777d] text-sm mt-1.5">
          Gerencie seus dados pessoais, objetivos de retenção e preferências da
          sua conta.
        </p>
      </div>

      {}
      <div className="-mb-px mb-6 flex flex-wrap gap-2 border-b border-[#e4e2e2]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-[500] transition-colors -mb-px ${
                isActive
                  ? "border-[#1a2e44] text-[#1a2e44] font-[600]"
                  : "border-transparent text-[#74777d] hover:text-[#1b1c1c]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {}
      {activeTab === "perfil" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-paper border border-[#e4e2e2]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-[#e4e2e2]">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-[600] shrink-0 shadow-paper-sm"
                style={{
                  background: "linear-gradient(135deg, #1a2e44, #2d4460)",
                }}
              >
                {name.trim().charAt(0).toUpperCase() || "U"}
              </div>
              <div className="space-y-1 min-w-0">
                <h2 className="text-lg font-[600] text-[#1b1c1c]">
                  {profile.name}
                </h2>
                <div className="text-xs text-[#74777d] flex items-center gap-2">
                  <span>Membro desde {memberSince}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 rounded bg-[#8ba889]/15 px-2 py-0.5 text-[11px] font-[500] text-[#2a5628]">
                    Conta ativa
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-xs font-[600] text-[#43474d] uppercase tracking-wider mb-2"
                >
                  Nome de exibição *
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  className="w-full max-w-md px-3.5 py-2.5 text-sm bg-[#f9f7f4] border border-[#e4e2e2] rounded-lg focus:border-[#1a2e44] focus:bg-white outline-none text-[#1b1c1c] transition-colors"
                  placeholder="Seu nome completo ou apelido"
                  required
                />
                <p className="text-xs text-[#74777d] mt-1.5">
                  Este é o nome exibido na barra lateral e nos relatórios de
                  estudos.
                </p>
              </div>

              <div>
                <label className="block text-xs font-[600] text-[#43474d] uppercase tracking-wider mb-2">
                  E-mail de acesso
                </label>
                <div className="flex items-center gap-3 max-w-md">
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3.5 py-2.5 text-sm bg-[#f5f3f3] border border-[#e4e2e2] rounded-lg text-[#74777d] cursor-not-allowed select-none"
                  />
                  <span className="text-xs font-mono text-[#74777d] whitespace-nowrap px-2.5 py-1 bg-[#f5f3f3] rounded border border-[#e4e2e2]">
                    Google OAuth
                  </span>
                </div>
                <p className="text-xs text-[#74777d] mt-1.5">
                  O e-mail é vinculado à sua autenticação do Google e não pode
                  ser alterado diretamente aqui.
                </p>
              </div>

              {profileMessage && (
                <div
                  className={`text-xs px-4 py-2.5 rounded-lg border max-w-md flex items-center gap-2 ${
                    profileMessage.type === "success"
                      ? "bg-[#8ba889]/15 border-[#8ba889]/30 text-[#2a5628]"
                      : "bg-[#ba1a1a]/10 border-[#ba1a1a]/25 text-[#ba1a1a]"
                  }`}
                >
                  {profileMessage.type === "success" ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                  {profileMessage.text}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 rounded-lg bg-[#1a2e44] text-white text-xs font-[600] hover:bg-[#2d4460] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-paper-sm"
                >
                  {isSavingProfile && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Salvar alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {activeTab === "metas" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-paper border border-[#e4e2e2]">
            <div className="mb-6 pb-6 border-b border-[#e4e2e2]">
              <h2 className="text-lg font-[600] text-[#1b1c1c]">
                Metas de Leitura e Consolidação (Método FAST)
              </h2>
              <p className="text-xs text-[#74777d] mt-1 max-w-2xl leading-relaxed">
                A retenção duradoura depende de ritmo e repetição espaçada.
                Defina suas metas anuais de livros e frequência semanal de
                revisão ativa.
              </p>
            </div>

            <form onSubmit={handleSaveGoals} className="space-y-8">
              {}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label
                      htmlFor="annual-books-goal"
                      className="block text-xs font-[600] text-[#43474d] uppercase tracking-wider"
                    >
                      Meta Anual de Livros Lidos
                    </label>
                    <p className="text-xs text-[#74777d] mt-0.5">
                      Quantidade de livros concluídos que você deseja alcançar
                      no ano.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="annual-books-goal"
                      type="number"
                      min={1}
                      max={200}
                      value={annualGoal}
                      onChange={(e) =>
                        setAnnualGoal(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-24 px-3 py-2 text-center text-sm font-mono font-[600] bg-[#f9f7f4] border border-[#e4e2e2] rounded-lg focus:border-[#1a2e44] focus:bg-white outline-none text-[#1b1c1c]"
                      required
                    />
                    <span className="text-xs font-[500] text-[#74777d]">
                      livros/ano
                    </span>
                  </div>
                </div>

                {}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] text-[#74777d] mr-1">
                    Sugestões:
                  </span>
                  {[6, 12, 18, 24, 36, 52].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAnnualGoal(preset)}
                      className={`text-xs px-2.5 py-1 rounded-md border font-mono transition-colors ${
                        annualGoal === preset
                          ? "bg-[#1a2e44] border-[#1a2e44] text-white font-[600]"
                          : "border-[#e4e2e2] text-[#43474d] hover:bg-[#f5f3f3]"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {}
                <div className="mt-3 bg-[#fbf9f8] border border-[#e4e2e2] rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#43474d] font-[500]">
                      Progresso atual no ano
                    </span>
                    <span className="font-mono text-[#1b1c1c] font-[600]">
                      {stats.completedBooksCount} / {annualGoal} livros (
                      {annualGoalProgressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 bg-[#e4e2e2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8ba889] rounded-full transition-all duration-300"
                      style={{ width: `${annualGoalProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {}
              <div className="space-y-3 pt-6 border-t border-[#e4e2e2]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label
                      htmlFor="weekly-revisions-goal"
                      className="block text-xs font-[600] text-[#43474d] uppercase tracking-wider"
                    >
                      Meta Semanal de Revisões (Consolidação)
                    </label>
                    <p className="text-xs text-[#74777d] mt-0.5">
                      Quantas sessões de consolidação você pretende realizar a
                      cada semana.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="weekly-revisions-goal"
                      type="number"
                      min={1}
                      max={50}
                      value={weeklyGoal}
                      onChange={(e) =>
                        setWeeklyGoal(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-24 px-3 py-2 text-center text-sm font-mono font-[600] bg-[#f9f7f4] border border-[#e4e2e2] rounded-lg focus:border-[#1a2e44] focus:bg-white outline-none text-[#1b1c1c]"
                      required
                    />
                    <span className="text-xs font-[500] text-[#74777d]">
                      sessões/sem
                    </span>
                  </div>
                </div>

                {}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] text-[#74777d] mr-1">
                    Sugestões:
                  </span>
                  {[2, 3, 5, 7, 10].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWeeklyGoal(preset)}
                      className={`text-xs px-2.5 py-1 rounded-md border font-mono transition-colors ${
                        weeklyGoal === preset
                          ? "bg-[#1a2e44] border-[#1a2e44] text-white font-[600]"
                          : "border-[#e4e2e2] text-[#43474d] hover:bg-[#f5f3f3]"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {}
                <div className="mt-3 bg-[#fbf9f8] border border-[#e4e2e2] rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#43474d] font-[500]">
                      Sessões realizadas nos últimos 7 dias
                    </span>
                    <span className="font-mono text-[#1b1c1c] font-[600]">
                      {stats.sessionsThisWeek} / {weeklyGoal} revisões (
                      {weeklyGoalProgressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 bg-[#e4e2e2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1a2e44] rounded-full transition-all duration-300"
                      style={{ width: `${weeklyGoalProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {goalsMessage && (
                <div
                  className={`text-xs px-4 py-2.5 rounded-lg border max-w-md flex items-center gap-2 ${
                    goalsMessage.type === "success"
                      ? "bg-[#8ba889]/15 border-[#8ba889]/30 text-[#2a5628]"
                      : "bg-[#ba1a1a]/10 border-[#ba1a1a]/25 text-[#ba1a1a]"
                  }`}
                >
                  {goalsMessage.type === "success" ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                  {goalsMessage.text}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingGoals}
                  className="px-5 py-2.5 rounded-lg bg-[#1a2e44] text-white text-xs font-[600] hover:bg-[#2d4460] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-paper-sm"
                >
                  {isSavingGoals && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Salvar metas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {activeTab === "estatisticas" && (
        <div className="space-y-6">
          {}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-xl p-5 shadow-paper border border-[#e4e2e2]">
              <div className="text-[10px] text-[#74777d] font-[500] uppercase tracking-widest mb-1.5">
                Total de revisões
              </div>
              <div
                style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                className="text-3xl text-[#1b1c1c]"
              >
                {stats.totalCompletedSessions}
              </div>
              <div className="text-xs text-[#74777d] mt-1">
                {stats.sessionsThisWeek} concluídas esta semana
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-paper border border-[#e4e2e2]">
              <div className="text-[10px] text-[#74777d] font-[500] uppercase tracking-widest mb-1.5">
                Retenção média global
              </div>
              <div
                style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                className={`text-3xl ${
                  stats.globalAvgScore === null
                    ? "text-[#74777d]"
                    : stats.globalAvgScore >= 80
                      ? "text-[#2a5628]"
                      : stats.globalAvgScore >= 60
                        ? "text-[#7a5a00]"
                        : "text-[#ba1a1a]"
                }`}
              >
                {stats.globalAvgScore !== null
                  ? `${stats.globalAvgScore}%`
                  : "—"}
              </div>
              <div className="text-xs text-[#74777d] mt-1">
                taxa média de acerto
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-paper border border-[#e4e2e2]">
              <div className="text-[10px] text-[#74777d] font-[500] uppercase tracking-widest mb-1.5">
                Livros consolidados
              </div>
              <div
                style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                className="text-3xl text-[#2a5628]"
              >
                {stats.consolidatedBooksCount}
              </div>
              <div className="text-xs text-[#74777d] mt-1">
                de {stats.completedBooksCount} livros lidos
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-paper border border-[#e4e2e2]">
              <div className="text-[10px] text-[#74777d] font-[500] uppercase tracking-widest mb-1.5">
                Em consolidação ativa
              </div>
              <div
                style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                className="text-3xl text-[#1a2e44]"
              >
                {stats.consolidatingBooksCount}
              </div>
              <div className="text-xs text-[#74777d] mt-1">
                no ciclo de revisão espaçada
              </div>
            </div>
          </div>

          {}
          <div className="bg-white rounded-xl p-6 shadow-paper border border-[#e4e2e2]">
            <h3 className="text-base font-[600] text-[#1b1c1c] mb-1">
              Desempenho por Modalidade de Consolidação
            </h3>
            <p className="text-xs text-[#74777d] mb-5">
              O método FAST equilibra os três níveis de recuperação do
              conhecimento.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(["direct", "guided", "recognition"] as SessionMode[]).map(
                (mode) => {
                  const item = stats.modeStats[mode];
                  const details: Record<
                    SessionMode,
                    {
                      icon: string;
                      subtitle: string;
                    }
                  > = {
                    direct: {
                      icon: "🃏",
                      subtitle: "Recuperação ativa sem pistas",
                    },
                    guided: {
                      icon: "💬",
                      subtitle: "Técnica de Feynman / autoexplicação",
                    },
                    recognition: {
                      icon: "🔍",
                      subtitle: "Aplicação em cenários do mundo real",
                    },
                  };

                  return (
                    <div
                      key={mode}
                      className="bg-[#fbf9f8] border border-[#e4e2e2] rounded-xl p-4.5 space-y-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{details[mode].icon}</span>
                        <div>
                          <div className="text-xs font-[600] text-[#1b1c1c]">
                            {modeLabels[mode]}
                          </div>
                          <div className="text-[10px] text-[#74777d]">
                            {details[mode].subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#e4e2e2] flex items-center justify-between text-xs">
                        <span className="text-[#74777d]">Sessões:</span>
                        <span className="font-mono font-[600] text-[#1b1c1c]">
                          {item.count}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#74777d]">Média de acerto:</span>
                        <span
                          className={`font-mono font-[600] ${
                            item.avgScore === null
                              ? "text-[#74777d]"
                              : item.avgScore >= 80
                                ? "text-[#2a5628]"
                                : item.avgScore >= 60
                                  ? "text-[#7a5a00]"
                                  : "text-[#ba1a1a]"
                          }`}
                        >
                          {item.avgScore !== null ? `${item.avgScore}%` : "—"}
                        </span>
                      </div>
                    </div>
                  );
                },
              )}
            </div>

            {stats.totalCompletedSessions === 0 && (
              <div className="mt-6 text-center py-6 px-4 bg-[#f9f7f4] rounded-lg border border-dashed border-[#c4c6cd]">
                <p className="text-xs text-[#74777d]">
                  Você ainda não realizou sessões de revisão. Acesse o Painel ou
                  a Biblioteca para iniciar sua primeira consolidação!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {}
      {activeTab === "lembretes" && (
        <div className="space-y-6">
          <NotificationSettings />
        </div>
      )}
    </div>
  );
}
