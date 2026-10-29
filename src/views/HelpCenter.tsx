"use client"

// FAQ state

// Feedback form state
/* Header */ /* Navigation Tabs */ /* Main Content Area */ /* TAB 1: Tópicos do App */ /* Quick Link Card to Contact */ /* TAB 2: Perguntas Frequentes (FAQ) */ /* Search and Filters */ /* Category Pills */ /* Accordion FAQ list */ /* Bottom Support CTA */ /* TAB 3: Fale com o Dev */ /* Success View */
/* Contact Form */ /* User Context Info Card */ /* Category Selection */ /* Subject Input */ /* Message Input */ /* Submit Button */

import { useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  FAQ_ITEMS,
  FEEDBACK_CATEGORY_LABELS,
  HELP_TOPICS,
  type FaqItem,
} from "@/domain/helpContent"
import type { FeedbackCategory } from "@/domain/types"
import { sendFeedbackAction } from "@/app/actions/feedback"
import { useSingleFlightTransition } from "@/hooks/useSingleFlightTransition"

type HelpTab = "topicos" | "faq" | "contato"

interface HelpCenterProps {
  user: {
    name: string
    email: string
  }
}

export function HelpCenter({ user }: HelpCenterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tabParam = searchParams.get("tab")
  const activeTab: HelpTab =
    tabParam ===
      "faq" ||
    tabParam ===
      "contato"
      ? tabParam
      : "topicos"

  const setActiveTab = (tab: HelpTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (
      tab ===
      "topicos"
    ) {
      params.delete("tab")
    } else {
      params.set("tab", tab)
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    })
  }
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>("all")
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("faq-1")
  const [category, setCategory] = useState<FeedbackCategory>("question")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useSingleFlightTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sentSuccessData, setSentSuccessData] = useState<{
    id: string
    category: FeedbackCategory
    subject: string
    emailSent: boolean
  } | null>(null)

  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        selectedFaqCategory === "all" || item.category === selectedFaqCategory
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [searchQuery, selectedFaqCategory])

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    startTransition(async () => {
      const res = await sendFeedbackAction({
        category,
        subject,
        message,
      })

      if (res.success && res.data) {
        setSentSuccessData({
          id: res.data.id,
          category,
          subject,
          emailSent: res.data.emailSent,
        })
        setSubject("")
        setMessage("")
      } else {
        setErrorMessage(
          !res.success
            ? res.error
            : "Ocorreu um erro ao enviar. Verifique os dados e tente novamente.",
        )
      }
    })
  }

  const handleResetForm = () => {
    setSentSuccessData(null)
    setErrorMessage(null)
    setSubject("")
    setMessage("")
    setCategory("question")
  }

  const toggleFaq = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="min-h-full bg-[#fbf9f8]">
      {}
      <div className="border-b border-[#e4e2e2] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-2 text-xs font-[500] uppercase tracking-widest text-[#74777d]">
            Suporte & Aprendizado
          </div>
          <h1 className="font-display text-3xl font-[400] tracking-[-0.01em] text-[#1b1c1c] sm:text-4xl">
            Central de Ajuda
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#74777d]">
            Entenda o método de consolidação, confira respostas para dúvidas
            frequentes e envie mensagens diretamente ao desenvolvedor.
          </p>

          {}
          <div className="-mb-px mt-8 flex flex-wrap gap-2 border-b border-[#e4e2e2]">
            {([
              { id: "topicos", label: "Tópicos do App" },
              { id: "faq", label: "Perguntas Frequentes" },
              { id: "contato", label: "Fale com o Dev" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-[500] transition-all ${
                  activeTab === tab.id
                    ? "border-[#1a2e44] font-[600] text-[#1a2e44]"
                    : "border-transparent text-[#74777d] hover:text-[#1b1c1c]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {}
        {activeTab === "topicos" && (
          <div className="space-y-6">
            <div className="grid gap-6">
              {HELP_TOPICS.map((topic) => (
                <div
                  key={topic.id}
                  className="rounded-xl border border-[#e4e2e2] bg-white p-6 shadow-paper"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e4e2e2]/60 pb-4">
                    <div>
                      <h2 className="font-display text-xl font-[500] text-[#1b1c1c]">
                        {topic.title}
                      </h2>
                      <p className="text-xs text-[#74777d] mt-0.5">
                        {topic.subtitle}
                      </p>
                    </div>
                    {topic.badge && (
                      <span className="rounded-full bg-[#1a2e44]/10 px-2.5 py-1 font-mono text-[11px] font-[500] text-[#1a2e44]">
                        {topic.badge}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-[#43474d]">
                    {topic.content}
                  </p>

                  {topic.bullets && topic.bullets.length > 0 && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {topic.bullets.map((bullet, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-[#e4e2e2]/70 bg-[#fbf9f8] p-3.5 transition-colors"
                        >
                          <div className="text-xs font-[600] text-[#1b1c1c]">
                            {bullet.title}
                          </div>
                          <div className="mt-1 text-xs leading-relaxed text-[#74777d]">
                            {bullet.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {}
            <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-[#f2d492]/60 bg-gradient-to-r from-[#fdfbf7] to-[#f9f5ec] p-5 shadow-paper sm:flex-row">
              <div>
                <h3 className="text-sm font-[600] text-[#1b1c1c]">
                  Deseja sugerir uma melhoria ou relatar um problema?
                </h3>
                <p className="text-xs text-[#74777d] mt-0.5">
                  Fale diretamente com o criador do site pela aba de contato.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("contato")}
                className="shrink-0 rounded-lg bg-[#1a2e44] px-4 py-2 text-xs font-[600] text-white transition-colors hover:bg-[#2d4460]"
              >
                Fale com o Dev
              </button>
            </div>
          </div>
        )}

        {}
        {activeTab === "faq" && (
          <div className="space-y-6">
            {}
            <div className="flex flex-col gap-4 rounded-xl border border-[#e4e2e2] bg-white p-4 shadow-paper sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#74777d]"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar nas perguntas frequentes..."
                  className="w-full rounded-lg border border-[#e4e2e2] bg-[#fbf9f8] py-2 pl-9 pr-8 text-xs text-[#1b1c1c] placeholder-[#74777d] focus:border-[#1a2e44] focus:bg-white focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#74777d] hover:text-[#1b1c1c]"
                    title="Limpar busca"
                  >
                    ×
                  </button>
                )}
              </div>

              {}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "Todas" },
                  { id: "metodologia", label: "Metodologia" },
                  { id: "sessoes", label: "Sessões" },
                  { id: "livros", label: "Livros" },
                  { id: "ia", label: "IA Externa" },
                  { id: "notificacoes", label: "Lembretes" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedFaqCategory(cat.id)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-[500] transition-colors ${
                      selectedFaqCategory === cat.id
                        ? "bg-[#1a2e44] text-white"
                        : "bg-[#f5f3f3] text-[#74777d] hover:bg-[#e4e2e2] hover:text-[#1b1c1c]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {}
            {filteredFaqs.length === 0 ? (
              <div className="rounded-xl border border-[#e4e2e2] bg-white p-8 text-center shadow-paper">
                <p className="text-sm font-[500] text-[#1b1c1c]">
                  Nenhuma pergunta encontrada para sua busca.
                </p>
                <p className="mt-1 text-xs text-[#74777d]">
                  Tente outros termos ou envie sua dúvida diretamente para o
                  desenvolvedor.
                </p>
                <button
                  onClick={() => setActiveTab("contato")}
                  className="mt-4 rounded-lg bg-[#1a2e44] px-4 py-2 text-xs font-[600] text-white transition-colors hover:bg-[#2d4460]"
                >
                  Fale com o Dev
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#e4e2e2] rounded-xl border border-[#e4e2e2] bg-white shadow-paper">
                {filteredFaqs.map((faq) => {
                  const isOpen = expandedFaqId === faq.id
                  return (
                    <div key={faq.id} className="transition-colors">
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-[#fbf9f8]"
                        aria-expanded={isOpen}
                      >
                        <span className="text-sm font-[500] leading-snug text-[#1b1c1c]">
                          {faq.question}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`mt-0.5 shrink-0 text-[#74777d] transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="border-t border-[#e4e2e2]/40 bg-[#fbf9f8]/60 px-5 pb-5 pt-3">
                          <p className="text-xs leading-relaxed text-[#43474d]">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {}
            <div className="flex items-center justify-between rounded-xl border border-[#e4e2e2] bg-white p-5 shadow-paper">
              <div>
                <h3 className="text-sm font-[500] text-[#1b1c1c]">
                  Não encontrou a resposta que precisava?
                </h3>
                <p className="mt-0.5 text-xs text-[#74777d]">
                  Envie sua dúvida pela aba de contato e receba uma resposta por
                  e-mail.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("contato")}
                className="shrink-0 rounded-lg border border-[#1a2e44] px-3.5 py-1.5 text-xs font-[500] text-[#1a2e44] transition-colors hover:bg-[#1a2e44] hover:text-white"
              >
                Fazer uma pergunta
              </button>
            </div>
          </div>
        )}

        {}
        {activeTab === "contato" && (
          <div className="space-y-6">
            {}
            {sentSuccessData ? (
              <div className="rounded-xl border border-[#8ba889]/60 bg-white p-8 text-center shadow-paper">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#8ba889]/20 text-[#2a5628]">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="font-display mt-4 text-2xl font-[500] text-[#1b1c1c]">
                  Mensagem Enviada!
                </h2>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#74777d]">
                  Sua mensagem sobre{" "}
                  <strong className="text-[#1b1c1c]">
                    "{sentSuccessData.subject}"
                  </strong>{" "}
                  foi salva no sistema e encaminhada para o e-mail do
                  desenvolvedor (hc.job.21@gmail.com).
                </p>

                <div className="mx-auto mt-6 max-w-md rounded-lg border border-[#e4e2e2] bg-[#fbf9f8] p-4 text-left text-xs font-mono">
                  <div className="text-[#74777d]">
                    Status:{" "}
                    <span className="text-[#2a5628] font-[600]">
                      {sentSuccessData.emailSent
                        ? "Entregue via e-mail e salvo no banco"
                        : "Salvo no banco de dados"}
                    </span>
                  </div>
                  <div className="text-[#74777d] mt-1">
                    Categoria:{" "}
                    <span className="text-[#1b1c1c]">
                      {FEEDBACK_CATEGORY_LABELS[sentSuccessData.category].label}
                    </span>
                  </div>
                  <div className="text-[#74777d] mt-1">
                    Remetente:{" "}
                    <span className="text-[#1b1c1c]">{user.email}</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={handleResetForm}
                    className="rounded-lg bg-[#1a2e44] px-5 py-2.5 text-xs font-[600] text-white transition-colors hover:bg-[#2d4460]"
                  >
                    Enviar outra mensagem
                  </button>
                  <button
                    onClick={() => setActiveTab("topicos")}
                    className="rounded-lg border border-[#e4e2e2] px-4 py-2.5 text-xs font-[500] text-[#43474d] hover:bg-[#f5f3f3]"
                  >
                    Voltar aos tópicos
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#e4e2e2] bg-white p-6 shadow-paper sm:p-8">
                {}
                <div className="mb-6 flex items-center justify-between rounded-lg border border-[#e4e2e2] bg-[#fbf9f8] p-3.5 text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-[600] text-white"
                      style={{
                        background: "linear-gradient(135deg, #1a2e44, #2d4460)",
                      }}
                    >
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <span className="font-[600] text-[#1b1c1c]">
                        {user.name || "Usuário"}
                      </span>
                      <span className="text-[#74777d] ml-1.5">
                        ({user.email})
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#74777d] font-mono hidden sm:inline">
                    Para: hc.job.21@gmail.com
                  </span>
                </div>

                {errorMessage && (
                  <div className="mb-6 rounded-lg border border-[#ba1a1a]/30 bg-[#ba1a1a]/10 p-3.5 text-xs text-[#ba1a1a]">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmitFeedback} className="space-y-6">
                  {}
                  <div>
                    <label className="block text-xs font-[600] text-[#1b1c1c] mb-2">
                      Categoria da mensagem
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(["question", "suggestion", "bug"] as const).map(
                        (cat) => {
                          const info = FEEDBACK_CATEGORY_LABELS[cat]
                          const isSelected = category === cat
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCategory(cat)}
                              className={`flex flex-col rounded-lg border p-3.5 text-left transition-all ${
                                isSelected
                                  ? "border-[#1a2e44] bg-[#1a2e44]/[0.03] ring-1 ring-[#1a2e44]"
                                  : "border-[#e4e2e2] hover:bg-[#fbf9f8]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-[600] text-[#1b1c1c]">
                                  {info.label}
                                </span>
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    isSelected ? "bg-[#1a2e44]" : "bg-[#e4e2e2]"
                                  }`}
                                />
                              </div>
                              <span className="mt-1 text-[11px] leading-relaxed text-[#74777d]">
                                {info.description}
                              </span>
                            </button>
                          )
                        },
                      )}
                    </div>
                  </div>

                  {}
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-xs font-[600] text-[#1b1c1c] mb-1.5"
                    >
                      Assunto
                    </label>
                    <input
                      id="subject"
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ex: Dúvida sobre a escada de repetição espaçada"
                      maxLength={150}
                      className="w-full rounded-lg border border-[#e4e2e2] bg-[#fbf9f8] px-3.5 py-2.5 text-xs text-[#1b1c1c] placeholder-[#74777d] focus:border-[#1a2e44] focus:bg-white focus:outline-none"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-[#74777d]">
                      <span>Mínimo de 3 caracteres</span>
                      <span className="font-mono">{subject.length}/150</span>
                    </div>
                  </div>

                  {}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-xs font-[600] text-[#1b1c1c] mb-1.5"
                    >
                      Mensagem
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Descreva com detalhes sua dúvida, ideia de melhoria ou o comportamento inesperado que você encontrou..."
                      maxLength={3000}
                      className="w-full rounded-lg border border-[#e4e2e2] bg-[#fbf9f8] p-3.5 text-xs text-[#1b1c1c] placeholder-[#74777d] focus:border-[#1a2e44] focus:bg-white focus:outline-none"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-[#74777d]">
                      <span>Mínimo de 10 caracteres</span>
                      <span className="font-mono">{message.length}/3000</span>
                    </div>
                  </div>

                  {}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={
                        isPending ||
                        subject.trim().length < 3 ||
                        message.trim().length < 10
                      }
                      className="flex items-center gap-2 rounded-lg bg-[#1a2e44] px-6 py-2.5 text-xs font-[600] text-white transition-colors hover:bg-[#2d4460] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? (
                        <>
                          <svg
                            className="h-3.5 w-3.5 animate-spin text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Enviando...
                        </>
                      ) : (
                        <>
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
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                          Enviar Mensagem
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
