"use client"; /* Hero header */ /* Back */ /* Meta */ /* Progress */ /* Stats */ /* Actions */ /* Tabs */ /* Tab content */ /* Chapters */ /* Summary */ /* Revisions */ /* Bar chart */ /* Revision list */ /* Delete Confirmation Modal */
import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Book } from "@/domain/types";
import {
  statusLabels,
  consolidationLabels,
  modeLabels,
} from "@/domain/constants";
import {
  avgScore,
  coverGradient,
  effectiveConsolidationState,
  lastPerformance,
  pendingSessions,
  sessionHistory,
  type SessionHistoryEntry,
} from "@/domain/derived";
import { updateBook, startReading, deleteBook } from "@/app/actions/books";
import {
  createChapter,
  toggleChapterRead,
  deleteChapter,
} from "@/app/actions/chapters";
import {
  cancelSessionAction,
  startSessionAction,
} from "@/app/actions/sessions";
import { BookModal } from "@/components/BookModal";

function BookCover({
  coverUrl,
  title,
  gradient,
}: {
  coverUrl?: string | null;
  title: string;
  gradient: [string, string];
}) {
  if (coverUrl) {
    return (
      <div className="relative w-20 h-28 rounded-[6px] shrink-0 overflow-hidden shadow-[4px_6px_20px_rgba(0,0,0,0.25)] bg-[#e4e2e2]">
        <Image
          src={coverUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>
    );
  }

  return (
    <div
      className="w-20 h-28 rounded-[6px] shrink-0"
      style={{
        background: `linear-gradient(160deg, ${gradient[0]}, ${gradient[1]})`,
        boxShadow: "4px 6px 20px rgba(0,0,0,0.25)",
      }}
    />
  );
}

function SessionHistoryRow({
  entry,
  onCancel,
  cancelling,
}: {
  entry: SessionHistoryEntry;
  onCancel: (sessionId: string) => void;
  cancelling: boolean;
}) {
  const [open, setOpen] = useState(false);
  const date = (entry.completedAt ?? entry.startedAt).toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "short", year: "2-digit" },
  );
  const score = entry.score ?? 0;
  const scoreColor = entry.pending
    ? "text-[#74777d]"
    : score >= 80
      ? "text-[#2a5628]"
      : score >= 60
        ? "text-[#7a5a00]"
        : "text-[#ba1a1a]";
  const barColor =
    score >= 80
      ? "bg-[#8ba889]"
      : score >= 60
        ? "bg-[#f2d492]"
        : "bg-[#ba1a1a]/60";

  return (
    <div className="border-b border-[#f0eeee] last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 py-3 text-left"
      >
        <div className="text-xs text-[#74777d] font-mono w-20 shrink-0">
          {date}
        </div>
        <div className="text-xs text-[#43474d] flex-1">
          {entry.mode ? modeLabels[entry.mode] : "Modalidade não definida"}
        </div>
        {entry.pending ? (
          <span className="text-[10px] font-[500] px-2 py-0.5 rounded-full bg-[#f2d492]/40 text-[#7a5a00]">
            Em andamento
          </span>
        ) : (
          <>
            <div className="w-24">
              <div className="h-[2px] bg-[#e4e2e2] rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
            <div
              className={`text-sm font-mono font-[600] w-10 text-right ${scoreColor}`}
            >
              {score}%
            </div>
          </>
        )}
      </button>

      {open && (
        <div className="pb-4 pl-4 space-y-3">
          {entry.pending && (
            <div className="flex gap-2">
              <Link
                href={`/sessoes/${entry.id}`}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#1a2e44] text-white font-[500]"
              >
                Continuar
              </Link>
              <button
                type="button"
                disabled={cancelling}
                onClick={() => onCancel(entry.id)}
                className="text-xs px-3 py-1.5 rounded-lg border border-[#ba1a1a]/30 text-[#ba1a1a] disabled:opacity-40"
              >
                Cancelar sessão
              </button>
            </div>
          )}
          {entry.attempts.length === 0 ? (
            <div className="text-xs text-[#74777d]">
              Nenhuma tentativa registrada ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {entry.attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="text-[#1b1c1c] leading-relaxed">
                      {attempt.questionText ?? "Pergunta removida"}
                    </div>
                    {attempt.chapterTitle && (
                      <div className="text-[#74777d] mt-0.5">
                        {attempt.chapterTitle}
                      </div>
                    )}
                  </div>
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded font-mono ${
                      attempt.performance === "correct"
                        ? "bg-[#8ba889]/20 text-[#2a5628]"
                        : attempt.performance === "partial"
                          ? "bg-[#f2d492]/30 text-[#7a5a00]"
                          : "bg-[#ba1a1a]/10 text-[#ba1a1a]"
                    }`}
                  >
                    {attempt.performance === "correct"
                      ? "✓"
                      : attempt.performance === "partial"
                        ? "◐"
                        : "✗"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface NewChapterForm {
  title: string;
  description: string;
}

interface ChapterSaveData {
  title: string;
  description?: string;
}

interface AddChapterFormProps {
  onSave: (data: ChapterSaveData) => void;
  onCancel: () => void;
  isPending?: boolean;
}

function AddChapterForm({
  onSave,
  onCancel,
  isPending = false,
}: AddChapterFormProps) {
  const [form, setForm] = useState<NewChapterForm>({
    title: "",
    description: "",
  });
  const canSave = form.title.trim().length > 0;

  return (
    <div className="bg-white rounded-xl border-2 border-[#1a2e44]/30 shadow-paper p-5 space-y-4">
      <div className="text-[11px] font-[600] text-[#1a2e44] uppercase tracking-widest">
        Novo capítulo
      </div>

      <div>
        <label className="text-xs font-[500] text-[#43474d] mb-1.5 block">
          Título *
        </label>
        <input
          className="w-full px-3.5 py-3 text-sm bg-[#f9f7f4] border-b-2 border-[#e4e2e2] focus:border-[#1a2e44] outline-none rounded-t-md text-[#1b1c1c] transition-colors"
          placeholder="ex.: O poder dos pequenos hábitos"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          autoFocus
        />
      </div>

      <div>
        <label className="text-xs font-[500] text-[#43474d] mb-1.5 block">
          Descrição
        </label>
        <textarea
          className="w-full px-3.5 py-3 text-sm bg-[#f9f7f4] border-b-2 border-[#e4e2e2] focus:border-[#1a2e44] outline-none rounded-t-md text-[#1b1c1c] leading-relaxed resize-none transition-colors"
          rows={2}
          placeholder="Do que trata esse capítulo? (opcional)"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 py-2.5 rounded-lg border border-[#e4e2e2] text-sm font-[500] text-[#43474d] hover:bg-[#f5f3f3] transition-colors disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          disabled={!canSave || isPending}
          onClick={() =>
            onSave({
              title: form.title,
              description: form.description.trim() || undefined,
            })
          }
          className="flex-1 py-2.5 rounded-lg bg-[#1a2e44] text-white text-sm font-[600] hover:bg-[#2d4460] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          Salvar capítulo
        </button>
      </div>
    </div>
  );
}

export function BookDetail({ book }: { book: Book }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: "chapters" | "summary" | "revisions" =
    tabParam === "summary" || tabParam === "revisions" ? tabParam : "chapters";
  const setActiveTab = (tab: "chapters" | "summary" | "revisions") => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "chapters") params.delete("tab");
    else params.set("tab", tab);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };
  const [sessionOpen, setSessionOpen] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState(book.summary ?? "");
  const [addingChapter, setAddingChapter] = useState(false);
  const [editBookOpen, setEditBookOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const readChapters = book.chapters.filter((c) => c.isRead).length;
  const chaptersWithQuestions = book.chapters.filter(
    (c) => c.questions.length > 0,
  );
  const totalQuestions = book.chapters.reduce(
    (a, c) => a + c.questions.length,
    0,
  );
  const avg = avgScore(book);
  const history = sessionHistory(book);
  const completedHistory = history.filter((s) => !s.pending);
  const pending = pendingSessions(book);
  const consolidation = effectiveConsolidationState(book);

  const progress =
    book.totalChapters > 0 && readChapters > 0
      ? Math.round((readChapters / book.totalChapters) * 100)
      : 0;

  const saveSummary = () => {
    startTransition(async () => {
      const res = await updateBook(book.id, { summary: summaryDraft });
      if (res.success) {
        setEditingSummary(false);
      } else {
        alert(res.error || "Erro ao salvar resumo");
      }
    });
  };

  return (
    <div className="min-h-full bg-[#fbf9f8]">
      {}
      <div className="bg-white border-b border-[#e4e2e2]">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {}
          <Link
            href="/biblioteca"
            className="flex items-center gap-2 text-[#74777d] hover:text-[#1b1c1c] text-xs font-[500] mb-6 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Biblioteca
          </Link>

          <div className="flex flex-wrap items-start gap-6 md:flex-nowrap md:gap-8">
            <BookCover
              coverUrl={book.coverUrl}
              title={book.title}
              gradient={coverGradient(book.id)}
            />

            <div className="flex-1 min-w-0">
              <h1
                style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                className="text-2xl leading-tight tracking-[-0.01em] text-[#1b1c1c] sm:text-3xl"
              >
                {book.title}
              </h1>
              <div className="text-[#74777d] mt-1">{book.author}</div>

              {}
              <div className="flex items-center gap-2.5 flex-wrap mt-4">
                <span
                  className={`text-[11px] font-[500] px-2.5 py-1 rounded-full ${
                    book.status === "reading"
                      ? "bg-[#1a2e44]/10 text-[#1a2e44]"
                      : book.status === "completed"
                        ? "bg-[#8ba889]/20 text-[#2a5628]"
                        : "bg-[#74777d]/10 text-[#4a4a5a]"
                  }`}
                >
                  {statusLabels[book.status]}
                </span>
                {book.status === "completed" && (
                  <span
                    className={`text-[11px] font-[500] px-2.5 py-1 rounded-full ${
                      consolidation === "consolidated"
                        ? "bg-[#8ba889]/20 text-[#2a5628]"
                        : consolidation === "archived"
                          ? "bg-[#74777d]/10 text-[#74777d]"
                          : "bg-[#f2d492]/30 text-[#7a5a00]"
                    }`}
                  >
                    {consolidationLabels[consolidation]}
                  </span>
                )}
                {book.year && (
                  <span className="text-xs text-[#74777d] font-mono">
                    {book.year}
                  </span>
                )}
                {book.pages && (
                  <span className="text-xs text-[#74777d] font-mono">
                    {book.pages} páginas
                  </span>
                )}
              </div>

              {}
              {book.status === "reading" && (
                <div className="mt-5 max-w-sm">
                  <div className="flex justify-between text-xs font-mono text-[#74777d] mb-1.5">
                    <span>
                      Capítulo {book.currentChapter} de {book.totalChapters}
                    </span>
                    <span className="text-[#1a2e44] font-[600]">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-[2px] bg-[#e4e2e2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8ba889] rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {}
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs font-mono">
                {totalQuestions > 0 && (
                  <div>
                    <div className="text-[#74777d]">Perguntas</div>
                    <div className="text-[#1b1c1c] font-[600] mt-0.5">
                      {totalQuestions}
                    </div>
                  </div>
                )}
                {chaptersWithQuestions.length > 0 && (
                  <div>
                    <div className="text-[#74777d]">Cap. anotados</div>
                    <div className="text-[#1b1c1c] font-[600] mt-0.5">
                      {chaptersWithQuestions.length}
                    </div>
                  </div>
                )}
                {history.length > 0 && (
                  <div>
                    <div className="text-[#74777d]">Revisões</div>
                    <div className="text-[#1b1c1c] font-[600] mt-0.5">
                      {history.length}
                    </div>
                  </div>
                )}
                {avg !== null && (
                  <div>
                    <div className="text-[#74777d]">Média de desempenho</div>
                    <div
                      className={`font-[600] mt-0.5 ${
                        avg >= 80
                          ? "text-[#2a5628]"
                          : avg >= 60
                            ? "text-[#7a5a00]"
                            : "text-[#ba1a1a]"
                      }`}
                    >
                      {avg}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            {}
            <div className="flex w-full shrink-0 flex-col gap-2 md:w-auto">
              {(book.status === "want" || book.status === "paused") && (
                <button
                  onClick={() => {
                    startTransition(async () => {
                      await startReading(book.id);
                    });
                  }}
                  disabled={isPending}
                  className="flex w-full items-center gap-2 rounded-lg bg-[#1a2e44] px-4 py-2.5 text-sm font-[600] text-white transition-colors hover:bg-[#2d4460] disabled:opacity-50 md:w-auto"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  {book.status === "paused"
                    ? "Retomar leitura"
                    : "Iniciar leitura"}
                </button>
              )}

              <button
                onClick={() => setEditBookOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-[#e4e2e2] px-4 py-2.5 text-sm font-[500] text-[#43474d] transition-colors hover:bg-[#f5f3f3] md:w-auto"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar livro
              </button>

              <button
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-[#ba1a1a]/30 px-4 py-2.5 text-sm font-[500] text-[#ba1a1a] transition-colors hover:bg-[#ba1a1a]/5 md:w-auto"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Excluir livro
              </button>

              {chaptersWithQuestions.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setSessionOpen(!sessionOpen)}
                    className="flex w-full items-center gap-2 rounded-lg bg-[#1a2e44] px-4 py-2.5 text-sm font-[600] text-white transition-colors hover:bg-[#2d4460]"
                  >
                    Iniciar revisão
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {sessionOpen && (
                    <div className="absolute top-12 right-0 z-10 w-60 bg-white border border-[#e4e2e2] rounded-xl overflow-hidden shadow-paper-lg">
                      {(["direct", "guided", "recognition"] as const).map(
                        (mode) => {
                          const icons = {
                            direct: "🃏",
                            guided: "💬",
                            recognition: "🔍",
                          };
                          const descs = {
                            direct: "Lembro?",
                            guided: "Explico com minhas palavras?",
                            recognition: "Reconheço em situações reais?",
                          };
                          return (
                            <button
                              key={mode}
                              onClick={() => {
                                setSessionOpen(false);
                                startTransition(async () => {
                                  await startSessionAction(book.id, { mode });
                                });
                              }}
                              className="w-full px-4 py-3.5 text-left hover:bg-[#f5f3f3] transition-colors border-b border-[#f0eeee] last:border-0"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-base">{icons[mode]}</span>
                                <div>
                                  <div className="text-xs font-[600] text-[#1b1c1c]">
                                    {modeLabels[mode]}
                                  </div>
                                  <div className="text-[10px] text-[#74777d] mt-0.5">
                                    {descs[mode]}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="-mb-px flex flex-wrap gap-1 border-b border-[#e4e2e2]">
            {(
              [
                { id: "chapters", label: "Capítulos" },
                { id: "summary", label: "Resumo pessoal" },
                {
                  id: "revisions",
                  label: `Revisões${
                    history.length > 0 ? ` (${history.length})` : ""
                  }`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-[500] transition-all ${
                  activeTab === tab.id
                    ? "border-[#1a2e44] text-[#1a2e44]"
                    : "border-transparent text-[#74777d] hover:text-[#1b1c1c]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {}
        {activeTab === "chapters" && (
          <div className="space-y-2">
            {book.chapters.map((chapter) => {
              const isExpanded = expandedChapter === chapter.id;
              const hasQ = chapter.questions.length > 0;

              return (
                <div
                  key={chapter.id}
                  className="bg-white border border-[#e4e2e2] rounded-xl overflow-hidden shadow-paper-sm"
                >
                  <div className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#f9f7f4] transition-colors">
                    <button
                      onClick={() => {
                        startTransition(async () => {
                          await toggleChapterRead(book.id, chapter.id);
                        });
                      }}
                      disabled={isPending}
                      title={
                        chapter.isRead
                          ? "Marcar como não lido"
                          : "Marcar como lido"
                      }
                      aria-label={
                        chapter.isRead
                          ? "Marcar como não lido"
                          : "Marcar como lido"
                      }
                      className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center transition-colors disabled:opacity-50 ${
                        chapter.isRead
                          ? hasQ
                            ? "bg-[#1a2e44] border-[#1a2e44]"
                            : "bg-[#8ba889] border-[#8ba889]"
                          : "border-[#c4c6cd] hover:border-[#1a2e44]/40"
                      }`}
                    >
                      {chapter.isRead && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <button
                      className="flex-1 flex items-center gap-4 text-left min-w-0"
                      onClick={() =>
                        setExpandedChapter(isExpanded ? null : chapter.id)
                      }
                    >
                      <div className="w-7 h-7 rounded-full bg-[#f5f3f3] flex items-center justify-center text-[11px] font-mono text-[#74777d] shrink-0">
                        {chapter.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-[500] ${
                            chapter.isRead ? "text-[#1b1c1c]" : "text-[#74777d]"
                          }`}
                        >
                          {chapter.title}
                        </div>
                        {chapter.description && (
                          <div className="text-xs text-[#74777d] mt-0.5 truncate">
                            {chapter.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {hasQ ? (
                          <span className="text-[11px] font-mono text-[#74777d]">
                            {chapter.questions.length} perg.
                          </span>
                        ) : chapter.isRead ? (
                          <span className="text-[10px] font-mono text-[#74777d]/50">
                            Sem anotações
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#74777d]/40">
                            Não lido
                          </span>
                        )}
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`text-[#74777d] transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-[#f0eeee]">
                      {chapter.summary && (
                        <div className="mt-4 mb-4 pl-4 border-l-2 border-[#1a2e44]/20">
                          <div className="text-[10px] font-[500] text-[#74777d] uppercase tracking-widest mb-1.5">
                            Resumo
                          </div>
                          <p className="text-sm text-[#43474d] leading-relaxed">
                            {chapter.summary}
                          </p>
                        </div>
                      )}

                      {hasQ && (
                        <div className="mt-4 space-y-3">
                          {chapter.questions.map((q, i) => (
                            <div
                              key={q.id}
                              className="p-3.5 bg-[#f9f7f4] rounded-lg"
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-[10px] font-mono text-[#1a2e44]/50 shrink-0 mt-0.5">
                                  Q{i + 1}
                                </span>
                                <div>
                                  <div className="text-sm text-[#1b1c1c] font-[500] leading-snug">
                                    {q.text}
                                  </div>
                                  <div className="text-xs text-[#43474d] mt-2 leading-relaxed">
                                    {q.answer}
                                  </div>
                                  {(() => {
                                    const perf = lastPerformance(q, book);
                                    return (
                                      perf && (
                                        <span
                                          className={`mt-2 text-[10px] font-mono px-2 py-0.5 rounded inline-block ${
                                            perf === "correct"
                                              ? "bg-[#8ba889]/20 text-[#2a5628]"
                                              : perf === "partial"
                                                ? "bg-[#f2d492]/30 text-[#7a5a00]"
                                                : "bg-[#ba1a1a]/10 text-[#ba1a1a]"
                                          }`}
                                        >
                                          {perf === "correct"
                                            ? "✓ Acertei"
                                            : perf === "partial"
                                              ? "◐ Parcial"
                                              : "✗ Errei"}
                                        </span>
                                      )
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/livros/${book.id}/capitulos/${chapter.id}`}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#e4e2e2] text-[#43474d] hover:bg-[#f5f3f3] transition-colors"
                        >
                          Abrir capítulo
                        </Link>
                        {hasQ && (
                          <button
                            onClick={() =>
                              startTransition(async () => {
                                await startSessionAction(book.id, {
                                  mode: "direct",
                                  chapterId: chapter.id,
                                });
                              })
                            }
                            className="text-xs px-3 py-1.5 rounded-lg bg-[#1a2e44]/8 text-[#1a2e44] hover:bg-[#1a2e44]/15 transition-colors font-[500]"
                          >
                            Revisar capítulo
                          </button>
                        )}
                        <button
                          disabled={isPending}
                          onClick={() => {
                            startTransition(async () => {
                              await toggleChapterRead(book.id, chapter.id);
                            });
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#e4e2e2] text-[#43474d] hover:bg-[#f5f3f3] transition-colors disabled:opacity-50"
                        >
                          {chapter.isRead
                            ? "Marcar como não lido"
                            : "Marcar como lido"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {book.chapters.length === 0 && !addingChapter && (
              <div className="py-12 text-center bg-white rounded-xl border border-dashed border-[#c4c6cd] shadow-paper-sm">
                <h3
                  style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                  className="text-xl text-[#1b1c1c] mb-2"
                >
                  Nenhum capítulo cadastrado
                </h3>
                <p className="text-sm text-[#74777d] mb-6 max-w-sm mx-auto leading-relaxed">
                  Adicione os capítulos conforme for lendo o livro.
                </p>
                <button
                  onClick={() => setAddingChapter(true)}
                  className="px-5 py-2.5 bg-[#1a2e44] text-white text-sm font-[600] rounded-lg hover:bg-[#2d4460] transition-colors"
                >
                  Adicionar capítulo
                </button>
              </div>
            )}

            {addingChapter && (
              <AddChapterForm
                isPending={isPending}
                onSave={(data) => {
                  startTransition(async () => {
                    const res = await createChapter(book.id, data);
                    if (res.success) {
                      setAddingChapter(false);
                    } else {
                      alert(res.error || "Erro ao adicionar capítulo");
                    }
                  });
                }}
                onCancel={() => setAddingChapter(false)}
              />
            )}

            {!addingChapter && book.chapters.length > 0 && (
              <button
                onClick={() => setAddingChapter(true)}
                className="w-full py-3 text-xs text-[#74777d] border border-dashed border-[#c4c6cd] rounded-xl hover:border-[#1a2e44]/40 hover:text-[#1a2e44] transition-all flex items-center justify-center gap-2"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Adicionar capítulo
              </button>
            )}
          </div>
        )}

        {}
        {activeTab === "summary" && (
          <div>
            {editingSummary ? (
              <div>
                <div className="text-[11px] font-[500] text-[#74777d] uppercase tracking-widest mb-3">
                  Resumo pessoal
                </div>
                <textarea
                  className="w-full px-4 py-3.5 text-sm text-[#1b1c1c] bg-white border border-[#1a2e44] rounded-xl focus:outline-none leading-relaxed resize-none shadow-paper-sm"
                  rows={10}
                  placeholder="Escreva aqui suas principais aprendizagens, insights e ideias que deseja lembrar..."
                  value={summaryDraft}
                  onChange={(e) => setSummaryDraft(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-3 mt-4">
                  <button
                    disabled={isPending}
                    onClick={() => {
                      setSummaryDraft(book.summary ?? "");
                      setEditingSummary(false);
                    }}
                    className="px-4 py-2.5 rounded-lg border border-[#e4e2e2] text-sm font-[500] text-[#43474d] hover:bg-[#f5f3f3] transition-colors disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={isPending}
                    onClick={saveSummary}
                    className="px-4 py-2.5 rounded-lg bg-[#1a2e44] text-white text-sm font-[600] hover:bg-[#2d4460] transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isPending && (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Salvar resumo
                  </button>
                </div>
              </div>
            ) : book.summary ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[11px] font-[500] text-[#74777d] uppercase tracking-widest">
                    Resumo pessoal
                  </div>
                  <button
                    onClick={() => {
                      setSummaryDraft(book.summary ?? "");
                      setEditingSummary(true);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#e4e2e2] text-[#43474d] hover:bg-[#f5f3f3] transition-colors flex items-center gap-1.5"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Editar
                  </button>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-paper">
                  <p className="text-[15px] text-[#1b1c1c] leading-relaxed">
                    {book.summary}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-[#f5f3f3] flex items-center justify-center mx-auto mb-4">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#74777d"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <h3
                  style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                  className="text-xl text-[#1b1c1c] mb-2"
                >
                  Sem resumo ainda
                </h3>
                <p className="text-sm text-[#74777d] mb-6 max-w-sm mx-auto leading-relaxed">
                  Tente lembrar espontaneamente as ideias principais antes de
                  consultar suas anotações.
                </p>
                <button
                  onClick={() => {
                    setSummaryDraft("");
                    setEditingSummary(true);
                  }}
                  className="px-5 py-2.5 bg-[#1a2e44] text-white text-sm font-[600] rounded-lg hover:bg-[#2d4460] transition-colors"
                >
                  Escrever resumo
                </button>
              </div>
            )}
          </div>
        )}

        {}
        {activeTab === "revisions" && (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-paper border border-[#f2d492]/60">
                <div className="text-[10px] font-[600] text-[#7a5a00] uppercase tracking-widest mb-3">
                  Em andamento
                </div>
                <div className="space-y-3">
                  {pending.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="text-sm text-[#43474d]">
                        {session.mode
                          ? modeLabels[session.mode]
                          : "Sessão iniciada"}{" "}
                        ·{" "}
                        {session.startedAt.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/sessoes/${session.id}`}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#1a2e44] text-white font-[500]"
                        >
                          Continuar
                        </Link>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              await cancelSessionAction(session.id);
                            })
                          }
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#ba1a1a]/30 text-[#ba1a1a] disabled:opacity-40"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedHistory.length > 0 ? (
              <>
                <div className="bg-white rounded-xl p-6 shadow-paper border border-[#e4e2e2]">
                  <div className="text-[10px] font-[500] text-[#74777d] uppercase tracking-widest mb-4">
                    Evolução do desempenho
                  </div>
                  <div className="flex items-end gap-4 h-20">
                    {[...completedHistory].reverse().map((r) => {
                      const score = r.score ?? 0;
                      const barColor =
                        score >= 80
                          ? "bg-[#8ba889]"
                          : score >= 60
                            ? "bg-[#f2d492]"
                            : "bg-[#ba1a1a]/60";
                      return (
                        <div
                          key={r.id}
                          className="flex flex-col items-center gap-1 flex-1"
                        >
                          <div className="text-[11px] font-mono text-[#1b1c1c] font-[500]">
                            {score}%
                          </div>
                          <div
                            className="w-full bg-[#f0eeee] rounded-sm overflow-hidden"
                            style={{ height: "48px" }}
                          >
                            <div
                              className={`w-full ${barColor} rounded-sm`}
                              style={{
                                height: `${score}%`,
                                marginTop: `${100 - score}%`,
                              }}
                            />
                          </div>
                          <div className="text-[10px] font-mono text-[#74777d] text-center">
                            {(r.completedAt ?? r.startedAt).toLocaleDateString(
                              "pt-BR",
                              { day: "2-digit", month: "short" },
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {completedHistory.length >= 2 &&
                    (() => {
                      const chronological = [...completedHistory].reverse();
                      const diff =
                        (chronological.at(-1)!.score ?? 0) -
                        (chronological[0].score ?? 0);
                      return (
                        <div className="mt-4 pt-4 border-t border-[#f0eeee] text-sm text-[#74777d]">
                          Da primeira à última revisão:{" "}
                          <span
                            className={
                              diff >= 0
                                ? "text-[#2a5628] font-[600]"
                                : "text-[#ba1a1a] font-[600]"
                            }
                          >
                            {diff >= 0 ? "+" : ""}
                            {diff} pontos
                          </span>
                        </div>
                      );
                    })()}
                </div>

                <div className="bg-white rounded-xl p-5 shadow-paper border border-[#e4e2e2]">
                  {history.map((entry) => (
                    <SessionHistoryRow
                      key={entry.id}
                      entry={entry}
                      cancelling={isPending}
                      onCancel={(sessionId) =>
                        startTransition(async () => {
                          await cancelSessionAction(sessionId);
                        })
                      }
                    />
                  ))}
                </div>
              </>
            ) : pending.length === 0 ? (
              <div className="py-16 text-center">
                <h3
                  style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                  className="text-xl text-[#1b1c1c] mb-2"
                >
                  Nenhuma revisão ainda
                </h3>
                <p className="text-sm text-[#74777d] mb-6">
                  Inicie uma sessão para registrar seu primeiro desempenho.
                </p>
                {chaptersWithQuestions.length > 0 && (
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await startSessionAction(book.id);
                      })
                    }
                    className="px-5 py-2.5 bg-[#1a2e44] text-white text-sm font-[600] rounded-lg hover:bg-[#2d4460] transition-colors"
                  >
                    Iniciar primeira revisão
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {editBookOpen && (
        <BookModal
          editBook={book}
          isPending={isPending}
          errorMessage={errorMessage}
          onClose={() => {
            setEditBookOpen(false);
            setErrorMessage(null);
          }}
          onSave={async (data) => {
            setErrorMessage(null);
            startTransition(async () => {
              const res = await updateBook(book.id, data);
              if (res.success) {
                setEditBookOpen(false);
              } else {
                setErrorMessage(res.error || "Erro ao salvar alterações");
              }
            });
          }}
        />
      )}

      {}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setConfirmDelete(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-paper-lg p-6 space-y-4">
            <h3
              style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
              className="text-lg text-[#1b1c1c]"
            >
              Excluir livro?
            </h3>
            <p className="text-sm text-[#74777d] leading-relaxed">
              Tem certeza de que deseja excluir &ldquo;{book.title}&rdquo;? O
              livro será removido da sua biblioteca.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                disabled={isPending}
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#e4e2e2] text-sm font-[500] text-[#43474d] hover:bg-[#f5f3f3] transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const res = await deleteBook(book.id);
                    if (res.success) {
                      router.push("/biblioteca");
                      router.refresh();
                    } else {
                      alert(res.error || "Erro ao excluir livro");
                    }
                  });
                }}
                className="flex-1 py-2.5 rounded-lg bg-[#ba1a1a] text-white text-sm font-[600] hover:bg-[#ba1a1a]/90 transition-colors flex items-center justify-center gap-2"
              >
                {isPending && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
