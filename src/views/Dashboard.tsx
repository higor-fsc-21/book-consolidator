import type { NavigateFn } from "../App"
import type { Book } from "../data"
import {
  ANNUAL_GOAL,
  getReadingBook,
  getCompletedBooks,
  modeLabels,
  avgScore,
} from "../data"

function BookCover({
  gradient,
  size = "md",
}: {
  gradient: [string, string]
  size?: "sm" | "md" | "lg"
}) {
  const dims =
    size === "sm" ? "w-8 h-11" : size === "md" ? "w-12 h-17" : "w-20 h-28"
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
  )
}

function ScoreChip({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-[#2a5628] bg-[#8ba889]/20"
      : score >= 60
        ? "text-[#7a5a00] bg-[#f2d492]/30"
        : "text-[#ba1a1a] bg-[#ba1a1a]/10"
  return (
    <span
      className={`text-[11px] font-mono font-[500] px-2 py-0.5 rounded-full ${color}`}
    >
      {score}%
    </span>
  )
}

export function Dashboard({
  books,
  onNavigate,
}: {
  books: Book[]
  onNavigate: NavigateFn
}) {
  const readingBook = getReadingBook(books)
  const completed = getCompletedBooks(books)
  const recommendedBook =
    books.find((b) => b.id === "b1") ??
    books.find((b) => b.status === "reading")

  const today = new Date()
  const dateStr = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const capitalDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  const daysSinceRevision = recommendedBook?.lastRevision
    ? Math.floor(
        (today.getTime() - new Date(recommendedBook.lastRevision).getTime()) /
          86400000,
      )
    : null

  const readChapters = readingBook?.chapters.filter((c) => c.isRead).length ?? 0
  const readingProgress =
    readingBook && readingBook.totalChapters > 0
      ? Math.round((readChapters / readingBook.totalChapters) * 100)
      : 0

  const recAvgScore = recommendedBook ? avgScore(recommendedBook) : null

  // Recent revision timeline: all revisions across all books, sorted by date desc
  const timeline = books
    .flatMap((b) => b.revisions.map((r) => ({ ...r, book: b })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="text-xs text-[#74777d] font-[500] uppercase tracking-widest mb-1">
          {capitalDate}
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

      {/* Primary row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Currently reading */}
        {readingBook ? (
          <div
            className="bg-white rounded-xl p-6 shadow-paper cursor-pointer hover:shadow-paper-lg transition-shadow flex flex-col"
            onClick={() => onNavigate({ view: "book", bookId: readingBook.id })}
          >
            <div className="text-[10px] text-[#74777d] font-[500] uppercase tracking-widest mb-4">
              Lendo agora
            </div>
            <div className="flex gap-5 flex-1">
              <BookCover gradient={readingBook.coverGradient} size="lg" />
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
                      {readingProgress}%
                    </span>
                  </div>
                  <div className="h-[2px] bg-[#e4e2e2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8ba889] rounded-full"
                      style={{ width: `${readingProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                className="text-xs px-4 py-2 rounded-lg bg-[#1a2e44] text-white font-[600] hover:bg-[#2d4460] transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate({ view: "book", bookId: readingBook.id })
                }}
              >
                Abrir livro
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow-paper flex flex-col items-center justify-center border border-dashed border-[#c4c6cd]">
            <div className="text-center">
              <div className="text-[#74777d] text-sm">
                Nenhum livro em leitura
              </div>
              <button
                className="mt-3 text-xs px-4 py-2 rounded-lg bg-[#1a2e44] text-white font-[600]"
                onClick={() => onNavigate({ view: "library" })}
              >
                Ver biblioteca
              </button>
            </div>
          </div>
        )}

        {/* Recommended for revision */}
        {recommendedBook && (
          <div className="bg-white rounded-xl p-6 shadow-paper border-l-4 border-[#1a2e44] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-[10px] text-[#1a2e44] font-[600] uppercase tracking-widest">
                Recomendado para revisão
              </div>
              <div className="px-2 py-0.5 rounded-full bg-[#f2d492]/40 text-[#7a5a00] text-[10px] font-[500]">
                hoje
              </div>
            </div>

            <div className="flex gap-4 flex-1">
              <BookCover gradient={recommendedBook.coverGradient} size="lg" />
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
                      muito importante
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <button
                className="text-xs px-4 py-2 rounded-lg bg-[#1a2e44] text-white font-[600] hover:bg-[#2d4460] transition-colors"
                onClick={() =>
                  onNavigate({ view: "session", bookId: recommendedBook.id })
                }
              >
                Iniciar revisão
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Meta anual",
            value: `${completed.length} / ${ANNUAL_GOAL}`,
            sub: `${Math.round((completed.length / ANNUAL_GOAL) * 100)}% concluído`,
          },
          {
            label: "Em consolidação",
            value: `${books.filter((b) => b.consolidationState === "consolidating" && b.status === "completed").length}`,
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

      {/* Annual goal progress */}
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

      {/* Recent revision timeline */}
      <div className="bg-white rounded-xl p-6 shadow-paper">
        <div className="text-[10px] text-[#74777d] font-[500] uppercase tracking-widest mb-5">
          Histórico de revisões
        </div>

        {timeline.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#74777d]">
            Nenhuma revisão registrada ainda.
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-[#e4e2e2]" />

            <div className="space-y-0">
              {timeline.map((item, idx) => {
                const revDate = new Date(item.date)
                const dateLabel = revDate.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                })
                const isFirst = idx === 0

                return (
                  <div key={item.id} className="flex items-center gap-4 py-3">
                    {/* Dot */}
                    <div className={`w-[30px] flex justify-center shrink-0`}>
                      <div
                        className={`w-2.5 h-2.5 rounded-full border-2 ${
                          isFirst
                            ? "bg-[#1a2e44] border-[#1a2e44]"
                            : "bg-white border-[#c4c6cd]"
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <button
                      className="flex-1 flex items-center gap-3 text-left hover:bg-[#f5f3f3] rounded-lg px-3 py-2 -mx-3 transition-colors group"
                      onClick={() =>
                        onNavigate({ view: "book", bookId: item.book.id })
                      }
                    >
                      <BookCover gradient={item.book.coverGradient} size="sm" />
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
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
