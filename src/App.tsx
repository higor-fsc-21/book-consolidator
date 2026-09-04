import { useState } from "react"
import type {
  SessionMode,
  Book,
  RevisionRecord,
  Question,
  Chapter,
} from "./data"
import { MOCK_BOOKS, generateId } from "./data"
import { Login } from "./views/Login"
import { Dashboard } from "./views/Dashboard"
import { Library } from "./views/Library"
import { BookDetail } from "./views/BookDetail"
import { ChapterDetail } from "./views/ChapterDetail"
import { MemorizationSession } from "./views/MemorizationSession"
import { BookModal } from "./components/BookModal"

export type View = "dashboard" | "library" | "book" | "chapter" | "session"

export interface NavState {
  view: View
  bookId?: string
  chapterId?: string
  sessionMode?: SessionMode
}

export type NavigateFn = (state: NavState) => void

function Sidebar({
  currentView,
  onNavigate,
  onLogout,
}: {
  currentView: View
  onNavigate: NavigateFn
  onLogout: () => void
}) {
  const navItems = [
    {
      id: "dashboard" as View,
      label: "Início",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: "library" as View,
      label: "Biblioteca",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
  ]

  const inLibrary = ["library", "book", "chapter"].includes(currentView)

  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-full border-r border-[#e4e2e2] bg-[#f5f3f3]">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-[#e4e2e2]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #1a2e44, #2d4460)" }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <span className="font-display text-[15px] font-[400] text-[#1b1c1c] tracking-[-0.01em]">
            Memora
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ id, label, icon }) => {
          const active =
            id === "dashboard" ? currentView === "dashboard" : inLibrary
          return (
            <button
              key={id}
              onClick={() => onNavigate({ view: id })}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                active
                  ? "bg-[#1a2e44]/[0.09] text-[#1a2e44] font-[600]"
                  : "text-[#43474d] hover:text-[#1b1c1c] hover:bg-[#1b1c1c]/[0.04]"
              }`}
            >
              {icon}
              {label}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-[#e4e2e2]">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-[600] shrink-0"
            style={{ background: "linear-gradient(135deg, #1a2e44, #2d4460)" }}
          >
            R
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-[600] text-[#1b1c1c] truncate">
              Rafael
            </div>
            <div className="text-[11px] text-[#74777d] mt-0.5">
              🔥 18 dias seguidos
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sair"
            className="text-[#74777d] hover:text-[#ba1a1a] transition-colors"
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS)
  const [nav, setNav] = useState<NavState>({ view: "dashboard" })
  const [bookModal, setBookModal] = useState<{ open: boolean editId?: string }>(
    { open: false },
  )

  const navigate: NavigateFn = (state) => setNav(state)

  const addBook = (book: Omit<Book, "id" | "revisions" | "chapters">) => {
    const id = generateId()
    const newBook: Book = {
      ...book,
      id,
      revisions: [],
      chapters: Array.from({ length: book.totalChapters }, (_, i) => ({
        id: generateId(),
        bookId: id,
        number: i + 1,
        title: `Capítulo ${i + 1}`,
        questions: [],
        isRead: false,
      })),
    }
    setBooks((prev) => [...prev, newBook])
    setBookModal({ open: false })
  }

  const updateBook = (id: string, updates: Partial<Book>) =>
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    )

  const addRevision = (bookId: string, revision: Omit<RevisionRecord, "id">) =>
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              revisions: [...b.revisions, { ...revision, id: generateId() }],
              lastRevision: revision.date,
            }
          : b,
      ),
    )

  const addQuestion = (
    bookId: string,
    chapterId: string,
    question: Omit<Question, "id">,
  ) =>
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              chapters: b.chapters.map((c) =>
                c.id === chapterId
                  ? {
                      ...c,
                      questions: [
                        ...c.questions,
                        { ...question, id: generateId() },
                      ],
                    }
                  : c,
              ),
            }
          : b,
      ),
    )

  const addChapter = (
    bookId: string,
    data: { title: string description?: string },
  ) =>
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b
        const number =
          b.chapters.reduce((max, c) => Math.max(max, c.number), 0) + 1
        const chapter: Chapter = {
          id: generateId(),
          bookId: b.id,
          number,
          title: data.title.trim() || `Capítulo ${number}`,
          description: data.description?.trim() || undefined,
          questions: [],
          isRead: false,
        }
        return {
          ...b,
          chapters: [...b.chapters, chapter],
          totalChapters: Math.max(b.totalChapters, number),
        }
      }),
    )

  const toggleChapterRead = (bookId: string, chapterId: string) =>
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b
        const chapters = b.chapters.map((c) =>
          c.id === chapterId ? { ...c, isRead: !c.isRead } : c,
        )
        const readCount = chapters.filter((c) => c.isRead).length
        return {
          ...b,
          chapters,
          currentChapter: Math.min(readCount + 1, b.totalChapters),
        }
      }),
    )

  const startReading = (bookId: string) =>
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              status: "reading",
              startDate: b.startDate ?? new Date().toISOString().slice(0, 10),
              currentChapter: b.currentChapter ?? 1,
            }
          : b,
      ),
    )

  const selectedBook = nav.bookId
    ? books.find((b) => b.id === nav.bookId)
    : undefined
  const selectedChapter =
    nav.chapterId && selectedBook
      ? selectedBook.chapters.find((c) => c.id === nav.chapterId)
      : undefined

  const editBook = bookModal.editId
    ? books.find((b) => b.id === bookModal.editId)
    : undefined

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <div
      className="flex h-full bg-[#fbf9f8] overflow-hidden"
      style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
    >
      <Sidebar
        currentView={nav.view}
        onNavigate={navigate}
        onLogout={() => setIsAuthenticated(false)}
      />

      <main className="flex-1 overflow-auto min-w-0 bg-[#fbf9f8]">
        {nav.view === "dashboard" && (
          <Dashboard books={books} onNavigate={navigate} />
        )}
        {nav.view === "library" && (
          <Library
            books={books}
            onNavigate={navigate}
            onOpenAddBook={() => setBookModal({ open: true })}
            onOpenEditBook={(id) => setBookModal({ open: true, editId: id })}
          />
        )}
        {nav.view === "book" && selectedBook && (
          <BookDetail
            book={selectedBook}
            onNavigate={navigate}
            onUpdateBook={updateBook}
            onOpenEditBook={() =>
              setBookModal({ open: true, editId: selectedBook.id })
            }
            onAddChapter={addChapter}
            onToggleChapterRead={toggleChapterRead}
            onStartReading={startReading}
          />
        )}
        {nav.view === "chapter" && selectedBook && selectedChapter && (
          <ChapterDetail
            book={selectedBook}
            chapter={selectedChapter}
            onNavigate={navigate}
            onAddQuestion={addQuestion}
          />
        )}
        {nav.view === "session" && selectedBook && (
          <MemorizationSession
            book={selectedBook}
            chapter={selectedChapter}
            initialMode={nav.sessionMode}
            onNavigate={navigate}
            onAddRevision={addRevision}
          />
        )}
      </main>

      {bookModal.open && (
        <BookModal
          editBook={editBook}
          onSave={(data) => {
            if (editBook) {
              updateBook(editBook.id, data)
              setBookModal({ open: false })
            } else {
              addBook(data as Omit<Book, "id" | "revisions" | "chapters">)
            }
          }}
          onClose={() => setBookModal({ open: false })}
        />
      )}
    </div>
  )
}
