"use client";

import { useState } from "react";
import type {
  Book,
  ReadingStatus,
  Importance,
  ConsolidationState,
} from "@/domain/types";
import { COVER_GRADIENTS, statusLabels } from "@/domain/constants";

type BookFormData = Omit<Book, "id" | "revisions" | "chapters">;

const importanceLabels: Record<Importance, string> = {
  1: "Muito importante",
  2: "Importante",
  3: "Interessante",
};

const statusOptions: ReadingStatus[] = [
  "want",
  "reading",
  "completed",
  "paused",
];

export function BookModal({
  editBook,
  onSave,
  onClose,
}: {
  editBook?: Book;
  onSave: (data: Partial<BookFormData>) => void;
  onClose: () => void;
}) {
  const isEdit = !!editBook;
  const [step, setStep] = useState(1);

  const [form, setForm] = useState<BookFormData>({
    title: editBook?.title ?? "",
    author: editBook?.author ?? "",
    year: editBook?.year,
    pages: editBook?.pages,
    status: editBook?.status ?? "want",
    importance: editBook?.importance ?? 2,
    totalChapters: editBook?.totalChapters ?? 10,
    currentChapter: editBook?.currentChapter,
    startDate: editBook?.startDate,
    endDate: editBook?.endDate,
    coverGradient: editBook?.coverGradient ?? COVER_GRADIENTS[0],
    consolidationState: editBook?.consolidationState ?? "consolidating",
    lastRevision: editBook?.lastRevision,
    nextRevision: editBook?.nextRevision,
    summary: editBook?.summary ?? "",
  });

  const set = <K extends keyof BookFormData>(key: K, value: BookFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const totalSteps = 3;

  const canProceed = () => {
    if (step === 1) return form.title.trim() && form.author.trim();
    if (step === 2) return form.totalChapters > 0;
    return true;
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-paper-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e4e2e2]">
          <div>
            <h2
              style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
              className="text-xl text-[#1b1c1c]"
            >
              {isEdit ? "Editar livro" : "Adicionar livro"}
            </h2>
            <div className="flex gap-1.5 mt-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 rounded-full transition-all ${
                    s <= step ? "bg-[#1a2e44]" : "bg-[#e4e2e2]"
                  } ${s === step ? "w-6" : "w-3"}`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#74777d] hover:text-[#1b1c1c] transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-xs text-[#74777d] font-[500] uppercase tracking-widest mb-1">
                Informações básicas
              </div>

              <Field label="Título *">
                <input
                  className="w-full px-3.5 py-3 text-sm border-b-2 border-[#e4e2e2] bg-[#f9f7f4] rounded-t-md focus:border-[#1a2e44] outline-none transition-colors text-[#1b1c1c]"
                  placeholder="ex.: Comunicação Não-Violenta"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  autoFocus
                />
              </Field>

              <Field label="Autor *">
                <input
                  className="w-full px-3.5 py-3 text-sm border-b-2 border-[#e4e2e2] bg-[#f9f7f4] rounded-t-md focus:border-[#1a2e44] outline-none transition-colors text-[#1b1c1c]"
                  placeholder="ex.: Marshall B. Rosenberg"
                  value={form.author}
                  onChange={(e) => set("author", e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Ano de publicação">
                  <input
                    type="number"
                    className="w-full px-3.5 py-3 text-sm border-b-2 border-[#e4e2e2] bg-[#f9f7f4] rounded-t-md focus:border-[#1a2e44] outline-none transition-colors text-[#1b1c1c]"
                    placeholder="ex.: 2003"
                    value={form.year ?? ""}
                    onChange={(e) =>
                      set(
                        "year",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </Field>
                <Field label="Páginas">
                  <input
                    type="number"
                    className="w-full px-3.5 py-3 text-sm border-b-2 border-[#e4e2e2] bg-[#f9f7f4] rounded-t-md focus:border-[#1a2e44] outline-none transition-colors text-[#1b1c1c]"
                    placeholder="ex.: 264"
                    value={form.pages ?? ""}
                    onChange={(e) =>
                      set(
                        "pages",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </Field>
              </div>

              {isEdit && (
                <Field label="Resumo pessoal">
                  <textarea
                    className="w-full px-3.5 py-3 text-sm border-b-2 border-[#e4e2e2] bg-[#f9f7f4] rounded-t-md focus:border-[#1a2e44] outline-none transition-colors text-[#1b1c1c] resize-none leading-relaxed"
                    placeholder="Escreva suas principais aprendizagens deste livro..."
                    value={form.summary ?? ""}
                    onChange={(e) => set("summary", e.target.value)}
                    rows={5}
                  />
                </Field>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-xs text-[#74777d] font-[500] uppercase tracking-widest mb-1">
                Leitura
              </div>

              <div>
                <label className="text-xs font-[500] text-[#43474d] mb-2 block">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => set("status", s)}
                      className={`py-2.5 px-3 rounded-lg text-sm font-[500] border transition-all text-left ${
                        form.status === s
                          ? "bg-[#1a2e44] text-white border-[#1a2e44]"
                          : "bg-white text-[#43474d] border-[#e4e2e2] hover:border-[#1a2e44]/40"
                      }`}
                    >
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-[500] text-[#43474d] mb-2 block">
                  Importância
                </label>
                <div className="flex gap-2">
                  {([1, 2, 3] as Importance[]).map((i) => (
                    <button
                      key={i}
                      onClick={() => set("importance", i)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-[500] border transition-all ${
                        form.importance === i
                          ? "bg-[#1a2e44] text-white border-[#1a2e44]"
                          : "bg-white text-[#43474d] border-[#e4e2e2] hover:border-[#1a2e44]/40"
                      }`}
                    >
                      {importanceLabels[i]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Total de capítulos *">
                  <input
                    type="number"
                    className="w-full px-3.5 py-3 text-sm border-b-2 border-[#e4e2e2] bg-[#f9f7f4] rounded-t-md focus:border-[#1a2e44] outline-none transition-colors text-[#1b1c1c]"
                    value={form.totalChapters}
                    min={1}
                    onChange={(e) =>
                      set("totalChapters", Number(e.target.value))
                    }
                  />
                </Field>
                {(form.status === "reading" || form.status === "paused") && (
                  <Field label="Capítulo atual">
                    <input
                      type="number"
                      className="w-full px-3.5 py-3 text-sm border-b-2 border-[#e4e2e2] bg-[#f9f7f4] rounded-t-md focus:border-[#1a2e44] outline-none transition-colors text-[#1b1c1c]"
                      value={form.currentChapter ?? ""}
                      min={1}
                      max={form.totalChapters}
                      onChange={(e) =>
                        set(
                          "currentChapter",
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                    />
                  </Field>
                )}
              </div>

              {isEdit && (
                <div>
                  <label className="text-xs font-[500] text-[#43474d] mb-2 block">
                    Estado de consolidação
                  </label>
                  <div className="flex gap-2">
                    {(
                      [
                        "consolidating",
                        "consolidated",
                        "archived",
                      ] as ConsolidationState[]
                    ).map((state) => {
                      const labels = {
                        consolidating: "Em consolidação",
                        consolidated: "Consolidado",
                        archived: "Arquivado",
                      };
                      return (
                        <button
                          key={state}
                          onClick={() => set("consolidationState", state)}
                          className={`flex-1 py-2 rounded-lg text-xs font-[500] border transition-all ${
                            form.consolidationState === state
                              ? "bg-[#1a2e44] text-white border-[#1a2e44]"
                              : "bg-white text-[#43474d] border-[#e4e2e2] hover:border-[#1a2e44]/40"
                          }`}
                        >
                          {labels[state]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="text-xs text-[#74777d] font-[500] uppercase tracking-widest mb-1">
                Capa do livro
              </div>
              <p className="text-xs text-[#74777d]">
                Escolha um gradiente para representar a capa.
              </p>

              <div className="grid grid-cols-5 gap-3">
                {COVER_GRADIENTS.map(([a, b], i) => (
                  <button
                    key={i}
                    onClick={() => set("coverGradient", [a, b])}
                    className="relative aspect-[2/3] rounded-lg overflow-hidden transition-all"
                    style={{
                      background: `linear-gradient(160deg, ${a}, ${b})`,
                      outline:
                        form.coverGradient[0] === a &&
                        form.coverGradient[1] === b
                          ? "3px solid #1a2e44"
                          : "3px solid transparent",
                      outlineOffset: "2px",
                    }}
                  >
                    {form.coverGradient[0] === a &&
                      form.coverGradient[1] === b && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className="flex items-center gap-4 p-4 bg-[#f5f3f3] rounded-xl">
                <div
                  className="w-14 h-20 rounded-lg shrink-0"
                  style={{
                    background: `linear-gradient(160deg, ${form.coverGradient[0]}, ${form.coverGradient[1]})`,
                    boxShadow: "4px 6px 16px rgba(0,0,0,0.25)",
                  }}
                />
                <div>
                  <div className="text-sm font-[600] text-[#1b1c1c] leading-tight">
                    {form.title || "Título do livro"}
                  </div>
                  <div className="text-xs text-[#74777d] mt-0.5">
                    {form.author || "Autor"}
                  </div>
                  <div className="text-xs text-[#74777d] mt-1">
                    {statusLabels[form.status]}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e4e2e2] flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-2.5 rounded-lg border border-[#e4e2e2] text-sm font-[500] text-[#43474d] hover:bg-[#f5f3f3] transition-colors"
            >
              Voltar
            </button>
          )}
          {step < totalSteps ? (
            <button
              disabled={!canProceed()}
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 py-2.5 rounded-lg bg-[#1a2e44] text-white text-sm font-[600] hover:bg-[#2d4460] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-lg bg-[#1a2e44] text-white text-sm font-[600] hover:bg-[#2d4460] transition-colors"
            >
              {isEdit ? "Salvar alterações" : "Adicionar livro"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-[500] text-[#43474d] mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}
