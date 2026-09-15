"use client" /* Header */ /* Search + filter row */ /* Search */ /* Filters toggle */ /* Sort */ /* Sort direction */ /* Extended filter panel */ /* Status tabs */ /* Grid */
import { useState, useMemo, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import type {
  Book,
  ReadingStatus,
  Importance,
  ConsolidationState,
} from "@/domain/types"
import { statusLabels, consolidationLabels } from "@/domain/constants"
import {
  avgScore,
  coverGradient,
  effectiveConsolidationState,
} from "@/domain/derived"
import { createBook } from "@/app/actions/books"
import { BookModal } from "@/components/BookModal"

function BookCover({
  coverUrl,
  title,
  gradient,
}: {
  coverUrl?: string | null
  title: string
  gradient: [string, string]
}) {
  if (coverUrl) {
    return (
      <div className="relative w-12 h-16 rounded-[5px] shrink-0 overflow-hidden shadow-[2px_3px_10px_rgba(0,0,0,0.2)] bg-[#e4e2e2]">
        <Image
          src={coverUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
    )
  }

  return (
    <div
      className="w-12 h-16 rounded-[5px] shrink-0"
      style={{
        background: `linear-gradient(160deg, ${gradient[0]}, ${gradient[1]})`,
        boxShadow: "2px 3px 10px rgba(0,0,0,0.2)",
      }}
    />
  )
}

function StatusBadge({ status }: { status: ReadingStatus }) {
  const styles: Record<ReadingStatus, string> = {
    reading: "bg-[#1a2e44]/10 text-[#1a2e44]",
    completed: "bg-[#8ba889]/20 text-[#2a5628]",
    want: "bg-[#74777d]/10 text-[#4a4a5a]",
    paused: "bg-[#f2d492]/30 text-[#7a5a00]",
    archived: "bg-[#74777d]/8 text-[#74777d]",
  }
  return (
    <span
      className={`text-[10px] font-[500] px-2 py-0.5 rounded-full ${styles[status]}`}
    >
      {statusLabels[status]}
    </span>
  )
}

function ConsolidationBadge({ state }: { state: ConsolidationState }) {
  const styles: Record<ConsolidationState, string> = {
    consolidating: "bg-[#f2d492]/30 text-[#7a5a00]",
    consolidated: "bg-[#8ba889]/20 text-[#2a5628]",
    archived: "bg-[#74777d]/8 text-[#74777d]",
  }
  return (
    <span
      className={`text-[10px] font-[500] px-2 py-0.5 rounded-full ${styles[state]}`}
    >
      {consolidationLabels[state]}
    </span>
  )
}

function ImportanceDots({ level }: { level: Importance }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= 4 - level ? "bg-[#1a2e44]" : "bg-[#e4e2e2]"
          }`}
        />
      ))}
    </div>
  )
}

function BookCard({ book }: { book: Book }) {
  const avg = avgScore(book)
  const totalQ = book.chapters.reduce((a, c) => a + c.questions.length, 0)
  const readChapters = book.chapters.filter((c) => c.isRead).length
  const progress =
    book.totalChapters > 0 && readChapters > 0
      ? Math.round((readChapters / book.totalChapters) * 100)
      : 0

  return (
    <Link
      href={`/livros/${book.id}`}
      className="group w-full bg-white rounded-xl p-5 shadow-paper hover:shadow-paper-lg transition-shadow text-left block"
    >
      <div className="flex gap-4">
        <BookCover
          coverUrl={book.coverUrl}
          title={book.title}
          gradient={coverGradient(book.id)}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                className="text-[15px] text-[#1b1c1c] leading-snug group-hover:text-[#1a2e44] transition-colors line-clamp-2"
              >
                {book.title}
              </h3>
              <div className="text-xs text-[#74777d] mt-0.5 truncate">
                {book.author}
              </div>
            </div>
            <ImportanceDots level={book.importance} />
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <StatusBadge status={book.status} />
            {book.status === "completed" && (
              <ConsolidationBadge state={effectiveConsolidationState(book)} />
            )}
          </div>

          {book.status === "reading" && book.currentChapter && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] font-mono text-[#74777d] mb-1">
                <span>
                  Cap. {book.currentChapter}/{book.totalChapters}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-[2px] bg-[#e4e2e2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8ba889] rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {book.status === "completed" && (
            <div className="mt-3 flex gap-4 text-[11px] font-mono text-[#74777d]">
              {totalQ > 0 && <span>{totalQ} perguntas</span>}
              {avg !== null && (
                <span>
                  Média:{" "}
                  <span className="text-[#1b1c1c] font-[600]">{avg}%</span>
                </span>
              )}
            </div>
          )}

          {book.status === "paused" && book.currentChapter && (
            <div className="mt-3 text-[11px] font-mono text-[#74777d]">
              Pausado no cap. {book.currentChapter}
            </div>
          )}

          {book.status === "want" && book.year && (
            <div className="mt-3 text-[11px] font-mono text-[#74777d]">
              {book.year}
              {book.pages ? ` · ${book.pages} páginas` : ""}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

type SortKey = "name" | "importance" | "consolidation" | "questions"
const sortLabels: Record<SortKey, string> = {
  name: "Nome",
  importance: "Importância",
  consolidation: "Consolidação",
  questions: "Qtd. de perguntas",
}
const consolidationOrder: Record<ConsolidationState, number> = {
  consolidating: 0,
  consolidated: 1,
  archived: 2,
}

export function Library({ books }: { books: Book[] }) {
  const [addOpen, setAddOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | "all">("all")
  const [importanceFilter, setImportanceFilter] = useState<Importance | "all">(
    "all",
  )
  const [consolidationFilter, setConsolidationFilter] =
    useState<ConsolidationState | "all">("all")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortAsc, setSortAsc] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    let result = [...books]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q),
      )
    }
    if (statusFilter !== "all")
      result = result.filter((b) => b.status === statusFilter)
    if (importanceFilter !== "all")
      result = result.filter((b) => b.importance === importanceFilter)
    if (consolidationFilter !== "all")
      result = result.filter(
        (b) => effectiveConsolidationState(b) === consolidationFilter,
      )

    result.sort((a, b) => {
      let diff = 0
      if (sortKey === "name") diff = a.title.localeCompare(b.title, "pt-BR")
      else if (sortKey === "importance") diff = a.importance - b.importance
      else if (sortKey === "consolidation")
        diff =
          consolidationOrder[effectiveConsolidationState(a)] -
          consolidationOrder[effectiveConsolidationState(b)]
      else if (sortKey === "questions") {
        const qa = a.chapters.reduce((s, c) => s + c.questions.length, 0)
        const qb = b.chapters.reduce((s, c) => s + c.questions.length, 0)
        diff = qb - qa
      }
      return sortAsc ? diff : -diff
    })

    return result
  }, [
    books,
    search,
    statusFilter,
    importanceFilter,
    consolidationFilter,
    sortKey,
    sortAsc,
  ])

  const statusTabs: Array<{
    id: ReadingStatus | "all"
    label: string
  }> = [
    { id: "all", label: "Todos" },
    { id: "reading", label: "Lendo" },
    { id: "completed", label: "Concluídos" },
    { id: "want", label: "Quero ler" },
    { id: "paused", label: "Pausados" },
  ]

  const hasActiveFilters =
    importanceFilter !== "all" || consolidationFilter !== "all" || search.trim()

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
            className="text-4xl text-[#1b1c1c] tracking-[-0.02em]"
          >
            Biblioteca
          </h1>
          <p className="text-[#74777d] text-sm mt-1">
            {books.length} livros ·{" "}
            {books.filter((b) => b.status === "completed").length} concluídos
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1a2e44] text-white text-sm font-[600] rounded-lg hover:bg-[#2d4460] transition-colors"
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar livro
        </button>
      </div>

      {}
      <div className="flex gap-3 mb-4">
        {}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#74777d]"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="w-full pl-9 pr-4 py-2.5 bg-white text-sm text-[#1b1c1c] rounded-lg border border-[#e4e2e2] focus:border-[#1a2e44] outline-none placeholder-[#74777d] shadow-paper-sm transition-colors"
            placeholder="Buscar por título ou autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {}
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-[500] border transition-all ${
            hasActiveFilters
              ? "bg-[#1a2e44] text-white border-[#1a2e44]"
              : "bg-white text-[#43474d] border-[#e4e2e2] hover:border-[#1a2e44]/40 shadow-paper-sm"
          }`}
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
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filtros{hasActiveFilters && " •"}
        </button>

        {}
        <div className="relative">
          <select
            className="appearance-none px-4 py-2.5 pr-8 rounded-lg text-sm font-[500] text-[#43474d] bg-white border border-[#e4e2e2] hover:border-[#1a2e44]/40 outline-none cursor-pointer shadow-paper-sm"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            {Object.entries(sortLabels).map(([k, label]) => (
              <option key={k} value={k}>
                Ordenar: {label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#74777d] pointer-events-none"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {}
        <button
          onClick={() => setSortAsc((a) => !a)}
          className="p-2.5 bg-white border border-[#e4e2e2] rounded-lg text-[#74777d] hover:text-[#1b1c1c] hover:border-[#1a2e44]/40 transition-colors shadow-paper-sm"
          title={sortAsc ? "Ascendente" : "Descendente"}
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
            {sortAsc ? (
              <>
                <line x1="4" y1="6" x2="11" y2="6" />
                <line x1="4" y1="12" x2="8" y2="12" />
                <line x1="4" y1="18" x2="6" y2="18" />
                <polyline points="15 8 18 5 21 8" />
                <line x1="18" y1="5" x2="18" y2="19" />
              </>
            ) : (
              <>
                <line x1="4" y1="6" x2="11" y2="6" />
                <line x1="4" y1="12" x2="8" y2="12" />
                <line x1="4" y1="18" x2="6" y2="18" />
                <polyline points="15 16 18 19 21 16" />
                <line x1="18" y1="19" x2="18" y2="5" />
              </>
            )}
          </svg>
        </button>
      </div>

      {}
      {filtersOpen && (
        <div className="bg-white rounded-xl p-5 shadow-paper border border-[#e4e2e2] mb-4 grid grid-cols-2 gap-5">
          <div>
            <div className="text-xs font-[500] text-[#43474d] mb-2">
              Importância
            </div>
            <div className="flex gap-2">
              {(["all", 1, 2, 3] as const).map((i) => {
                const labels = {
                  all: "Todas",
                  1: "Alta",
                  2: "Média",
                  3: "Baixa",
                }
                return (
                  <button
                    key={i}
                    onClick={() =>
                      setImportanceFilter(i as typeof importanceFilter)
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-[500] border transition-all ${
                      importanceFilter === i
                        ? "bg-[#1a2e44] text-white border-[#1a2e44]"
                        : "bg-white text-[#43474d] border-[#e4e2e2] hover:border-[#1a2e44]/40"
                    }`}
                  >
                    {labels[i]}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-[500] text-[#43474d] mb-2">
              Consolidação
            </div>
            <div className="flex gap-2 flex-wrap">
              {([
                "all",
                "consolidating",
                "consolidated",
                "archived",
              ] as const).map((c) => {
                const labels = {
                  all: "Todas",
                  consolidating: "Em consolidação",
                  consolidated: "Consolidado",
                  archived: "Arquivado",
                }
                return (
                  <button
                    key={c}
                    onClick={() =>
                      setConsolidationFilter(c as typeof consolidationFilter)
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-[500] border transition-all ${
                      consolidationFilter === c
                        ? "bg-[#1a2e44] text-white border-[#1a2e44]"
                        : "bg-white text-[#43474d] border-[#e4e2e2] hover:border-[#1a2e44]/40"
                    }`}
                  >
                    {labels[c]}
                  </button>
                )
              })}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="col-span-2 flex justify-end">
              <button
                onClick={() => {
                  setSearch("")
                  setImportanceFilter("all")
                  setConsolidationFilter("all")
                }}
                className="text-xs text-[#ba1a1a] hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {}
      <div className="flex gap-1 border-b border-[#e4e2e2] mb-6">
        {statusTabs.map((tab) => {
          const count =
            tab.id === "all"
              ? books.length
              : books.filter((b) => b.status === tab.id).length
          if (tab.id !== "all" && count === 0) return null
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2.5 text-sm font-[500] border-b-2 -mb-px transition-all ${
                statusFilter === tab.id
                  ? "border-[#1a2e44] text-[#1a2e44]"
                  : "border-transparent text-[#74777d] hover:text-[#1b1c1c]"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] text-[#74777d]">{count}</span>
            </button>
          )
        })}
      </div>

      {}
      {filtered.length === 0 ? (
        <div className="py-24 text-center text-[#74777d]">
          Nenhum livro encontrado com esses filtros.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}

          <button
            onClick={() => setAddOpen(true)}
            className="bg-white rounded-xl p-5 border border-dashed border-[#c4c6cd] flex items-center justify-center gap-3 text-[#74777d] hover:text-[#1a2e44] hover:border-[#1a2e44]/40 transition-all min-h-[120px] shadow-paper-sm"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="text-sm font-[500]">Adicionar livro</span>
          </button>
        </div>
      )}

      {addOpen && (
        <BookModal
          onClose={() => {
            setAddOpen(false)
            setErrorMessage(null)
          }}
          isPending={isPending}
          errorMessage={errorMessage}
          onSave={async (data) => {
            setErrorMessage(null)
            startTransition(async () => {
              const res = await createBook(data)
              if (res.success) {
                setAddOpen(false)
              } else {
                setErrorMessage(res.error || "Erro ao salvar livro")
              }
            })
          }}
        />
      )}
    </div>
  )
}
