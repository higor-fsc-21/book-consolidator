import { useState } from "react"
import type { NavigateFn } from "../App"
import type { Book, RevisionRecord } from "../data"
import {
  statusLabels,
  consolidationLabels,
  modeLabels,
  avgScore,
} from "../data"

function BookCover({ gradient }: { gradient: [string, string] }) {
  return (
    <div
      className="w-20 h-28 rounded-[6px] shrink-0"
      style={{
        background: `linear-gradient(160deg, ${gradient[0]}, ${gradient[1]})`,
        boxShadow: "4px 6px 20px rgba(0,0,0,0.25)",
      }}
    />
  )
}

function RevisionRow({
  revision,
  index,
}: {
  revision: RevisionRecord
  index: number
}) {
  const scoreColor =
    revision.score >= 80
      ? "text-[#2a5628]"
      : revision.score >= 60
        ? "text-[#7a5a00]"
        : "text-[#ba1a1a]"
  const barColor =
    revision.score >= 80
      ? "bg-[#8ba889]"
      : revision.score >= 60
        ? "bg-[#f2d492]"
        : "bg-[#ba1a1a]/60"
  const date = new Date(revision.date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  })

  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#f0eeee] last:border-0">
      <div className="text-[11px] font-mono text-[#74777d] w-5 text-center">
        {index + 1}ª
      </div>
      <div className="text-xs text-[#74777d] font-mono w-20 shrink-0">
        {date}
      </div>
      <div className="text-xs text-[#43474d] flex-1">
        {modeLabels[revision.mode]}
      </div>
      <div className="w-24">
        <div className="h-[2px] bg-[#e4e2e2] rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full`}
            style={{ width: `${revision.score}%` }}
          />
        </div>
      </div>
      <div
        className={`text-sm font-mono font-[600] w-10 text-right ${scoreColor}`}
      >
        {revision.score}%
      </div>
      {revision.difficultTopics.length > 0 && (
        <div className="flex gap-1 flex-wrap max-w-[140px]">
          {revision.difficultTopics.slice(0, 2).map((t) => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#ba1a1a]/8 text-[#ba1a1a] font-mono truncate max-w-[70px]"
              title={t}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

interface NewChapterForm {
  title: string
  description: string
}

function AddChapterForm({
  onSave,
  onCancel,
}: {
  onSave: (data: { title: string description?: string }) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<NewChapterForm>({
    title: "",
    description: "",
  })
  const canSave = form.title.trim().length > 0

  return (
    <div className="bg-white rounded-xl border-2 border-[#1a2e44]/30 shadow-paper p-5 space-y-4">
      <div className="text-[11px] font-[600] text-[#1a2e44] uppercase tracking-widest">
        Novo capítulo
      </div>

      <div>
        <label className="text-xs font-[500] text-[#43474d] mb-1.5 block">
          Título *
        </label>
        <input
          className="w-full px-3.5 py-3 text-sm bg-[#f9f7f4] border-b-2 border-[#e4e2e2] focus:border-[#1a2e44] outline-none rounded-t-md text-[#1b1c1c] transition-colors"
          placeholder="ex.: O poder dos pequenos hábitos"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          autoFocus
        />
      </div>

      <div>
        <label className="text-xs font-[500] text-[#43474d] mb-1.5 block">
          Descrição
        </label>
        <textarea
          className="w-full px-3.5 py-3 text-sm bg-[#f9f7f4] border-b-2 border-[#e4e2e2] focus:border-[#1a2e44] outline-none rounded-t-md text-[#1b1c1c] leading-relaxed resize-none transition-colors"
          rows={2}
          placeholder="Do que trata esse capítulo? (opcional)"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
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
          onClick={() =>
            onSave({
              title: form.title,
              description: form.description.trim() || undefined,
            })
          }
          className="flex-1 py-2.5 rounded-lg bg-[#1a2e44] text-white text-sm font-[600] hover:bg-[#2d4460] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Salvar capítulo
        </button>
      </div>
    </div>
  )
}

export function BookDetail({
  book,
  onNavigate,
  onUpdateBook,
  onOpenEditBook,
  onAddChapter,
  onToggleChapterRead,
  onStartReading,
}: {
  book: Book
  onNavigate: NavigateFn
  onUpdateBook: (id: string, updates: Partial<Book>) => void
  onOpenEditBook: () => void
  onAddChapter: (
    bookId: string,
    data: { title: string description?: string },
  ) => void
  onToggleChapterRead: (bookId: string, chapterId: string) => void
  onStartReading: (bookId: string) => void
}) {
  const [activeTab, setActiveTab] =
    useState<"chapters" | "summary" | "revisions">("chapters")
  const [sessionOpen, setSessionOpen] = useState(false)
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [editingSummary, setEditingSummary] = useState(false)
  const [summaryDraft, setSummaryDraft] = useState(book.summary ?? "")
  const [addingChapter, setAddingChapter] = useState(false)

  const readChapters = book.chapters.filter((c) => c.isRead).length
  const chaptersWithQuestions = book.chapters.filter(
    (c) => c.questions.length > 0,
  )
  const totalQuestions = book.chapters.reduce(
    (a, c) => a + c.questions.length,
    0,
  )
  const avg = avgScore(book)

  const progress =
    book.totalChapters > 0 && readChapters > 0
      ? Math.round((readChapters / book.totalChapters) * 100)
      : 0

  const saveSummary = () => {
    onUpdateBook(book.id, { summary: summaryDraft })
    setEditingSummary(false)
  }

  return (
    <div className="min-h-full bg-[#fbf9f8]">
      {/* Hero header */}
      <div className="bg-white border-b border-[#e4e2e2]">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Back */}
          <button
            onClick={() => onNavigate({ view: "library" })}
            className="flex items-center gap-2 text-[#74777d] hover:text-[#1b1c1c] text-xs font-[500] mb-6 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Biblioteca
          </button>

          <div className="flex gap-8 items-start">
            <BookCover gradient={book.coverGradient} />

            <div className="flex-1 min-w-0">
              <h1
                style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                className="text-3xl text-[#1b1c1c] tracking-[-0.01em] leading-tight"
              >
                {book.title}
              </h1>
              <div className="text-[#74777d] mt-1">{book.author}</div>

              {/* Meta */}
              <div className="flex items-center gap-2.5 flex-wrap mt-4">
                <span
                  className={`text-[11px] font-[500] px-2.5 py-1 rounded-full ${
                    book.status === "reading"
                      ? "bg-[#1a2e44]/10 text-[#1a2e44]"
                      : book.status === "completed"
                        ? "bg-[#8ba889]/20 text-[#2a5628]"
                        : "bg-[#74777d]/10 text-[#4a4a5a]"
                  }`}
                >
                  {statusLabels[book.status]}
                </span>
                {book.status === "completed" && (
                  <span
                    className={`text-[11px] font-[500] px-2.5 py-1 rounded-full ${
                      book.consolidationState === "consolidated"
                        ? "bg-[#8ba889]/20 text-[#2a5628]"
                        : book.consolidationState === "archived"
                          ? "bg-[#74777d]/10 text-[#74777d]"
                          : "bg-[#f2d492]/30 text-[#7a5a00]"
                    }`}
                  >
                    {consolidationLabels[book.consolidationState]}
                  </span>
                )}
                {book.year && (
                  <span className="text-xs text-[#74777d] font-mono">
                    {book.year}
                  </span>
                )}
                {book.pages && (
                  <span className="text-xs text-[#74777d] font-mono">
                    {book.pages} páginas
                  </span>
                )}
              </div>

              {/* Progress */}
              {book.status === "reading" && (
                <div className="mt-5 max-w-sm">
                  <div className="flex justify-between text-xs font-mono text-[#74777d] mb-1.5">
                    <span>
                      Capítulo {book.currentChapter} de {book.totalChapters}
                    </span>
                    <span className="text-[#1a2e44] font-[600]">
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
              )}

              {/* Stats */}
              <div className="mt-5 flex gap-6 text-xs font-mono">
                {totalQuestions > 0 && (
                  <div>
                    <div className="text-[#74777d]">Perguntas</div>
                    <div className="text-[#1b1c1c] font-[600] mt-0.5">
                      {totalQuestions}
                    </div>
                  </div>
                )}
                {chaptersWithQuestions.length > 0 && (
                  <div>
                    <div className="text-[#74777d]">Cap. anotados</div>
                    <div className="text-[#1b1c1c] font-[600] mt-0.5">
                      {chaptersWithQuestions.length}
                    </div>
                  </div>
                )}
                {book.revisions.length > 0 && (
                  <div>
                    <div className="text-[#74777d]">Revisões</div>
                    <div className="text-[#1b1c1c] font-[600] mt-0.5">
                      {book.revisions.length}
                    </div>
                  </div>
                )}
                {avg !== null && (
                  <div>
                    <div className="text-[#74777d]">Média de desempenho</div>
                    <div
                      className={`font-[600] mt-0.5 ${
                        avg >= 80
                          ? "text-[#2a5628]"
                          : avg >= 60
                            ? "text-[#7a5a00]"
                            : "text-[#ba1a1a]"
                      }`}
                    >
                      {avg}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="shrink-0 flex flex-col gap-2">
              {(book.status === "want" || book.status === "paused") && (
                <button
                  onClick={() => onStartReading(book.id)}
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
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  {book.status === "paused"
                    ? "Retomar leitura"
                    : "Iniciar leitura"}
                </button>
              )}

              <button
                onClick={onOpenEditBook}
                className="flex items-center gap-2 px-4 py-2.5 border border-[#e4e2e2] text-[#43474d] text-sm font-[500] rounded-lg hover:bg-[#f5f3f3] transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar livro
              </button>

              {chaptersWithQuestions.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setSessionOpen(!sessionOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1a2e44] text-white text-sm font-[600] rounded-lg hover:bg-[#2d4460] transition-colors w-full"
                  >
                    Iniciar revisão
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {sessionOpen && (
                    <div className="absolute top-12 right-0 z-10 w-60 bg-white border border-[#e4e2e2] rounded-xl overflow-hidden shadow-paper-lg">
                      {(["direct", "guided", "recognition"] as const).map(
                        (mode) => {
                          const icons = {
                            direct: "🃏",
                            guided: "💬",
                            recognition: "🔍",
                          }
                          const descs = {
                            direct: "Lembro?",
                            guided: "Explico com minhas palavras?",
                            recognition: "Reconheço em situações reais?",
                          }
                          return (
                            <button
                              key={mode}
                              onClick={() => {
                                setSessionOpen(false)
                                onNavigate({
                                  view: "session",
                                  bookId: book.id,
                                  sessionMode: mode,
                                })
                              }}
                              className="w-full px-4 py-3.5 text-left hover:bg-[#f5f3f3] transition-colors border-b border-[#f0eeee] last:border-0"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-base">{icons[mode]}</span>
                                <div>
                                  <div className="text-xs font-[600] text-[#1b1c1c]">
                                    {modeLabels[mode]}
                                  </div>
                                  <div className="text-[10px] text-[#74777d] mt-0.5">
                                    {descs[mode]}
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        },
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex gap-1 border-b border-[#e4e2e2] -mb-px">
            {([
              { id: "chapters", label: "Capítulos" },
              { id: "summary", label: "Resumo pessoal" },
              {
                id: "revisions",
                label: `Revisões${
                  book.revisions.length > 0 ? ` (${book.revisions.length})` : ""
                }`,
              },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-[500] border-b-2 transition-all -mb-px ${
                  activeTab === tab.id
                    ? "border-[#1a2e44] text-[#1a2e44]"
                    : "border-transparent text-[#74777d] hover:text-[#1b1c1c]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Chapters */}
        {activeTab === "chapters" && (
          <div className="space-y-2">
            {book.chapters.map((chapter) => {
              const isExpanded = expandedChapter === chapter.id
              const hasQ = chapter.questions.length > 0

              return (
                <div
                  key={chapter.id}
                  className="bg-white border border-[#e4e2e2] rounded-xl overflow-hidden shadow-paper-sm"
                >
                  <div className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#f9f7f4] transition-colors">
                    <button
                      onClick={() => onToggleChapterRead(book.id, chapter.id)}
                      title={
                        chapter.isRead
                          ? "Marcar como não lido"
                          : "Marcar como lido"
                      }
                      aria-label={
                        chapter.isRead
                          ? "Marcar como não lido"
                          : "Marcar como lido"
                      }
                      className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center transition-colors ${
                        chapter.isRead
                          ? hasQ
                            ? "bg-[#1a2e44] border-[#1a2e44]"
                            : "bg-[#8ba889] border-[#8ba889]"
                          : "border-[#c4c6cd] hover:border-[#1a2e44]/40"
                      }`}
                    >
                      {chapter.isRead && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <button
                      className="flex-1 flex items-center gap-4 text-left min-w-0"
                      onClick={() =>
                        setExpandedChapter(isExpanded ? null : chapter.id)
                      }
                    >
                      <div className="w-7 h-7 rounded-full bg-[#f5f3f3] flex items-center justify-center text-[11px] font-mono text-[#74777d] shrink-0">
                        {chapter.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-[500] ${
                            chapter.isRead ? "text-[#1b1c1c]" : "text-[#74777d]"
                          }`}
                        >
                          {chapter.title}
                        </div>
                        {chapter.description && (
                          <div className="text-xs text-[#74777d] mt-0.5 truncate">
                            {chapter.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {hasQ ? (
                          <span className="text-[11px] font-mono text-[#74777d]">
                            {chapter.questions.length} perg.
                          </span>
                        ) : chapter.isRead ? (
                          <span className="text-[10px] font-mono text-[#74777d]/50">
                            Sem anotações
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#74777d]/40">
                            Não lido
                          </span>
                        )}
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`text-[#74777d] transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-[#f0eeee]">
                      {chapter.summary && (
                        <div className="mt-4 mb-4 pl-4 border-l-2 border-[#1a2e44]/20">
                          <div className="text-[10px] font-[500] text-[#74777d] uppercase tracking-widest mb-1.5">
                            Resumo
                          </div>
                          <p className="text-sm text-[#43474d] leading-relaxed">
                            {chapter.summary}
                          </p>
                        </div>
                      )}

                      {hasQ && (
                        <div className="mt-4 space-y-3">
                          {chapter.questions.map((q, i) => (
                            <div
                              key={q.id}
                              className="p-3.5 bg-[#f9f7f4] rounded-lg"
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-[10px] font-mono text-[#1a2e44]/50 shrink-0 mt-0.5">
                                  Q{i + 1}
                                </span>
                                <div>
                                  <div className="text-sm text-[#1b1c1c] font-[500] leading-snug">
                                    {q.text}
                                  </div>
                                  <div className="text-xs text-[#43474d] mt-2 leading-relaxed">
                                    {q.answer}
                                  </div>
                                  {q.lastPerformance && (
                                    <span
                                      className={`mt-2 text-[10px] font-mono px-2 py-0.5 rounded inline-block ${
                                        q.lastPerformance === "correct"
                                          ? "bg-[#8ba889]/20 text-[#2a5628]"
                                          : q.lastPerformance === "partial"
                                            ? "bg-[#f2d492]/30 text-[#7a5a00]"
                                            : "bg-[#ba1a1a]/10 text-[#ba1a1a]"
                                      }`}
                                    >
                                      {q.lastPerformance === "correct"
                                        ? "✓ Acertei"
                                        : q.lastPerformance === "partial"
                                          ? "◐ Parcial"
                                          : "✗ Errei"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() =>
                            onNavigate({
                              view: "chapter",
                              bookId: book.id,
                              chapterId: chapter.id,
                            })
                          }
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#e4e2e2] text-[#43474d] hover:bg-[#f5f3f3] transition-colors"
                        >
                          Abrir capítulo
                        </button>
                        {hasQ && (
                          <button
                            onClick={() =>
                              onNavigate({
                                view: "session",
                                bookId: book.id,
                                chapterId: chapter.id,
                                sessionMode: "direct",
                              })
                            }
                            className="text-xs px-3 py-1.5 rounded-lg bg-[#1a2e44]/8 text-[#1a2e44] hover:bg-[#1a2e44]/15 transition-colors font-[500]"
                          >
                            Revisar capítulo
                          </button>
                        )}
                        <button
                          onClick={() =>
                            onToggleChapterRead(book.id, chapter.id)
                          }
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#e4e2e2] text-[#43474d] hover:bg-[#f5f3f3] transition-colors"
                        >
                          {chapter.isRead
                            ? "Marcar como não lido"
                            : "Marcar como lido"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {book.chapters.length === 0 && !addingChapter && (
              <div className="py-12 text-center bg-white rounded-xl border border-dashed border-[#c4c6cd] shadow-paper-sm">
                <h3
                  style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                  className="text-xl text-[#1b1c1c] mb-2"
                >
                  Nenhum capítulo cadastrado
                </h3>
                <p className="text-sm text-[#74777d] mb-6 max-w-sm mx-auto leading-relaxed">
                  Adicione os capítulos conforme for lendo o livro.
                </p>
                <button
                  onClick={() => setAddingChapter(true)}
                  className="px-5 py-2.5 bg-[#1a2e44] text-white text-sm font-[600] rounded-lg hover:bg-[#2d4460] transition-colors"
                >
                  Adicionar capítulo
                </button>
              </div>
            )}

            {addingChapter && (
              <AddChapterForm
                onSave={(data) => {
                  onAddChapter(book.id, data)
                  setAddingChapter(false)
                }}
                onCancel={() => setAddingChapter(false)}
              />
            )}

            {!addingChapter && book.chapters.length > 0 && (
              <button
                onClick={() => setAddingChapter(true)}
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
                Adicionar capítulo
              </button>
            )}
          </div>
        )}

        {/* Summary */}
        {activeTab === "summary" && (
          <div>
            {editingSummary ? (
              <div>
                <div className="text-[11px] font-[500] text-[#74777d] uppercase tracking-widest mb-3">
                  Resumo pessoal
                </div>
                <textarea
                  className="w-full px-4 py-3.5 text-sm text-[#1b1c1c] bg-white border border-[#1a2e44] rounded-xl focus:outline-none leading-relaxed resize-none shadow-paper-sm"
                  rows={10}
                  placeholder="Escreva aqui suas principais aprendizagens, insights e ideias que deseja lembrar..."
                  value={summaryDraft}
                  onChange={(e) => setSummaryDraft(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setSummaryDraft(book.summary ?? "")
                      setEditingSummary(false)
                    }}
                    className="px-4 py-2.5 rounded-lg border border-[#e4e2e2] text-sm font-[500] text-[#43474d] hover:bg-[#f5f3f3] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveSummary}
                    className="px-4 py-2.5 rounded-lg bg-[#1a2e44] text-white text-sm font-[600] hover:bg-[#2d4460] transition-colors"
                  >
                    Salvar resumo
                  </button>
                </div>
              </div>
            ) : book.summary ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[11px] font-[500] text-[#74777d] uppercase tracking-widest">
                    Resumo pessoal
                  </div>
                  <button
                    onClick={() => {
                      setSummaryDraft(book.summary ?? "")
                      setEditingSummary(true)
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#e4e2e2] text-[#43474d] hover:bg-[#f5f3f3] transition-colors flex items-center gap-1.5"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Editar
                  </button>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-paper">
                  <p className="text-[15px] text-[#1b1c1c] leading-relaxed">
                    {book.summary}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-[#f5f3f3] flex items-center justify-center mx-auto mb-4">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#74777d"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <h3
                  style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                  className="text-xl text-[#1b1c1c] mb-2"
                >
                  Sem resumo ainda
                </h3>
                <p className="text-sm text-[#74777d] mb-6 max-w-sm mx-auto leading-relaxed">
                  Tente lembrar espontaneamente as ideias principais antes de
                  consultar suas anotações.
                </p>
                <button
                  onClick={() => {
                    setSummaryDraft("")
                    setEditingSummary(true)
                  }}
                  className="px-5 py-2.5 bg-[#1a2e44] text-white text-sm font-[600] rounded-lg hover:bg-[#2d4460] transition-colors"
                >
                  Escrever resumo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Revisions */}
        {activeTab === "revisions" && (
          <div>
            {book.revisions.length > 0 ? (
              <>
                {/* Bar chart */}
                <div className="bg-white rounded-xl p-6 shadow-paper border border-[#e4e2e2] mb-6">
                  <div className="text-[10px] font-[500] text-[#74777d] uppercase tracking-widest mb-4">
                    Evolução do desempenho
                  </div>
                  <div className="flex items-end gap-4 h-20">
                    {book.revisions.map((r) => {
                      const barColor =
                        r.score >= 80
                          ? "bg-[#8ba889]"
                          : r.score >= 60
                            ? "bg-[#f2d492]"
                            : "bg-[#ba1a1a]/60"
                      return (
                        <div
                          key={r.id}
                          className="flex flex-col items-center gap-1 flex-1"
                        >
                          <div className="text-[11px] font-mono text-[#1b1c1c] font-[500]">
                            {r.score}%
                          </div>
                          <div
                            className="w-full bg-[#f0eeee] rounded-sm overflow-hidden"
                            style={{ height: "48px" }}
                          >
                            <div
                              className={`w-full ${barColor} rounded-sm`}
                              style={{
                                height: `${r.score}%`,
                                marginTop: `${100 - r.score}%`,
                              }}
                            />
                          </div>
                          <div className="text-[10px] font-mono text-[#74777d] text-center">
                            {new Date(r.date).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {book.revisions.length >= 2 &&
                    (() => {
                      const diff =
                        book.revisions.at(-1)!.score - book.revisions[0].score
                      return (
                        <div className="mt-4 pt-4 border-t border-[#f0eeee] text-sm text-[#74777d]">
                          Da primeira à última revisão:{" "}
                          <span
                            className={
                              diff >= 0
                                ? "text-[#2a5628] font-[600]"
                                : "text-[#ba1a1a] font-[600]"
                            }
                          >
                            {diff >= 0 ? "+" : ""}
                            {diff} pontos
                          </span>
                        </div>
                      )
                    })()}
                </div>

                {/* Revision list */}
                <div className="bg-white rounded-xl p-5 shadow-paper border border-[#e4e2e2]">
                  {book.revisions.map((r, i) => (
                    <RevisionRow key={r.id} revision={r} index={i} />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-16 text-center">
                <h3
                  style={{ fontFamily: "'Libre Caslon Text', Georgia, serif" }}
                  className="text-xl text-[#1b1c1c] mb-2"
                >
                  Nenhuma revisão ainda
                </h3>
                <p className="text-sm text-[#74777d] mb-6">
                  Inicie uma sessão para registrar seu primeiro desempenho.
                </p>
                {chaptersWithQuestions.length > 0 && (
                  <button
                    onClick={() =>
                      onNavigate({ view: "session", bookId: book.id })
                    }
                    className="px-5 py-2.5 bg-[#1a2e44] text-white text-sm font-[600] rounded-lg hover:bg-[#2d4460] transition-colors"
                  >
                    Iniciar primeira revisão
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
