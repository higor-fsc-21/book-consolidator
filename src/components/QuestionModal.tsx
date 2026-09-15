"use client";

import { useState } from "react";
import type { Question, Difficulty } from "@/domain/types";
import type { UpdateQuestionInput } from "@/lib/validators";

interface QuestionModalProps {
  question: Question;
  onSave: (updates: UpdateQuestionInput) => Promise<void> | void;
  onClose: () => void;
  isPending?: boolean;
  errorMessage?: string | null;
}

const difficultyOptions: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Média" },
  { value: "hard", label: "Difícil" },
];

export function QuestionModal({
  question,
  onSave,
  onClose,
  isPending = false,
  errorMessage,
}: QuestionModalProps) {
  const [text, setText] = useState(question.text);
  const [answer, setAnswer] = useState(question.answer);
  const [difficulty, setDifficulty] = useState<Difficulty>(question.difficulty);

  const canSave = text.trim().length > 0 && answer.trim().length > 0;

  const handleSave = () => {
    if (!canSave || isPending) return;
    onSave({
      text: text.trim(),
      answer: answer.trim(),
      difficulty,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-paper-lg border border-[#e4e2e2] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e4e2e2] flex items-center justify-between">
          <div>
            <h2
              style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
              className="text-xl text-[#1b1c1c]"
            >
              Editar pergunta
            </h2>
            <p className="text-xs text-[#74777d] mt-0.5">
              Ajuste o enunciado, resposta ou dificuldade
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-[#74777d] hover:text-[#1b1c1c] p-1 rounded-lg transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="text-sm text-[#ba1a1a] bg-[#ba1a1a]/8 border border-[#ba1a1a]/20 rounded-lg px-3.5 py-2.5">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="text-xs font-[500] text-[#43474d] mb-1.5 block">
              Pergunta *
            </label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm border-b-2 border-[#e4e2e2] bg-[#f9f7f4] rounded-t-md focus:border-[#1a2e44] outline-none transition-colors text-[#1b1c1c] resize-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: O que é a técnica de Feynman?"
            />
          </div>

          <div>
            <label className="text-xs font-[500] text-[#43474d] mb-1.5 block">
              Resposta ideal *
            </label>
            <textarea
              rows={4}
              className="w-full px-3.5 py-2.5 text-sm border-b-2 border-[#e4e2e2] bg-[#f9f7f4] rounded-t-md focus:border-[#1a2e44] outline-none transition-colors text-[#1b1c1c] resize-none"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Ex: Explicar um conceito com palavras simples..."
            />
          </div>

          <div>
            <label className="text-xs font-[500] text-[#43474d] mb-2 block">
              Dificuldade
            </label>
            <div className="flex gap-2">
              {difficultyOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDifficulty(opt.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-[500] border transition-all ${
                    difficulty === opt.value
                      ? "bg-[#1a2e44] text-white border-[#1a2e44]"
                      : "bg-white text-[#43474d] border-[#e4e2e2] hover:border-[#1a2e44]/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e4e2e2] flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-lg border border-[#e4e2e2] text-sm font-[500] text-[#43474d] hover:bg-[#f5f3f3] transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isPending}
            className="flex-1 py-2.5 rounded-lg bg-[#1a2e44] text-white text-sm font-[600] hover:bg-[#2d4460] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}
