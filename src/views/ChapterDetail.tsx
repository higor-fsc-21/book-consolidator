"use client";

import { useState } from "react";
import Link from "next/link";
import type { Book, Chapter, Question, Difficulty } from "@/domain/types";
import { createQuestion } from "@/app/actions/questions";
import { startSessionAction } from "@/app/actions/sessions";

function QuestionCard({
  question,
  index,
}: {
  question: Question;
  index: number;
}) {
  const [revealed, setRevealed] = useState(false);

  const difficultyStyle = {
    hard: "bg-[#ba1a1a]/10 text-[#ba1a1a]",
    medium: "bg-[#f2d492]/30 text-[#7a5a00]",
    easy: "bg-[#8ba889]/20 text-[#2a5628]",
  };
  const difficultyLabel = { hard: "difícil", medium: "médio", easy: "fácil" };

  return (
    <div className="bg-white rounded-xl border border-[#e4e2e2] shadow-paper-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-7 h-7 rounded-full bg-[#1a2e44]/[0.08] flex items-center justify-center text-[11px] font-mono text-[#1a2e44] shrink-0 mt-0.5">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[15px] text-[#1b1c1c] font-[500] leading-snug">
                {question.text}
              </p>
              <span
                className={`text-[10px] font-[500] px-2 py-0.5 rounded-full shrink-0 ${difficultyStyle[question.difficulty]}`}
              >
                {difficultyLabel[question.difficulty]}
              </span>
            </div>

            <div className="mt-4">
              {!revealed ? (
                <button
                  onClick={() => setRevealed(true)}
                  className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg border border-[#e4e2e2] text-[#43474d] hover:bg-[#f5f3f3] hover:text-[#1b1c1c] transition-all"
                >
                  <svg
                    width="13"
                    height="13"
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
                <div className="pl-4 border-l-2 border-[#1a2e44]/25">
                  <div className="text-[10px] font-[500] text-[#74777d] uppercase tracking-widest mb-1.5">
                    Resposta
                  </div>
                  <p className="text-sm text-[#43474d] leading-relaxed">
                    {question.answer}
                  </p>
                </div>
              )}
            </div>

            {question.lastPerformance && (
              <div className="mt-3">
                <span
                  className={`text-[10px] font-[500] px-2 py-0.5 rounded inline-block ${
                    question.lastPerformance === "correct"
                      ? "bg-[#8ba889]/20 text-[#2a5628]"
                      : question.lastPerformance === "partial"
                        ? "bg-[#f2d492]/30 text-[#7a5a00]"
                        : "bg-[#ba1a1a]/10 text-[#ba1a1a]"
                  }`}
                >
                  {question.lastPerformance === "correct"
                    ? "✓ Acertei"
                    : question.lastPerformance === "partial"
                      ? "◐ Parcial"
                      : "✗ Errei"}{" "}
                  na última revisão
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface NewQuestionForm {
  text: string;
  answer: string;
  difficulty: Difficulty;
}

function AddQuestionForm({
  onSave,
  onCancel,
}: {
  onSave: (q: NewQuestionForm) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<NewQuestionForm>({
    text: "",
    answer: "",
    difficulty: "medium",
  });
  const canSave = form.text.trim() && form.answer.trim();

  return (
    <div className="bg-white rounded-xl border-2 border-[#1a2e44]/30 shadow-paper p-5 space-y-4">
      <div className="text-[11px] font-[600] text-[#1a2e44] uppercase tracking-widest">
        Nova pergunta
      </div>

      <div>
        <label className="text-xs font-[500] text-[#43474d] mb-1.5 block">
          Pergunta *
        </label>
        <textarea
          className="w-full px-3.5 py-3 text-sm bg-[#f9f7f4] border-b-2 border-[#e4e2e2] focus:border-[#1a2e44] outline-none rounded-t-md text-[#1b1c1c] leading-relaxed resize-none transition-colors"
          placeholder="ex.: Por que o autor considera essa ideia fundamental?"
          rows={2}
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          autoFocus
        />
        <p className="text-[10px] text-[#74777d] mt-1">
          Prefira perguntas de compreensão, não de memorização literal.
        </p>
      </div>

      <div>
        <label className="text-xs font-[500] text-[#43474d] mb-1.5 block">
          Resposta *
        </label>
        <textarea
          className="w-full px-3.5 py-3 text-sm bg-[#f9f7f4] border-b-2 border-[#e4e2e2] focus:border-[#1a2e44] outline-none rounded-t-md text-[#1b1c1c] leading-relaxed resize-none transition-colors"
          placeholder="Escreva a resposta completa que deseja lembrar meses depois..."
          rows={3}
          value={form.answer}
          onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
        />
      </div>

      <div>
        <label className="text-xs font-[500] text-[#43474d] mb-1.5 block">
          Dificuldade
        </label>
        <div className="flex gap-2">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
            const labels = { easy: "Fácil", medium: "Médio", hard: "Difícil" };
            return (
              <button
                key={d}
                onClick={() => setForm((f) => ({ ...f, difficulty: d }))}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-[500] border transition-all ${
                  form.difficulty === d
                    ? "bg-[#1a2e44] text-white border-[#1a2e44]"
                    : "bg-white text-[#43474d] border-[#e4e2e2] hover:border-[#1a2e44]/40"
                }`}
              >
                {labels[d]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-[#e4e2e2] text-sm font-[500] text-[#43474d] hover:bg-[#f5f3f3] transition-colors"
        >
          Cancelar
        </button>
        <button
          disabled={!canSave}
          onClick={() => onSave(form)}
          className="flex-1 py-2.5 rounded-lg bg-[#1a2e44] text-white text-sm font-[600] hover:bg-[#2d4460] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Salvar pergunta
        </button>
      </div>
    </div>
  );
}

export function ChapterDetail({
  book,
  chapter,
}: {
  book: Book;
  chapter: Chapter;
}) {
  const [addingQuestion, setAddingQuestion] = useState(false);
  const hasQ = chapter.questions.length > 0;
  const prevChapter = book.chapters.find(
    (c) => c.number === chapter.number - 1,
  );
  const nextChapter = book.chapters.find(
    (c) => c.number === chapter.number + 1,
  );

  const handleSaveQuestion = (form: NewQuestionForm) => {
    createQuestion(book.id, chapter.id, {
      ...form,
      lastPerformance: undefined,
    } satisfies Omit<Question, "id">);
    setAddingQuestion(false);
  };

  return (
    <div className="min-h-full bg-[#fbf9f8]">
      {/* Header */}
      <div className="bg-white border-b border-[#e4e2e2]">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-[500] text-[#74777d] mb-6">
            <Link
              href="/biblioteca"
              className="hover:text-[#1b1c1c] transition-colors"
            >
              Biblioteca
            </Link>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <Link
              href={`/livros/${book.id}`}
              className="hover:text-[#1b1c1c] transition-colors truncate max-w-[160px]"
            >
              {book.title}
            </Link>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-[#1b1c1c]">Capítulo {chapter.number}</span>
          </div>

          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[11px] font-[600] text-[#1a2e44] uppercase tracking-widest mb-2">
                Capítulo {chapter.number}
              </div>
              <h1
                style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                className="text-3xl text-[#1b1c1c] tracking-[-0.02em] leading-tight"
              >
                {chapter.title}
              </h1>
              {chapter.description && (
                <p className="text-[#74777d] mt-3 text-sm leading-relaxed max-w-xl">
                  {chapter.description}
                </p>
              )}
            </div>

            {hasQ && (
              <button
                onClick={() =>
                  startSessionAction(book.id, {
                    mode: "direct",
                    chapterId: chapter.id,
                  })
                }
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#1a2e44] text-white text-sm font-[600] rounded-lg hover:bg-[#2d4460] transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Revisar capítulo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 py-8 space-y-8">
        {/* Summary */}
        {chapter.summary && (
          <div>
            <div className="text-[10px] font-[500] text-[#74777d] uppercase tracking-widest mb-3">
              Resumo do capítulo
            </div>
            <div className="bg-white rounded-xl p-6 shadow-paper border-l-[3px] border-[#1a2e44]/25">
              <p className="text-sm text-[#43474d] leading-relaxed">
                {chapter.summary}
              </p>
            </div>
          </div>
        )}

        {/* Questions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-[500] text-[#74777d] uppercase tracking-widest">
              {hasQ
                ? `${chapter.questions.length} ${
                    chapter.questions.length === 1 ? "pergunta" : "perguntas"
                  } — tente lembrar antes de revelar`
                : "Perguntas e respostas"}
            </div>
            {!addingQuestion && (
              <button
                onClick={() => setAddingQuestion(true)}
                className="text-xs px-3 py-1.5 rounded-lg border border-[#e4e2e2] text-[#43474d] hover:bg-[#f5f3f3] hover:text-[#1b1c1c] transition-colors flex items-center gap-1.5"
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
                Adicionar pergunta
              </button>
            )}
          </div>

          {hasQ ? (
            <div className="space-y-3">
              {chapter.questions.map((q, i) => (
                <QuestionCard key={q.id} question={q} index={i} />
              ))}

              {addingQuestion && (
                <AddQuestionForm
                  onSave={handleSaveQuestion}
                  onCancel={() => setAddingQuestion(false)}
                />
              )}

              {!addingQuestion && (
                <button
                  onClick={() => setAddingQuestion(true)}
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
                  Adicionar pergunta
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {addingQuestion ? (
                <AddQuestionForm
                  onSave={handleSaveQuestion}
                  onCancel={() => setAddingQuestion(false)}
                />
              ) : (
                <div className="py-12 text-center bg-white rounded-xl border border-dashed border-[#c4c6cd] shadow-paper-sm">
                  <h3
                    style={{
                      fontFamily: "'Libre Caslon Text', Georgia, serif",
                    }}
                    className="text-xl text-[#1b1c1c] mb-2"
                  >
                    Nenhuma anotação ainda
                  </h3>
                  <p className="text-sm text-[#74777d] mb-6 max-w-sm mx-auto leading-relaxed">
                    Crie perguntas sobre as ideias que deseja lembrar meses
                    depois. Prefira perguntas de compreensão, não de memorização
                    literal. Perguntas são opcionais.
                  </p>
                  <button
                    onClick={() => setAddingQuestion(true)}
                    className="px-5 py-2.5 bg-[#1a2e44] text-white text-sm font-[600] rounded-lg hover:bg-[#2d4460] transition-colors"
                  >
                    Adicionar primeira pergunta
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chapter navigation */}
        <div className="flex gap-3 pt-4 border-t border-[#e4e2e2]">
          {prevChapter && (
            <Link
              href={`/livros/${book.id}/capitulos/${prevChapter.id}`}
              className="flex-1 px-4 py-3.5 bg-white rounded-xl border border-[#e4e2e2] shadow-paper-sm hover:shadow-paper transition-shadow text-left"
            >
              <div className="text-[10px] font-[500] text-[#74777d] mb-1">
                ← Anterior
              </div>
              <div className="text-sm font-[500] text-[#1b1c1c] truncate">
                {prevChapter.title}
              </div>
            </Link>
          )}
          {nextChapter && (
            <Link
              href={`/livros/${book.id}/capitulos/${nextChapter.id}`}
              className="flex-1 px-4 py-3.5 bg-white rounded-xl border border-[#e4e2e2] shadow-paper-sm hover:shadow-paper transition-shadow text-right"
            >
              <div className="text-[10px] font-[500] text-[#74777d] mb-1">
                Próximo →
              </div>
              <div className="text-sm font-[500] text-[#1b1c1c] truncate">
                {nextChapter.title}
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
