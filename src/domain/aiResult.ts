import {
  AiEvaluationResultSchema,
  type AiEvaluationResult,
} from "@/lib/validators";

/**
 * Extracts a JSON evaluation block from the AI's response text.
 * Searches for ```json ... ``` code blocks, or raw JSON containing "questions".
 */
export function parseAiEvaluationJson(text: string): {
  success: boolean;
  data?: AiEvaluationResult;
  error?: string;
} {
  if (!text || !text.trim()) {
    return { success: false, error: "Texto de resposta da IA vazio" };
  }

  // 1. Try to find a fenced ```json code block
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(jsonBlockRegex);
  let rawJson = match ? match[1] : null;

  // 2. If no fence found, attempt to locate the first '{' and last '}'
  if (!rawJson) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      rawJson = text.slice(firstBrace, lastBrace + 1);
    }
  }

  if (!rawJson) {
    return {
      success: false,
      error: "Nenhum bloco JSON encontrado na resposta da IA",
    };
  }

  try {
    const parsed = JSON.parse(rawJson);
    const validated = AiEvaluationResultSchema.safeParse(parsed);
    if (!validated.success) {
      return {
        success: false,
        error:
          "Formato JSON inválido: certifique-se de que contém a lista 'questions' com 'index' e 'performance'.",
      };
    }
    return { success: true, data: validated.data };
  } catch {
    return {
      success: false,
      error:
        "Não foi possível interpretar o JSON. Verifique se o conteúdo está íntegro.",
    };
  }
}
