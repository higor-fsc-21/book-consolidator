import type { Performance, SessionMode } from "./types";

/** Inputs for a future AI tutor evaluation (D23). No implementation in Phase 5. */
export interface EvaluationInput {
  questionId: string;
  questionText: string;
  expectedAnswer: string;
  userAnswer: string;
  mode: SessionMode;
}

export interface EvaluationResult {
  performance: Performance;
  feedback: string;
}

export interface TutorProvider {
  evaluateAnswer(input: EvaluationInput): Promise<EvaluationResult>;
}
