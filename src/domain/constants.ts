import type {
  ReadingStatus,
  ConsolidationState,
  SessionMode,
  Importance,
} from "./types"

export const COVER_GRADIENTS: [string, string][] = [
  ["#2D1A4A", "#5A3680"],
  ["#0E2A3A", "#1A5278"],
  ["#0D2A1A", "#1A5235"],
  ["#2A1208", "#6B3015"],
  ["#1A0A0A", "#4A1515"],
  ["#1E1040", "#402070"],
  ["#2A2010", "#5A4A20"],
  ["#0A1A2A", "#1A3A5A"],
  ["#3A1A1A", "#7A3535"],
  ["#181830", "#303060"],
]

export const ANNUAL_GOAL = 12

/** Offsets in days from the revision anchor (D50), not gaps between sessions. */
export const REVISION_INTERVALS_DAYS = [3, 7, 14, 30, 60, 90, 365] as const

export const CONSOLIDATION_MIN_SESSIONS = 3
export const CONSOLIDATION_MIN_AVG_SCORE = 80
export const CONSOLIDATION_RECENCY_DAYS = 90

export const PLACEHOLDER_USER = { name: "Rafael", streak: 18 }

export const statusLabels: Record<ReadingStatus, string> = {
  want: "Quero ler",
  reading: "Lendo",
  completed: "Concluído",
  paused: "Pausado",
  archived: "Arquivado",
}

export const consolidationLabels: Record<ConsolidationState, string> = {
  consolidating: "Em consolidação",
  consolidated: "Consolidado",
  archived: "Arquivado",
}

export const modeLabels: Record<SessionMode, string> = {
  direct: "Recuperação Direta",
  guided: "Explicação Guiada",
  recognition: "Reconhecimento e Aplicação",
}

export const importanceLabels: Record<Importance, string> = {
  1: "Muito importante",
  2: "Importante",
  3: "Interessante",
}
