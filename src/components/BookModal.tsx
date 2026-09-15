"use client"
// Step 0: Search (new books only), Step 1: Basic info, Step 2: Reading status & chapters

// Search state

// Debounced search on step 0
/* Backdrop */ /* Modal */ /* Header */ /* Content */ /* Step 0: Google Books search */ /* Local matches */ /* Search results */ /* Pagination */ /* Footer */
import { useState, useEffect } from "react"
import Image from "next/image"
import type {
  Book,
  ReadingStatus,
  Importance,
  ConsolidationState,
} from "@/domain/types"
import { statusLabels } from "@/domain/constants"
import type { GoogleBookItem } from "@/app/api/books/search/route"

type BookFormData = Omit<Book, "id" | "userId" | "createdAt" | "updatedAt" | "chapters" | "sessions">

const importanceLabels: Record<Importance, string> = {
  1: "Muito importante",
  2: "Importante",
  3: "Interessante",
}

const statusOptions: ReadingStatus[] = [
  "want",
  "reading",
  "completed",
  "paused",
]

export function BookModal({
  editBook,
  onSave,
  onClose,
  isPending = false,
  errorMessage,
}: {
  editBook?: Book
  onSave: (data: Partial<BookFormData>) => Promise<void> | void
  onClose: () => void
  isPending?: boolean
  errorMessage?: string | null
}) {
  const isEdit = !!editBook
  const [step, setStep] = useState(isEdit ? 1 : 0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<GoogleBookItem[]>([])
  const [localMatches, setLocalMatches] = useState<any[]>([])
  const [startIndex, setStartIndex] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [searchError, setSearchError] = useState<string | null>(null)

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
  })

  const set = <K extends keyof BookFormData>(key: K, value: BookFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }))
  useEffect(() => {
    if (step !== 0) return
    if (!searchQuery.trim()) {
      setSearchResults([])
      setLocalMatches([])
      setTotalItems(0)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      setSearchError(null)
      try {
        const res = await fetch(
          `/api/books/search?q=${encodeURIComponent(
            searchQuery.trim(),
          )}&startIndex=${startIndex}&maxResults=8`,
        )
        if (!res.ok) throw new Error("Falha ao buscar livros")
        const data = await res.json()
        setSearchResults(data.items || [])
        setLocalMatches(data.localBooks || [])
        setTotalItems(data.totalItems || 0)
      } catch (err) {
        setSearchError("Não foi possível buscar livros no momento.")
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery, startIndex, step])

  const selectGoogleBook = (book: GoogleBookItem) => {
    setForm((prev) => ({
      ...prev,
      title: book.title,
      author: book.author,
      year: book.year,
      pages: book.pages,
      coverUrl: book.coverUrl,
      googleBooksId: book.googleBooksId,
    }))
    setStep(1)
  }

  const totalSteps = isEdit ? 2 : 3
  const currentStepNumber = isEdit ? step : step + 1

  const canProceed = () => {
    if (step === 1) return form.title.trim() && form.author.trim()
    return true
  }

  const handleSave = () => {
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-paper-lg overflow-hidden flex flex-col max-h-[90vh]">
        {}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e4e2e2]">
          <div>
            <h2
              style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
              className="text-xl text-[#1b1c1c]"
            >
              {isEdit
                ? "Editar livro"
                : step === 0
                  ? "Buscar livro"
                  : "Adicionar livro"}
            </h2>
            <div className="flex gap-1.5 mt-2">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                <div
                  key={s}
                  className={`h-1 rounded-full transition-all ${
                    s <= currentStepNumber ? "bg-[#1a2e44]" : "bg-[#e4e2e2]"
                  } ${s === currentStepNumber ? "w-6" : "w-3"}`}
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

        {errorMessage && (
          <div className="px-6 py-2.5 bg-[#ba1a1a]/10 border-b border-[#ba1a1a]/20 text-xs text-[#ba1a1a] flex items-center gap-2">
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
            {errorMessage}
          </div>
        )}

        {}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {}
          {step === 0 && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  className="w-full pl-9 pr-4 py-2.5 bg-[#f9f7f4] text-sm text-[#1b1c1c] rounded-lg border-b-2 border-[#e4e2e2] focus:border-[#1a2e44] outline-none placeholder-[#74777d] transition-colors"
                  placeholder="Digite o título ou autor para buscar..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setStartIndex(0)
                  }}
                  autoFocus
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#74777d]"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {isSearching && (
                <div className="py-8 text-center text-xs text-[#74777d] flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-[#1a2e44] border-t-transparent rounded-full animate-spin" />
                  Buscando livros...
                </div>
              )}

              {searchError && (
                <div className="p-3 bg-[#ba1a1a]/10 text-xs text-[#ba1a1a] rounded-lg">
                  {searchError}
                </div>
              )}

              {}
              {localMatches.length > 0 && !isSearching && (
                <div className="space-y-2 mb-4">
                  <div className="text-[11px] font-semibold text-[#74777d] uppercase tracking-wider">
                    Já no seu acervo
                  </div>
                  {localMatches.map((local) => (
                    <div
                      key={local.id}
                      className="p-2.5 bg-[#f5f3f3] rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-[#1b1c1c]">
                          {local.title}
                        </span>{" "}
                        <span className="text-[#74777d]">— {local.author}</span>
                      </div>
                      <span className="text-[10px] text-[#2a5628] font-mono bg-[#8ba889]/20 px-2 py-0.5 rounded shrink-0">
                        Cadastrado
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {}
              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {searchResults.map((item) => (
                    <button
                      key={item.googleBooksId}
                      onClick={() => selectGoogleBook(item)}
                      className="w-full p-2.5 text-left rounded-lg border border-[#e4e2e2] hover:border-[#1a2e44]/40 hover:bg-[#f9f7f4] flex gap-3 transition-all items-center"
                    >
                      {item.coverUrl ? (
                        <div className="relative w-9 h-12 rounded overflow-hidden shrink-0 bg-[#e4e2e2]">
                          <Image
                            src={item.coverUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="36px"
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-12 rounded bg-gradient-to-br from-[#1a2e44] to-[#2d4460] shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#1b1c1c] truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-[#74777d] truncate">
                          {item.author}
                        </div>
                        <div className="text-[10px] text-[#74777d] font-mono mt-0.5">
                          {item.year ? `${item.year}` : ""}
                          {item.pages ? ` · ${item.pages} pág.` : ""}
                        </div>
                      </div>
                      <span className="text-xs text-[#1a2e44] font-medium shrink-0">
                        Selecionar →
                      </span>
                    </button>
                  ))}

                  {}
                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      disabled={startIndex === 0}
                      onClick={() =>
                        setStartIndex((prev) => Math.max(0, prev - 8))
                      }
                      className="px-2.5 py-1 rounded border border-[#e4e2e2] disabled:opacity-40"
                    >
                      ← Anterior
                    </button>
                    <span className="text-[11px] text-[#74777d] font-mono">
                      {startIndex + 1} -{" "}
                      {Math.min(startIndex + searchResults.length, totalItems)}{" "}
                      de {totalItems}
                    </span>
                    <button
                      disabled={startIndex + 8 >= totalItems}
                      onClick={() => setStartIndex((prev) => prev + 8)}
                      className="px-2.5 py-1 rounded border border-[#e4e2e2] disabled:opacity-40"
                    >
                      Próxima →
                    </button>
                  </div>
                </div>
              )}

              {!isSearching &&
                searchQuery.trim() &&
                searchResults.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#74777d]">
                    Nenhum resultado encontrado no Google Books.
                  </div>
                )}

              <div className="pt-2 text-center">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-[#1a2e44] hover:underline font-medium"
                >
                  Ou preencher dados manualmente →
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="text-xs text-[#74777d] font-[500] uppercase tracking-widest mb-1">
                Informações básicas
              </div>

              {form.coverUrl && (
                <div className="flex items-center gap-3 p-3 bg-[#f9f7f4] rounded-lg">
                  <div className="relative w-10 h-14 rounded overflow-hidden shrink-0 bg-[#e4e2e2]">
                    <Image
                      src={form.coverUrl}
                      alt={form.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="text-xs text-[#43474d] flex-1">
                    <div className="font-semibold text-[#1b1c1c]">
                      Capa selecionada
                    </div>
                    <div className="text-[11px] text-[#74777d] truncate">
                      {form.coverUrl}
                    </div>
                  </div>
                  <button
                    onClick={() => set("coverUrl", null)}
                    className="text-xs text-[#ba1a1a] hover:underline shrink-0"
                  >
                    Remover
                  </button>
                </div>
              )}

              <Field label="Título *">
                <input
                  className="w-full px-3.5 py-3 text-sm border-b-2 border-[#e4e2e2] bg-[#f9f7f4] rounded-t-md focus:border-[#1a2e44] outline-none transition-colors text-[#1b1c1c]"
                  placeholder="ex.: Comunicação Não-Violenta"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  autoFocus={step === 1}
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
                    {([
                      "consolidating",
                      "consolidated",
                      "archived",
                    ] as ConsolidationState[]).map((state) => {
                      const labels = {
                        consolidating: "Em consolidação",
                        consolidated: "Consolidado",
                        archived: "Arquivado",
                      }
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
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {}
        <div className="px-6 py-4 border-t border-[#e4e2e2] flex gap-3">
          {((!isEdit && step > 0) || (isEdit && step > 1)) && (
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg border border-[#e4e2e2] text-sm font-[500] text-[#43474d] hover:bg-[#f5f3f3] transition-colors disabled:opacity-40"
            >
              Voltar
            </button>
          )}
          {step < 2 ? (
            <button
              disabled={!canProceed() || isPending}
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 py-2.5 rounded-lg bg-[#1a2e44] text-white text-sm font-[600] hover:bg-[#2d4460] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 0 ? "Pular busca" : "Continuar"}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg bg-[#1a2e44] text-white text-sm font-[600] hover:bg-[#2d4460] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isEdit ? "Salvar alterações" : "Adicionar livro"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-xs font-[500] text-[#43474d] mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  )
}
