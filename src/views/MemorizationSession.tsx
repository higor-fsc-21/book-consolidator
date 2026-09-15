"use client"; /* Progress */ /* Chapter context */ /* Question */
import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  Book,
  Chapter,
  SessionMode,
  Question,
  Performance,
  RevisionSession,
} from "@/domain/types";
import { modeLabels } from "@/domain/constants";
import {
  generateGuidedPrompt,
  generateRecognitionPrompt,
} from "@/domain/prompts";
import { calculateScore } from "@/domain/derived";
import { parseAiEvaluationJson } from "@/domain/aiResult";
import {
  cancelSessionAction,
  completeSessionAction,
  startSessionAction,
} from "@/app/actions/sessions";

interface SessionResults {
  correct: number;
  partial: number;
  wrong: number;
  total: number;
  score: number;
}

const tallyPerformances = (
  performances: Record<string, Performance>,
): Omit<SessionResults, "score"> => {
  const values = Object.values(performances);
  const correct = values.filter((p) => p === "correct").length;
  const partial = values.filter((p) => p === "partial").length;
  const wrong = values.filter((p) => p === "wrong").length;
  return { correct, partial, wrong, total: values.length };
};

const resultsFromSession = (session: RevisionSession): SessionResults => {
  const correct = session.attempts.filter(
    (a) => a.performance === "correct",
  ).length;
  const partial = session.attempts.filter(
    (a) => a.performance === "partial",
  ).length;
  const wrong = session.attempts.filter(
    (a) => a.performance === "wrong",
  ).length;
  return {
    correct,
    partial,
    wrong,
    total: session.attempts.length,
    score: Math.round(session.score ?? 0),
  };
};

