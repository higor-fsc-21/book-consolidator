"use client";

import { useState } from "react";
import type {
  Book,
  ReadingStatus,
  Importance,
  ConsolidationState,
} from "@/domain/types";
import { statusLabels } from "@/domain/constants";

type BookFormData = Omit<
  Book,
  "id" | "userId" | "createdAt" | "updatedAt" | "chapters" | "sessions"
>;

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
    year: editBook?.year ?? null,
    pages: editBook?.pages ?? null,
    status: editBook?.status ?? "want",
    importance: editBook?.importance ?? 2,
    totalChapters: editBook?.totalChapters ?? 10,
    currentChapter: editBook?.currentChapter ?? null,
    startDate: editBook?.startDate ?? null,
    endDate: editBook?.endDate ?? null,
    consolidationState: editBook?.consolidationState ?? "consolidating",
    lastRevision: editBook?.lastRevision ?? null,
    nextRevision: editBook?.nextRevision ?? null,
    summary: editBook?.summary ?? "",
    coverUrl: editBook?.coverUrl ?? null,
    googleBooksId: editBook?.googleBooksId ?? null,
  });

  const set = <K extends keyof BookFormData>(key: K, value: BookFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const totalSteps = 2;

  const canProceed = () => {
    if (step === 1) return form.title.trim() && form.author.trim();
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
              {[1, 2].map((s) => (
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
                        e.target.value ? Number(e.target.value) : null,
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
                        e.target.value ? Number(e.target.value) : null,
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
                          e.target.value ? Number(e.target.value) : null,
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
