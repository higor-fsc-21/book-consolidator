import { describe, expect, it } from "vitest";
import { parseAiEvaluationJson } from "./aiResult";

describe("parseAiEvaluationJson", () => {
  it("parses valid JSON inside a fenced code block", () => {
    const aiText = `
Ótimo trabalho! Aqui está a avaliação final:

RESULTADO DA SESSÃO:
- Questões acertadas: 2
- Questões parcialmente corretas: 1
- Questões erradas: 0
- Score aproximado: 83%

\`\`\`json
{
  "questions": [
    { "index": 1, "performance": "correct" },
    { "index": 2, "performance": "partial" },
    { "index": 3, "performance": "correct" }
  ]
}
\`\`\`
`;
    const res = parseAiEvaluationJson(aiText);
    expect(res.success).toBe(true);
    expect(res.data?.questions).toHaveLength(3);
    expect(res.data?.questions[0]).toEqual({
      index: 1,
      performance: "correct",
    });
    expect(res.data?.questions[1]).toEqual({
      index: 2,
      performance: "partial",
    });
  });

  it("parses raw JSON without code fences", () => {
    const raw = `Avaliação: {"questions": [{"index": 1, "performance": "wrong"}]}`;
    const res = parseAiEvaluationJson(raw);
    expect(res.success).toBe(true);
    expect(res.data?.questions[0].performance).toBe("wrong");
  });

  it("returns error for empty input or no JSON", () => {
    expect(parseAiEvaluationJson("").success).toBe(false);
    expect(parseAiEvaluationJson("Apenas texto sem json").success).toBe(false);
  });

  it("returns error for invalid performance value", () => {
    const invalid = `\`\`\`json\n{"questions": [{"index": 1, "performance": "invalid"}]}\n\`\`\``;
    const res = parseAiEvaluationJson(invalid);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Formato JSON inválido");
  });
});