function ModeCard({
  mode,
  selected,
  onSelect,
}: {
  mode: SessionMode;
  selected: boolean;
  onSelect: () => void;
}) {
  const config = {
    direct: {
      emoji: "🃏",
      subtitle: "Nível 1 — Lembrar",
      description:
        "Receba o contexto e a pergunta. Tente lembrar a resposta e depois revele para comparar. Avalie seu desempenho.",
      tag: "No app",
    },
    guided: {
      emoji: "💬",
      subtitle: "Nível 2 — Explicar",
      description:
        "Gere um prompt para uma IA conversacional. Você será testado com perguntas reformuladas e receberá feedback detalhado.",
      tag: "Via IA",
    },
    recognition: {
      emoji: "🔍",
      subtitle: "Nível 3 — Reconhecer e Aplicar",
      description:
        "Gere situações do mundo real e identifique o conceito por trás — sem que o tema seja revelado antecipadamente.",
      tag: "Via IA",
    },
  } as const;

  const c = config[mode];

  return (
    <button
      onClick={onSelect}
      className={`text-left p-5 rounded-xl border transition-all ${
        selected
          ? "border-[#1a2e44] bg-[#1a2e44]/[0.04]"
          : "border-[#e4e2e2] bg-white hover:border-[#1a2e44]/40 shadow-paper-sm"
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="text-2xl">{c.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`text-sm font-[600] ${
                selected ? "text-[#1a2e44]" : "text-[#1b1c1c]"
              }`}
            >
              {modeLabels[mode]}
            </div>
            <span className="text-[10px] font-[500] px-1.5 py-0.5 rounded bg-[#f5f3f3] text-[#74777d]">
              {c.tag}
            </span>
          </div>
          <div className="text-[11px] font-[500] text-[#1a2e44]/60 mb-2">
            {c.subtitle}
          </div>
          <p className="text-xs text-[#74777d] leading-relaxed">
            {c.description}
          </p>
        </div>
        <div
          className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
            selected ? "border-[#1a2e44] bg-[#1a2e44]" : "border-[#c4c6cd]"
          }`}
        >
          {selected && (
            <svg
              width="8"
              height="8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

function DirectSession({
  questions,
  book,
  onFinish,
  isPending = false,
}: {
  questions: Array<{
    question: Question;
    chapter: Chapter;
  }>;
  book: Book;
  onFinish: (performances: Record<string, Performance>) => void;
  isPending?: boolean;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [performances, setPerformances] = useState<Record<string, Performance>>(
    {},
  );

  const current = questions[currentIdx];
  const progress = Math.round(((currentIdx + 1) / questions.length) * 100);

  const rate = useCallback(
    (perf: Performance) => {
      const newPerf = { ...performances, [current.question.id]: perf };
      setPerformances(newPerf);

      if (currentIdx < questions.length - 1) {
        setCurrentIdx((i) => i + 1);
        setRevealed(false);
      } else {
        onFinish(newPerf);
      }
    },
    [current, currentIdx, performances, questions.length, onFinish],
  );

  return (
    <div className="max-w-2xl mx-auto px-8 py-8 space-y-5">
      {}
      <div>
        <div className="flex items-center justify-between text-xs font-mono text-[#74777d] mb-2">
          <span>
            {currentIdx + 1} de {questions.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-[2px] bg-[#e4e2e2] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1a2e44] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {}
      <div className="bg-[#f5f3f3] rounded-xl px-5 py-4 border border-[#e4e2e2]">
        <div className="text-[10px] font-[500] text-[#74777d] uppercase tracking-widest mb-1">
          Contexto
        </div>
        <div className="text-sm font-[500] text-[#1b1c1c]">{book.title}</div>
        <div className="text-xs text-[#74777d] mt-0.5">
          Cap. {current.chapter.number} · {current.chapter.title}
        </div>
        {current.chapter.description && (
          <div className="text-xs text-[#74777d]/70 mt-1.5 leading-relaxed">
            {current.chapter.description}
          </div>
        )}
      </div>

      {}
      <div className="bg-white rounded-xl p-6 border border-[#e4e2e2] shadow-paper">
        <div className="text-[10px] font-[600] text-[#1a2e44] uppercase tracking-widest mb-3">
          Pergunta
        </div>
        <p
          style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
          className="text-xl text-[#1b1c1c] leading-snug"
        >
          {current.question.text}
        </p>
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full py-3.5 rounded-xl border border-[#e4e2e2] bg-white text-[#43474d] hover:text-[#1b1c1c] hover:border-[#1a2e44]/40 hover:bg-[#f9f7f4] transition-all text-sm font-[500] flex items-center justify-center gap-2 shadow-paper-sm"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Revelar resposta
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-[#e4e2e2] shadow-paper border-l-[3px] border-l-[#1a2e44]/30">
            <div className="text-[10px] font-[500] text-[#74777d] uppercase tracking-widest mb-2">
              Resposta
            </div>
            <p className="text-sm text-[#43474d] leading-relaxed">
              {current.question.answer}
            </p>
          </div>

          <div>
            <div className="text-[11px] font-[500] text-[#74777d] text-center mb-3">
              Como você foi?
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                disabled={isPending}
                onClick={() => rate("wrong")}
                className="py-3.5 rounded-xl border border-[#ba1a1a]/25 bg-[#ba1a1a]/[0.04] text-[#ba1a1a] hover:bg-[#ba1a1a]/[0.08] transition-all text-sm font-[600] disabled:opacity-50"
              >
                <div className="text-lg mb-1">✗</div>
                Errei
              </button>
              <button
                disabled={isPending}
                onClick={() => rate("partial")}
                className="py-3.5 rounded-xl border border-[#f2d492]/50 bg-[#f2d492]/[0.15] text-[#7a5a00] hover:bg-[#f2d492]/[0.25] transition-all text-sm font-[600] disabled:opacity-50"
              >
                <div className="text-lg mb-1">◐</div>
                Parcial
              </button>
              <button
                disabled={isPending}
                onClick={() => rate("correct")}
                className="py-3.5 rounded-xl border border-[#8ba889]/30 bg-[#8ba889]/[0.08] text-[#2a5628] hover:bg-[#8ba889]/[0.15] transition-all text-sm font-[600] disabled:opacity-50"
              >
                <div className="text-lg mb-1">✓</div>
                Acertei
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PromptDisplay({
  mode,
  book,
  chapter,
  questions,
  onSave,
  isPending,
  errorMessage,
}: {
  mode: "guided" | "recognition";
  book: Book;
  chapter?: Chapter;
  questions: Array<{
    question: Question;
    chapter: Chapter;
  }>;
  onSave: (performances: Record<string, Performance>) => void;
  isPending: boolean;
  errorMessage: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [ratings, setRatings] = useState<Record<string, Performance>>({});
  const [aiResponseText, setAiResponseText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const chapterIds = chapter ? [chapter.id] : undefined;
  const prompt =
    mode === "guided"
      ? generateGuidedPrompt(book, chapterIds)
      : generateRecognitionPrompt(book, chapterIds);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportAiResponse = () => {
    setParseError(null);
    setImportSuccess(null);
    const result = parseAiEvaluationJson(aiResponseText);
    if (!result.success || !result.data) {
      setParseError(
        result.error || "Não foi possível interpretar o resultado da IA.",
      );
      return;
    }

    const newRatings = { ...ratings };
    let matchedCount = 0;
    result.data.questions.forEach((item) => {
      const targetQuestion = questions[item.index - 1];
      if (targetQuestion) {
        newRatings[targetQuestion.question.id] = item.performance;
        matchedCount++;
      }
    });

    setRatings(newRatings);
    setShowResultForm(true);
    setImportSuccess(
      `${matchedCount} ${matchedCount === 1 ? "avaliação importada" : "avaliações importadas"} com sucesso!`,
    );
  };

  const grouped = questions.reduce<
    Array<{
      chapter: Chapter;
      questions: Question[];
    }>
  >((acc, item) => {
    const last = acc[acc.length - 1];
    if (last && last.chapter.id === item.chapter.id) {
      last.questions.push(item.question);
    } else {
      acc.push({ chapter: item.chapter, questions: [item.question] });
    }
    return acc;
  }, []);

  const ratedCount = Object.keys(ratings).length;
  const allRated = questions.length > 0 && ratedCount === questions.length;
  const tally = tallyPerformances(ratings);
  const previewScore = calculateScore(tally);

  const c =
    mode === "guided"
      ? {
          title: "Explicação Guiada",
          emoji: "💬",
          instruction:
            "Copie o prompt abaixo e cole em uma IA conversacional (Claude, ChatGPT, Gemini). A IA vai te testar com perguntas reformuladas. Ao final, registre o desempenho de cada pergunta abaixo.",
        }
      : {
          title: "Reconhecimento e Aplicação",
          emoji: "🔍",
          instruction:
            "Copie o prompt e cole em uma IA. Você receberá situações práticas sem revelar o conceito testado. Ao final, registre o desempenho de cada pergunta abaixo.",
        };

  return (
    <div className="max-w-3xl mx-auto px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{c.emoji}</span>
        <div>
          <h2
            style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
            className="text-2xl text-[#1b1c1c]"
          >
            {c.title}
          </h2>
          <div className="text-xs text-[#74777d] mt-0.5">{book.title}</div>
        </div>
      </div>

      <div className="bg-[#1a2e44]/[0.05] border border-[#1a2e44]/20 rounded-xl p-5">
        <div className="text-[11px] font-[600] text-[#1a2e44] uppercase tracking-widest mb-2">
          Como usar
        </div>
        <p className="text-sm text-[#43474d] leading-relaxed">
          {c.instruction}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#e4e2e2] shadow-paper overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0eeee]">
          <div className="text-[11px] font-[500] text-[#74777d] uppercase tracking-widest">
            Prompt gerado
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all font-[500] ${
              copied
                ? "bg-[#8ba889]/15 text-[#2a5628]"
                : "bg-[#f5f3f3] text-[#43474d] hover:text-[#1b1c1c] hover:bg-[#eae8e7]"
            }`}
          >
            {copied ? "Copiado!" : "Copiar prompt"}
          </button>
        </div>
        <div className="p-5 max-h-72 overflow-y-auto bg-[#f9f7f4]">
          <pre className="text-xs text-[#43474d] font-mono leading-relaxed whitespace-pre-wrap">
            {prompt}
          </pre>
        </div>
      </div>

      {/* Paste AI response & Import */}
      <div className="bg-white rounded-xl border border-[#e4e2e2] shadow-paper p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-[600] text-[#1b1c1c]">
              Importar resultado da IA
            </div>
            <div className="text-xs text-[#74777d] mt-0.5">
              Cole a resposta final fornecida pela IA (incluindo o bloco JSON)
              para preencher a avaliação automaticamente
            </div>
          </div>
        </div>
        <textarea
          rows={4}
          value={aiResponseText}
          onChange={(e) => setAiResponseText(e.target.value)}
          placeholder="Cole aqui o texto completo ou bloco JSON retornado pela IA..."
          className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#e4e2e2] rounded-lg bg-[#f9f7f4] focus:border-[#1a2e44] focus:bg-white outline-none transition-colors text-[#1b1c1c] resize-none"
        />
        {parseError && (
          <div className="text-xs text-[#ba1a1a] bg-[#ba1a1a]/8 border border-[#ba1a1a]/20 rounded-lg px-3 py-2">
            {parseError}
          </div>
        )}
        {importSuccess && (
          <div className="text-xs text-[#2a5628] bg-[#8ba889]/15 border border-[#8ba889]/30 rounded-lg px-3 py-2">
            {importSuccess}
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            disabled={!aiResponseText.trim()}
            onClick={handleImportAiResponse}
            className="text-xs px-4 py-2 rounded-lg bg-[#1a2e44] text-white font-[600] hover:bg-[#2d4460] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            Importar para avaliação
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e4e2e2] shadow-paper overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0eeee] flex items-center justify-between">
          <div>
            <div className="text-sm font-[600] text-[#1b1c1c]">
              Registrar resultado
            </div>
            <div className="text-xs text-[#74777d] mt-0.5">
              Avalie cada pergunta após a sessão com a IA
            </div>
          </div>
          {!showResultForm && (
            <button
              onClick={() => setShowResultForm(true)}
              className="text-xs px-4 py-2 rounded-lg bg-[#1a2e44] text-white font-[600] hover:bg-[#2d4460] transition-colors"
            >
              Registrar
            </button>
          )}
        </div>

        {showResultForm && (
          <div className="p-5 space-y-5">
            {grouped.map(({ chapter: ch, questions: qs }) => (
              <div key={ch.id} className="space-y-3">
                <div className="text-[11px] font-[600] text-[#74777d] uppercase tracking-widest">
                  Cap. {ch.number} · {ch.title}
                </div>
                {qs.map((q) => (
                  <div
                    key={q.id}
                    className="border border-[#e4e2e2] rounded-xl p-4 space-y-3"
                  >
                    <p className="text-sm text-[#1b1c1c] leading-relaxed">
                      {q.text}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          ["wrong", "Errei"],
                          ["partial", "Parcial"],
                          ["correct", "Acertei"],
                        ] as const
                      ).map(([value, label]) => {
                        const selected = ratings[q.id] === value;
                        const styles =
                          value === "correct"
                            ? selected
                              ? "border-[#8ba889] bg-[#8ba889]/15 text-[#2a5628]"
                              : "border-[#8ba889]/30 text-[#2a5628]"
                            : value === "partial"
                              ? selected
                                ? "border-[#f2d492] bg-[#f2d492]/25 text-[#7a5a00]"
                                : "border-[#f2d492]/50 text-[#7a5a00]"
                              : selected
                                ? "border-[#ba1a1a] bg-[#ba1a1a]/10 text-[#ba1a1a]"
                                : "border-[#ba1a1a]/25 text-[#ba1a1a]";
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setRatings((prev) => ({ ...prev, [q.id]: value }))
                            }
                            className={`py-2 rounded-lg border text-xs font-[600] transition-colors ${styles}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {ratedCount > 0 && (
              <div className="p-3 bg-[#f5f3f3] rounded-lg text-center">
                <div className="text-[10px] font-[500] text-[#74777d] uppercase tracking-widest mb-0.5">
                  Score estimado
                </div>
                <div className="text-2xl font-mono font-[600] text-[#1b1c1c]">
                  {previewScore}%
                </div>
                <div className="text-xs text-[#74777d]">
                  {ratedCount} de {questions.length} avaliadas
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="text-sm text-[#ba1a1a] bg-[#ba1a1a]/8 border border-[#ba1a1a]/20 rounded-lg px-3 py-2">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowResultForm(false)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-lg border border-[#e4e2e2] text-sm font-[500] text-[#43474d] hover:bg-[#f5f3f3] transition-colors disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                disabled={!allRated || isPending}
                onClick={() => onSave(ratings)}
                className="flex-1 py-2.5 rounded-lg bg-[#1a2e44] text-white text-sm font-[600] hover:bg-[#2d4460] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending && (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Salvar resultado
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsScreen({
  results,
  book,
  nextRevision,
  onNewSession,
  starting,
}: {
  results: SessionResults;
  book: Book;
  nextRevision: Date | null;
  onNewSession: () => void;
  starting: boolean;
}) {
  const { correct, partial, wrong, score } = results;
  const message =
    score >= 90
      ? "Excelente domínio! O conhecimento está bem consolidado."
      : score >= 75
        ? "Bom desempenho. Continue revisando para consolidar."
        : score >= 60
          ? "Progresso razoável. Algumas lacunas a trabalhar."
          : "Ainda há bastante espaço para crescer. Revise logo novamente.";

  const scoreColor =
    score >= 80
      ? "text-[#2a5628]"
      : score >= 60
        ? "text-[#7a5a00]"
        : "text-[#ba1a1a]";
  const scoreBorder =
    score >= 80
      ? "border-[#8ba889]/40"
      : score >= 60
        ? "border-[#f2d492]/60"
        : "border-[#ba1a1a]/30";

  const nextLabel = nextRevision
    ? nextRevision.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-2xl mx-auto px-8 py-8 space-y-8">
      <div className="text-center">
        <div className="text-[10px] font-[500] text-[#74777d] uppercase tracking-widest mb-4">
          Sessão concluída
        </div>
        <div
          className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-2 ${scoreBorder} bg-white shadow-paper mb-4`}
        >
          <span className={`font-mono text-2xl font-[600] ${scoreColor}`}>
            {score}%
          </span>
        </div>
        <h2
          style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
          className="text-2xl text-[#1b1c1c]"
        >
          {message}
        </h2>
        <div className="text-xs text-[#74777d] font-[500] mt-2">
          {book.title}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            n: correct,
            label: "Acertei",
            bg: "bg-[#8ba889]/10",
            border: "border-[#8ba889]/30",
            c: "text-[#2a5628]",
          },
          {
            n: partial,
            label: "Parcial",
            bg: "bg-[#f2d492]/15",
            border: "border-[#f2d492]/50",
            c: "text-[#7a5a00]",
          },
          {
            n: wrong,
            label: "Errei",
            bg: "bg-[#ba1a1a]/8",
            border: "border-[#ba1a1a]/25",
            c: "text-[#ba1a1a]",
          },
        ].map(({ n, label, bg, border, c }) => (
          <div
            key={label}
            className={`${bg} border ${border} rounded-xl p-4 text-center`}
          >
            <div className={`font-mono text-2xl font-[600] ${c}`}>{n}</div>
            <div className="text-xs text-[#74777d] mt-1 font-[500]">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-5 border border-[#e4e2e2] shadow-paper space-y-2.5">
        <div className="text-[10px] font-[500] text-[#74777d] uppercase tracking-widest">
          Próximos passos
        </div>
        {nextLabel ? (
          <div className="text-sm text-[#43474d] flex gap-2">
            <span className="text-[#1a2e44]">→</span>Próxima revisão sugerida em{" "}
            <strong className="text-[#1b1c1c] mx-1">{nextLabel}</strong>.
          </div>
        ) : (
          <div className="text-sm text-[#43474d] flex gap-2">
            <span className="text-[#1a2e44]">→</span>A próxima revisão será
            agendada automaticamente.
          </div>
        )}
        {wrong + partial > 0 && (
          <div className="text-sm text-[#43474d] flex gap-2">
            <span className="text-[#1a2e44]">→</span>Revise os capítulos com
            maior dificuldade antes da próxima sessão.
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onNewSession}
          disabled={starting}
          className="flex-1 py-3 rounded-xl border border-[#e4e2e2] text-sm font-[500] text-[#43474d] hover:bg-[#f5f3f3] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {starting && (
            <span className="w-3 h-3 border-2 border-[#43474d] border-t-transparent rounded-full animate-spin" />
          )}
          Nova sessão
        </button>
        <Link
          href={`/livros/${book.id}`}
          className="flex-1 py-3 rounded-xl bg-[#1a2e44] text-white text-sm font-[600] hover:bg-[#2d4460] transition-all text-center"
        >
          Voltar ao livro
        </Link>
      </div>
    </div>
  );
}

export function MemorizationSession({
  session,
  book,
  chapter,
}: {
  session: RevisionSession;
  book: Book;
  chapter?: Chapter;
}) {
  const completed = session.completedAt !== null;
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(
    session.mode ?? null,
  );
  const [step, setStep] = useState<"select" | "session" | "results">(
    completed ? "results" : session.mode ? "session" : "select",
  );
  const [results, setResults] = useState<SessionResults | null>(
    completed ? resultsFromSession(session) : null,
  );
  const [nextRevision, setNextRevision] = useState<Date | null>(
    book.nextRevision,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [starting, startNewTransition] = useTransition();
  const [canceling, startCancelTransition] = useTransition();
  const router = useRouter();

  const eligibleChapters = chapter
    ? [chapter]
    : book.chapters.filter((c) => c.questions.length > 0);

  const allQuestions: Array<{
    question: Question;
    chapter: Chapter;
  }> = eligibleChapters.flatMap((c) =>
    c.questions.map((q) => ({ question: q, chapter: c })),
  );

  const persistSession = useCallback(
    (mode: SessionMode, performances: Record<string, Performance>) => {
      const entries = Object.entries(performances).map(
        ([questionId, performance]) => ({ questionId, performance }),
      );
      setErrorMessage(null);
      startTransition(async () => {
        const res = await completeSessionAction(session.id, mode, entries);
        if (!res.success) {
          setErrorMessage(res.error);
          return;
        }
        const tally = tallyPerformances(performances);
        setResults({
          ...tally,
          score: res.data?.score ?? calculateScore(tally),
        });
        setNextRevision(res.data?.nextRevision ?? book.nextRevision);
        setStep("results");
      });
    },
    [book.nextRevision, session.id],
  );

  const handleFinish = useCallback(
    (performances: Record<string, Performance>) => {
      persistSession(selectedMode ?? "direct", performances);
    },
    [persistSession, selectedMode],
  );

  const handleNewSession = () => {
    startNewTransition(async () => {
      await startSessionAction(book.id);
    });
  };

  const handleCancelSession = () => {
    setCancelError(null);
    startCancelTransition(async () => {
      const res = await cancelSessionAction(session.id);
      if (!res.success) {
        setCancelError(res.error);
        return;
      }
      router.push(`/livros/${book.id}`);
    });
  };

  return (
    <div className="min-h-full bg-[#fbf9f8]">
      <div className="bg-white border-b border-[#e4e2e2]">
        <div className="max-w-3xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/livros/${book.id}`}
              className="flex items-center gap-2 text-[#74777d] hover:text-[#1b1c1c] text-xs font-[500] transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              {book.title}
            </Link>
            {chapter && (
              <>
                <span className="text-[#c4c6cd] text-xs">/</span>
                <span className="text-xs font-[500] text-[#74777d]">
                  Cap. {chapter.number}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[11px] font-[500] text-[#74777d]">
              {step === "select" && "Escolher modalidade"}
              {step === "session" && selectedMode && modeLabels[selectedMode]}
              {step === "results" && "Resultado"}
            </div>
            {step !== "results" && (
              <button
                type="button"
                onClick={handleCancelSession}
                disabled={canceling}
                className="flex items-center gap-1.5 text-[11px] font-[500] px-3 py-1.5 rounded-lg border border-[#ba1a1a]/25 text-[#ba1a1a] hover:bg-[#ba1a1a]/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {canceling && (
                  <span className="w-3 h-3 border-2 border-[#ba1a1a] border-t-transparent rounded-full animate-spin" />
                )}
                Cancelar sessão
              </button>
            )}
          </div>
        </div>
        {cancelError && (
          <div className="max-w-3xl mx-auto px-8 pb-4 -mt-1">
            <div className="text-xs text-[#ba1a1a] bg-[#ba1a1a]/8 border border-[#ba1a1a]/20 rounded-lg px-3 py-2">
              {cancelError}
            </div>
          </div>
        )}
      </div>

      {step === "select" && (
        <div className="max-w-2xl mx-auto px-8 py-8">
          <div className="mb-8">
            <h1
              style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
              className="text-3xl text-[#1b1c1c] tracking-[-0.02em]"
            >
              Como deseja revisar?
            </h1>
            <p className="text-sm text-[#74777d] mt-2">
              Cada modalidade testa um nível diferente de domínio do
              conhecimento.
            </p>
            {allQuestions.length === 0 && (
              <div className="mt-4 p-4 bg-[#ba1a1a]/[0.05] border border-[#ba1a1a]/20 rounded-xl text-sm text-[#ba1a1a]">
                Nenhum capítulo com perguntas encontrado. Adicione perguntas
                antes de iniciar.
              </div>
            )}
          </div>

          {allQuestions.length > 0 && (
            <>
              <div className="space-y-3 mb-6">
                {(["direct", "guided", "recognition"] as SessionMode[]).map(
                  (mode) => (
                    <ModeCard
                      key={mode}
                      mode={mode}
                      selected={selectedMode === mode}
                      onSelect={() => setSelectedMode(mode)}
                    />
                  ),
                )}
              </div>

              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#e4e2e2] text-xs text-[#74777d] font-[500] mb-6 shadow-paper-sm">
                {chapter
                  ? `Revisando: Cap. ${chapter.number} · ${allQuestions.length} pergunta${
                      allQuestions.length !== 1 ? "s" : ""
                    }`
                  : `Revisando: livro completo · ${eligibleChapters.length} capítulos · ${allQuestions.length} perguntas`}
              </div>

              <button
                disabled={!selectedMode}
                onClick={() => setStep("session")}
                className="w-full py-3.5 rounded-xl bg-[#1a2e44] text-white font-[600] hover:bg-[#2d4460] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selectedMode
                  ? `Iniciar ${modeLabels[selectedMode]}`
                  : "Selecione uma modalidade"}
              </button>
            </>
          )}
        </div>
      )}

      {step === "session" &&
        selectedMode === "direct" &&
        allQuestions.length > 0 && (
          <>
            {errorMessage && (
              <div className="max-w-2xl mx-auto px-8 pt-4">
                <div className="text-sm text-[#ba1a1a] bg-[#ba1a1a]/8 border border-[#ba1a1a]/20 rounded-lg px-3 py-2">
                  {errorMessage}
                </div>
              </div>
            )}
            {isPending && (
              <div className="max-w-2xl mx-auto px-8 pt-4 text-sm text-[#74777d]">
                Salvando sessão…
              </div>
            )}
            <DirectSession
              questions={allQuestions}
              book={book}
              onFinish={handleFinish}
              isPending={isPending}
            />
          </>
        )}

      {step === "session" &&
        (selectedMode === "guided" || selectedMode === "recognition") && (
          <PromptDisplay
            mode={selectedMode}
            book={book}
            chapter={chapter}
            questions={allQuestions}
            onSave={(performances) =>
              persistSession(selectedMode, performances)
            }
            isPending={isPending}
            errorMessage={errorMessage}
          />
        )}

      {step === "results" && results && (
        <ResultsScreen
          results={results}
          book={book}
          nextRevision={nextRevision}
          onNewSession={handleNewSession}
          starting={starting}
        />
      )}
    </div>
  );
}
