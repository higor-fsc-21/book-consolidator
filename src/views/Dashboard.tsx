"use client"; /* Header */ /* Primary row */ /* Currently reading */ /* Recommended for revision */ /* Stats row */ /* Annual goal progress */ /* Recent revision timeline */ /* Vertical line */ /* Dot */ /* Content */
import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Book } from "@/domain/types";
import { ANNUAL_GOAL, modeLabels } from "@/domain/constants";
import {
  getReadingBook,
  getCompletedBooks,
  getRecommendedBook,
  avgScore,
  coverGradient,
  readingProgress,
  daysSince,
  timeline,
  pendingSessionsFor,
  effectiveConsolidationState,
  importanceLabel,
  isRevisionDueToday,
} from "@/domain/derived";
import { utcDayDiff } from "@/domain/scheduling";
import {
  cancelSessionAction,
  startSessionAction,
} from "@/app/actions/sessions";

function BookCover({
  gradient,
  coverUrl,
  title,
  size = "md",
}: {
  gradient: [string, string];
  coverUrl?: string | null;
  title?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "sm" ? "w-8 h-11" : size === "md" ? "w-12 h-17" : "w-20 h-28";
  const imgSizes = size === "sm" ? "32px" : size === "md" ? "48px" : "80px";

  if (coverUrl) {
    return (
      <div
        className={`relative ${dims} rounded-[5px] shrink-0 overflow-hidden bg-[#e4e2e2]`}
        style={{
          boxShadow: "3px 4px 12px rgba(0,0,0,0.25)",
          minWidth: size === "sm" ? "32px" : size === "md" ? "48px" : "80px",
          minHeight: size === "sm" ? "44px" : size === "md" ? "68px" : "112px",
        }}
      >
        <Image
          src={coverUrl}
          alt={title || "Capa do livro"}
          fill
          className="object-cover"
          sizes={imgSizes}
        />
      </div>
    );
  }

  return (
    <div
      className={`${dims} rounded-[5px] shrink-0`}
      style={{
        background: `linear-gradient(160deg, ${gradient[0]}, ${gradient[1]})`,
        boxShadow: "3px 4px 12px rgba(0,0,0,0.25)",
        minWidth: size === "sm" ? "32px" : size === "md" ? "48px" : "80px",
        minHeight: size === "sm" ? "44px" : size === "md" ? "68px" : "112px",
      }}
    />
  );
}

function ScoreChip({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-[#2a5628] bg-[#8ba889]/20"
      : score >= 60
        ? "text-[#7a5a00] bg-[#f2d492]/30"
        : "text-[#ba1a1a] bg-[#ba1a1a]/10";
  return (
    <span
      className={`text-[11px] font-mono font-[500] px-2 py-0.5 rounded-full ${color}`}
    >
      {score}%
    </span>
  );
}

export function Dashboard({
  books,
  dateStr,
}: {
  books: Book[];
  dateStr: string;
}) {
  const [isStartingSession, startTransition] = useTransition();
  const [, startCancelTransition] = useTransition();
  const [cancelingSessionId, setCancelingSessionId] = useState<string | null>(
    null,
  );
  const [cancelError, setCancelError] = useState<string | null>(null);
  const readingBook = getReadingBook(books);
  const completed = getCompletedBooks(books);
  const recommendedBook = getRecommendedBook(books);
  const pending = pendingSessionsFor(books);
  const bookById = new Map(books.map((b) => [b.id, b]));

  const daysSinceRevision = recommendedBook?.lastRevision
    ? daysSince(recommendedBook.lastRevision)
    : null;

  const progress = readingBook ? readingProgress(readingBook) : 0;
  const recAvgScore = recommendedBook ? avgScore(recommendedBook) : null;
  const revisionTimeline = timeline(books);
  const recommendedDueToday = recommendedBook
    ? isRevisionDueToday(recommendedBook)
    : false;
  const daysUntilRevision =
    recommendedBook?.nextRevision && !recommendedDueToday
      ? utcDayDiff(recommendedBook.nextRevision, new Date())
      : null;
  const dueLabel =
    daysUntilRevision === null || daysUntilRevision <= 0
      ? null
      : daysUntilRevision === 1
        ? "amanhã"
        : `em ${daysUntilRevision} dias`;

  const handleCancelSession = (sessionId: string) => {
    setCancelError(null);
    setCancelingSessionId(sessionId);
    startCancelTransition(async () => {
      const res = await cancelSessionAction(sessionId);
      if (!res.success) setCancelError(res.error);
      setCancelingSessionId(null);
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {}
      <div>
        <div className="text-xs text-[#74777d] font-[500] uppercase tracking-widest mb-1">
          {dateStr}
        </div>
        <h1
          style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
          className="text-4xl text-[#1b1c1c] tracking-[-0.02em]"
        >
          O que importa agora
        </h1>
        <p className="text-[#74777d] text-sm mt-1.5">
          Construa uma memória do que aprendeu — um capítulo de cada vez.
        </p>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {}
        {readingBook ? (
          <Link
            href={`/livros/${readingBook.id}`}
            className="bg-white rounded-xl p-6 shadow-paper hover:shadow-paper-lg transition-shadow flex flex-col"
          >
            <div className="text-[10px] text-[#74777d] font-[500] uppercase tracking-widest mb-4">
              Lendo agora
            </div>
            <div className="flex gap-5 flex-1">
              <BookCover
                gradient={coverGradient(readingBook.id)}
                coverUrl={readingBook.coverUrl}
                title={readingBook.title}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <h2
                  style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                  className="text-xl text-[#1b1c1c] leading-tight"
                >
                  {readingBook.title}
                </h2>
                <div className="text-sm text-[#74777d] mt-1">
                  {readingBook.author}
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#74777d] font-mono">
                      Cap. {readingBook.currentChapter} /{" "}
                      {readingBook.totalChapters}
                    </span>
                    <span className="font-mono font-[600] text-[#1a2e44]">
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
              </div>
            </div>

            <div className="mt-6">
              <span className="inline-block text-xs px-4 py-2 rounded-lg bg-[#1a2e44] text-white font-[600] hover:bg-[#2d4460] transition-colors">
                Abrir livro
              </span>
            </div>
          </Link>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow-paper flex flex-col items-center justify-center border border-dashed border-[#c4c6cd]">
            <div className="text-center">
              <div className="text-[#74777d] text-sm">
                Nenhum livro em leitura
              </div>
              <Link
                href="/biblioteca"
                className="mt-3 inline-block text-xs px-4 py-2 rounded-lg bg-[#1a2e44] text-white font-[600]"
              >
                Ver biblioteca
              </Link>
            </div>
          </div>
        )}

        {}
        {recommendedBook && (
          <div className="bg-white rounded-xl p-6 shadow-paper border-l-4 border-[#1a2e44] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-[10px] text-[#1a2e44] font-[600] uppercase tracking-widest">
                Recomendado para revisão
              </div>
              {recommendedDueToday && (
                <div className="px-2 py-0.5 rounded-full bg-[#f2d492]/40 text-[#7a5a00] text-[10px] font-[500]">
                  hoje
                </div>
              )}
              {dueLabel && (
                <div className="px-2 py-0.5 rounded-full bg-[#1a2e44]/10 text-[#1a2e44] text-[10px] font-[500]">
                  {dueLabel}
                </div>
              )}
            </div>

            <div className="flex gap-4 flex-1">
              <BookCover
                gradient={coverGradient(recommendedBook.id)}
                coverUrl={recommendedBook.coverUrl}
                title={recommendedBook.title}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <h2
                  style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                  className="text-xl text-[#1b1c1c] leading-tight"
                >
                  {recommendedBook.title}
                </h2>
                <div className="text-sm text-[#74777d] mt-0.5">
                  {recommendedBook.author}
                </div>

                <ul className="mt-3 space-y-1">
                  {daysSinceRevision !== null && (
                    <li className="text-xs text-[#43474d] flex gap-2">
                      <span className="text-[#1a2e44]">•</span>
                      Sem revisão há{" "}
                      <span className="text-[#1b1c1c] font-[600]">
                        {daysSinceRevision} dias
                      </span>
                    </li>
                  )}
                  {recAvgScore !== null && (
                    <li className="text-xs text-[#43474d] flex gap-2">
                      <span className="text-[#1a2e44]">•</span>
                      Média de desempenho:{" "}
                      <span className="text-[#1b1c1c] font-[600]">
                        {recAvgScore}%
                      </span>
                    </li>
                  )}
                  <li className="text-xs text-[#43474d] flex gap-2">
                    <span className="text-[#1a2e44]">•</span>
                    Marcado como{" "}
                    <span className="text-[#1b1c1c] font-[600]">
                      {importanceLabel(recommendedBook).toLowerCase()}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                disabled={isStartingSession}
                onClick={() =>
                  startTransition(async () => {
                    await startSessionAction(recommendedBook.id);
                  })
                }
                className="text-xs px-4 py-2 rounded-lg bg-[#1a2e44] text-white font-[600] hover:bg-[#2d4460] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isStartingSession && (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Iniciar revisão
              </button>
              <Link
                href={`/livros/${recommendedBook.id}`}
                className="text-xs px-4 py-2 rounded-lg border border-[#c4c6cd] text-[#43474d] font-[600] hover:bg-[#f5f3f3] hover:text-[#1b1c1c] transition-colors"
              >
                Abrir livro
              </Link>
            </div>
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-paper border border-[#f2d492]/60">
          <div className="text-[10px] text-[#7a5a00] font-[600] uppercase tracking-widest mb-4">
            Sessões em andamento
          </div>
          <div className="space-y-3">
            {pending.map((session) => {
              const book = bookById.get(session.bookId);
              if (!book) return null;
              const canceling = cancelingSessionId === session.id;
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-[500] text-[#1b1c1c] truncate">
                      {book.title}
                    </div>
                    <div className="text-xs text-[#74777d] mt-0.5">
                      {session.mode
                        ? modeLabels[session.mode]
                        : "Modalidade não definida"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCancelSession(session.id)}
                      disabled={canceling}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#ba1a1a]/25 text-[#ba1a1a] font-[600] hover:bg-[#ba1a1a]/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {canceling && (
                        <span className="w-3 h-3 border-2 border-[#ba1a1a] border-t-transparent rounded-full animate-spin" />
                      )}
                      Cancelar
                    </button>
                    <Link
                      href={`/sessoes/${session.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#1a2e44] text-white font-[600]"
                    >
                      Continuar
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          {cancelError && (
            <div className="mt-3 text-xs text-[#ba1a1a] bg-[#ba1a1a]/8 border border-[#ba1a1a]/20 rounded-lg px-3 py-2">
              {cancelError}
            </div>
          )}
        </div>
      )}

      {}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Meta anual",
            value: `${completed.length} / ${ANNUAL_GOAL}`,
            sub: `${Math.round((completed.length / ANNUAL_GOAL) * 100)}% concluído`,
          },
          {
            label: "Em consolidação",
            value: `${books.filter((b) => effectiveConsolidationState(b) === "consolidating" && b.status === "completed").length}`,
            sub: "livros precisam de atenção",
          },
          {
            label: "Livros lidos",
            value: `${completed.length}`,
            sub: `de ${ANNUAL_GOAL} na meta de 2026`,
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-paper">
            <div className="text-[10px] text-[#74777d] font-[500] uppercase tracking-widest mb-2">
              {s.label}
            </div>
            <div
              style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
              className="text-3xl text-[#1b1c1c]"
            >
              {s.value}
            </div>
            {s.sub && (
              <div className="text-xs text-[#74777d] mt-1">{s.sub}</div>
            )}
          </div>
        ))}
      </div>

      {}
      <div className="bg-white rounded-xl p-6 shadow-paper">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] text-[#74777d] font-[500] uppercase tracking-widest">
            {Math.round((completed.length / ANNUAL_GOAL) * 100)}% da meta anual
          </div>
          <div className="text-xs text-[#74777d] font-mono">
            {completed.length} / {ANNUAL_GOAL} livros
          </div>
        </div>
        <div className="h-[2px] bg-[#e4e2e2] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#8ba889] rounded-full transition-all"
            style={{ width: `${(completed.length / ANNUAL_GOAL) * 100}%` }}
          />
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl p-6 shadow-paper">
        <div className="text-[10px] text-[#74777d] font-[500] uppercase tracking-widest mb-5">
          Histórico de revisões
        </div>

        {revisionTimeline.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#74777d]">
            Nenhuma revisão registrada ainda.
          </div>
        ) : (
          <div className="relative">
            {}
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-[#e4e2e2]" />

            <div className="space-y-0">
              {revisionTimeline.map((item, idx) => {
                const revDate = new Date(item.date);
                const dateLabel = revDate.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                });
                const isFirst = idx === 0;

                return (
                  <div key={item.id} className="flex items-center gap-4 py-3">
                    {}
                    <div className={`w-[30px] flex justify-center shrink-0`}>
                      <div
                        className={`w-2.5 h-2.5 rounded-full border-2 ${
                          isFirst
                            ? "bg-[#1a2e44] border-[#1a2e44]"
                            : "bg-white border-[#c4c6cd]"
                        }`}
                      />
                    </div>

                    {}
                    <Link
                      href={`/livros/${item.book.id}`}
                      className="flex-1 flex items-center gap-3 text-left hover:bg-[#f5f3f3] rounded-lg px-3 py-2 -mx-3 transition-colors group"
                    >
                      <BookCover
                        gradient={coverGradient(item.book.id)}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-[500] text-[#1b1c1c] truncate group-hover:text-[#1a2e44] transition-colors">
                          {item.book.title}
                        </div>
                        <div className="text-xs text-[#74777d] mt-0.5">
                          {modeLabels[item.mode]}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <ScoreChip score={item.score} />
                        <div className="text-[11px] font-mono text-[#74777d] w-20 text-right">
                          {dateLabel}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
