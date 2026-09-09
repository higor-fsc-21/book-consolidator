"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type {
  Book,
  Chapter,
  SessionMode,
  Question,
  Performance,
} from "@/domain/types";
import { modeLabels } from "@/domain/constants";
import {
  generateDirectPrompt,
  generateRecognitionPrompt,
} from "@/domain/prompts";
import { calculateScore } from "@/domain/derived";
import { completeSessionAction } from "@/app/actions/sessions";

interface SessionResults {
  correct: number;
  partial: number;
  wrong: number;
  total: number;
  score: number;
}

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
}: {
  questions: Array<{ question: Question; chapter: Chapter }>;
  book: Book;
  onFinish: (results: SessionResults) => void;
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
        const correct = Object.values(newPerf).filter(
          (p) => p === "correct",
        ).length;
        const partial = Object.values(newPerf).filter(
          (p) => p === "partial",
        ).length;
        const wrong = Object.values(newPerf).filter(
          (p) => p === "wrong",
        ).length;
        const score = calculateScore({
          correct,
          partial,
          wrong,
          total: questions.length,
        });
        onFinish({ correct, partial, wrong, total: questions.length, score });
      }
    },
    [current, currentIdx, performances, questions.length, onFinish],
  );

  return (
    <div className="max-w-2xl mx-auto px-8 py-8 space-y-5">
      {/* Progress */}
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

      {/* Chapter context */}
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

      {/* Question */}
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
                onClick={() => rate("wrong")}
                className="py-3.5 rounded-xl border border-[#ba1a1a]/25 bg-[#ba1a1a]/[0.04] text-[#ba1a1a] hover:bg-[#ba1a1a]/[0.08] transition-all text-sm font-[600]"
              >
                <div className="text-lg mb-1">✗</div>
                Errei
              </button>
              <button
                onClick={() => rate("partial")}
                className="py-3.5 rounded-xl border border-[#f2d492]/50 bg-[#f2d492]/[0.15] text-[#7a5a00] hover:bg-[#f2d492]/[0.25] transition-all text-sm font-[600]"
              >
                <div className="text-lg mb-1">◐</div>
                Parcial
              </button>
              <button
                onClick={() => rate("correct")}
                className="py-3.5 rounded-xl border border-[#8ba889]/30 bg-[#8ba889]/[0.08] text-[#2a5628] hover:bg-[#8ba889]/[0.15] transition-all text-sm font-[600]"
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
  onSaveResult,
}: {
  mode: "guided" | "recognition";
  book: Book;
  chapter?: Chapter;
  onSaveResult: (results: SessionResults) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [resultForm, setResultForm] = useState({
    correct: 0,
    partial: 0,
    wrong: 0,
  });
  const [resultSaved, setResultSaved] = useState<SessionResults | null>(null);

  const chapterIds = chapter ? [chapter.id] : undefined;
  const prompt =
    mode === "guided"
      ? generateDirectPrompt(book, chapterIds)
      : generateRecognitionPrompt(book, chapterIds);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalQuestions =
    resultForm.correct + resultForm.partial + resultForm.wrong;
  const calcScore =
    totalQuestions > 0
      ? calculateScore({ ...resultForm, total: totalQuestions })
      : 0;

  const handleSaveResult = () => {
    const result = { ...resultForm, total: totalQuestions, score: calcScore };
    setResultSaved(result);
    setShowResultForm(false);
    onSaveResult(result);
  };

  const c =
    mode === "guided"
      ? {
          title: "Explicação Guiada",
          emoji: "💬",
          instruction:
            "Copie o prompt abaixo e cole em uma IA conversacional (Claude, ChatGPT, Gemini). A IA vai te testar com perguntas reformuladas. Ao final, ela apresentará um RESULTADO DA SESSÃO — use esses dados para registrar seu desempenho aqui.",
        }
      : {
          title: "Reconhecimento e Aplicação",
          emoji: "🔍",
          instruction:
            "Copie o prompt e cole em uma IA. Você receberá situações práticas sem revelar o conceito testado. Ao final, a IA apresentará um RESULTADO DA SESSÃO — use esses dados para registrar seu desempenho aqui.",
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

      {/* Instruction */}
      <div className="bg-[#1a2e44]/[0.05] border border-[#1a2e44]/20 rounded-xl p-5">
        <div className="text-[11px] font-[600] text-[#1a2e44] uppercase tracking-widest mb-2">
          Como usar
        </div>
        <p className="text-sm text-[#43474d] leading-relaxed">
          {c.instruction}
        </p>
      </div>

      {/* Prompt */}
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
            {copied ? (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>{" "}
                Copiado!
              </>
            ) : (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>{" "}
                Copiar prompt
              </>
            )}
          </button>
        </div>
        <div className="p-5 max-h-72 overflow-y-auto bg-[#f9f7f4]">
          <pre className="text-xs text-[#43474d] font-mono leading-relaxed whitespace-pre-wrap">
            {prompt}
          </pre>
        </div>
      </div>

      {/* Result input section */}
      {!resultSaved ? (
        <div className="bg-white rounded-xl border border-[#e4e2e2] shadow-paper overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f0eeee] flex items-center justify-between">
            <div>
              <div className="text-sm font-[600] text-[#1b1c1c]">
                Registrar resultado
              </div>
              <div className="text-xs text-[#74777d] mt-0.5">
                Após a sessão com a IA, registre seu desempenho
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
              <p className="text-xs text-[#74777d] leading-relaxed">
                Use o "RESULTADO DA SESSÃO" que a IA apresentou ao final para
                preencher os campos abaixo.
              </p>

              <div className="grid grid-cols-3 gap-4">
                {(
                  [
                    {
                      key: "correct",
                      label: "Acertei",
                      color: "text-[#2a5628]",
                      border: "border-[#8ba889]/40",
                      bg: "bg-[#8ba889]/[0.04]",
                    },
                    {
                      key: "partial",
                      label: "Parcial",
                      color: "text-[#7a5a00]",
                      border: "border-[#f2d492]/60",
                      bg: "bg-[#f2d492]/[0.08]",
                    },
                    {
                      key: "wrong",
                      label: "Errei",
                      color: "text-[#ba1a1a]",
                      border: "border-[#ba1a1a]/25",
                      bg: "bg-[#ba1a1a]/[0.04]",
                    },
                  ] as const
                ).map(({ key, label, color, border, bg }) => (
                  <div key={key}>
                    <label className={`text-xs font-[600] ${color} mb-2 block`}>
                      {label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      className={`w-full px-3 py-3 text-center text-lg font-mono font-[600] ${color} border-2 ${border} ${bg} rounded-lg outline-none focus:border-current transition-colors`}
                      value={resultForm[key]}
                      onChange={(e) =>
                        setResultForm((f) => ({
                          ...f,
                          [key]: Math.max(0, Number(e.target.value)),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              {totalQuestions > 0 && (
                <div className="p-3 bg-[#f5f3f3] rounded-lg text-center">
                  <div className="text-[10px] font-[500] text-[#74777d] uppercase tracking-widest mb-0.5">
                    Score calculado
                  </div>
                  <div
                    className={`text-2xl font-mono font-[600] ${
                      calcScore >= 80
                        ? "text-[#2a5628]"
                        : calcScore >= 60
                          ? "text-[#7a5a00]"
                          : "text-[#ba1a1a]"
                    }`}
                  >
                    {calcScore}%
                  </div>
                  <div className="text-xs text-[#74777d]">
                    {totalQuestions} questões avaliadas
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResultForm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[#e4e2e2] text-sm font-[500] text-[#43474d] hover:bg-[#f5f3f3] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={totalQuestions === 0}
                  onClick={handleSaveResult}
                  className="flex-1 py-2.5 rounded-lg bg-[#1a2e44] text-white text-sm font-[600] hover:bg-[#2d4460] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Salvar resultado
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#8ba889]/30 shadow-paper p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#8ba889]/20 flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2a5628"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-[600] text-[#1b1c1c]">
                Resultado registrado
              </div>
              <div className="text-xs text-[#74777d]">
                Score:{" "}
                <span className="font-[600] text-[#2a5628]">
                  {resultSaved.score}%
                </span>{" "}
                · {resultSaved.total} questões
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
            <div className="bg-[#8ba889]/10 rounded-lg p-2">
              <div className="font-[600] text-[#2a5628] text-base">
                {resultSaved.correct}
              </div>
              <div className="text-[#74777d]">acertei</div>
            </div>
            <div className="bg-[#f2d492]/15 rounded-lg p-2">
              <div className="font-[600] text-[#7a5a00] text-base">
                {resultSaved.partial}
              </div>
              <div className="text-[#74777d]">parcial</div>
            </div>
            <div className="bg-[#ba1a1a]/8 rounded-lg p-2">
              <div className="font-[600] text-[#ba1a1a] text-base">
                {resultSaved.wrong}
              </div>
              <div className="text-[#74777d]">errei</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsScreen({
  results,
  book,
  onBack,
}: {
  results: SessionResults;
  book: Book;
  onBack: () => void;
}) {
  const { correct, partial, wrong, total, score } = results;
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
        {score < 80 && (
          <div className="text-sm text-[#43474d] flex gap-2">
            <span className="text-[#1a2e44]">→</span>Revise novamente em{" "}
            <strong className="text-[#1b1c1c] mx-1">7 dias</strong> para
            reforçar o aprendizado.
          </div>
        )}
        {score >= 80 && (
          <div className="text-sm text-[#43474d] flex gap-2">
            <span className="text-[#2a5628]">→</span>Próxima revisão sugerida em{" "}
            <strong className="text-[#1b1c1c] mx-1">30 dias</strong>.
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
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-[#e4e2e2] text-sm font-[500] text-[#43474d] hover:bg-[#f5f3f3] transition-all"
        >
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
  sessionId,
  book,
  chapter,
  initialMode,
}: {
  sessionId: string;
  book: Book;
  chapter?: Chapter;
  initialMode?: SessionMode;
}) {
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(
    initialMode ?? null,
  );
  const [step, setStep] = useState<"select" | "session" | "results">(
    initialMode ? "session" : "select",
  );
  const [results, setResults] = useState<SessionResults | null>(null);

  const eligibleChapters = chapter
    ? [chapter]
    : book.chapters.filter((c) => c.questions.length > 0);

  const allQuestions: Array<{
    question: Question;
    chapter: Chapter;
  }> = eligibleChapters.flatMap((c) =>
    c.questions.map((q) => ({ question: q, chapter: c })),
  );

  const persistRevision = useCallback(
    (r: SessionResults, mode: SessionMode) => {
      completeSessionAction(sessionId, {
        date: new Date().toISOString().slice(0, 10),
        mode,
        score: r.score,
        questionsCount: r.total,
        difficultTopics: [],
      });
    },
    [sessionId],
  );

  const handleFinish = useCallback(
    (r: SessionResults) => {
      setResults(r);
      setStep("results");
      persistRevision(r, selectedMode ?? "direct");
    },
    [persistRevision, selectedMode],
  );

  const handleSaveResult = useCallback(
    (r: SessionResults) => {
      persistRevision(r, selectedMode ?? "guided");
    },
    [persistRevision, selectedMode],
  );

  const handleBack = () => {
    setStep("select");
    setSelectedMode(null);
    setResults(null);
  };

  return (
    <div className="min-h-full bg-[#fbf9f8]">
      {/* Header */}
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
          <div className="text-[11px] font-[500] text-[#74777d]">
            {step === "select" && "Escolher modalidade"}
            {step === "session" && selectedMode && modeLabels[selectedMode]}
            {step === "results" && "Resultado"}
          </div>
        </div>
      </div>

      {/* Select mode */}
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

              {/* Scope info */}
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#e4e2e2] text-xs text-[#74777d] font-[500] mb-6 shadow-paper-sm">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1a2e44"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  className="shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
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
          <DirectSession
            questions={allQuestions}
            book={book}
            onFinish={handleFinish}
          />
        )}

      {step === "session" &&
        (selectedMode === "guided" || selectedMode === "recognition") && (
          <PromptDisplay
            mode={selectedMode}
            book={book}
            chapter={chapter}
            onSaveResult={handleSaveResult}
          />
        )}

      {step === "results" && results && (
        <ResultsScreen results={results} book={book} onBack={handleBack} />
      )}
    </div>
  );
}
