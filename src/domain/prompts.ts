import type { Book, Chapter, Question } from "./types";

const chaptersWithQuestions = (book: Book, chapterIds?: string[]) =>
  chapterIds
    ? book.chapters.filter(
        (c) => chapterIds.includes(c.id) && c.questions.length > 0,
      )
    : book.chapters.filter((c) => c.questions.length > 0);

/**
 * Global, 1-based ordering of the user's questions — the same order the session
 * view uses when mapping the AI's JSON block back onto each question.
 */
const orderedQuestions = (
  book: Book,
  chapterIds?: string[],
): Array<{ chapter: Chapter; question: Question }> =>
  chaptersWithQuestions(book, chapterIds).flatMap((chapter) =>
    chapter.questions.map((question) => ({ chapter, question })),
  );

const chapterSections = (book: Book, chapterIds?: string[]) => {
  let index = 0;
  return chaptersWithQuestions(book, chapterIds)
    .map((c) => {
      const qs = c.questions
        .map((q) => {
          index += 1;
          return `Q${index}: ${q.text}\nR: ${q.answer}`;
        })
        .join("\n\n");
      return `--- CAPÍTULO ${c.number}: ${c.title} ---\n${
        c.description ? `Contexto: ${c.description}\n\n` : ""
      }${qs}`;
    })
    .join("\n\n");
};

const conceptSections = (book: Book, chapterIds?: string[]) =>
  orderedQuestions(book, chapterIds)
    .map(
      ({ chapter, question }, i) =>
        `CONCEITO ${i + 1} — Cap. ${chapter.number}: ${chapter.title}${
          chapter.description
            ? `\nContexto do capítulo: ${chapter.description}`
            : ""
        }\nPergunta anotada: ${question.text}\nAnotação completa: ${question.answer}`,
    )
    .join("\n\n");

const bookHeader = (book: Book) => `LIVRO: ${book.title}
AUTOR: ${book.author}${book.year ? `\nANO: ${book.year}` : ""}`;

const fidelityRules = (unit: "pergunta" | "conceito") =>
  `FIDELIDADE ÀS ANOTAÇÕES (OBRIGATÓRIO):
- Baseie-se exclusivamente nos capítulos, perguntas e respostas anotados abaixo — eles são o registro exato do que eu estudei
- Não introduza conceitos, exemplos ou trechos do livro que não estejam nessas anotações
- Trate o texto anotado como resposta de referência completa: avalie a minha resposta contra ela na íntegra, sem resumir nem descartar detalhes
- Mantenha a ordem e a numeração de cada ${unit} exatamente como aparecem abaixo`;

const evaluationBlock = (unit: "questão" | "conceito") =>
  `Além disso, logo após o resumo escrito, exporte obrigatoriamente um bloco JSON com a avaliação de cada ${unit} (em ordem sequencial 1, 2, etc., seguindo a numeração das anotações), usando exatamente este formato:
\`\`\`json
{
  "questions": [
    { "index": 1, "performance": "correct" },
    { "index": 2, "performance": "partial" }
  ]
}
\`\`\`
(Use apenas: "correct", "partial", "wrong")`;

export const generateDirectPrompt = (
  book: Book,
  chapterIds?: string[],
): string => {
  const sections = chapterSections(book, chapterIds);

  return `Você é um tutor especializado em aprendizagem por recuperação ativa.

${bookHeader(book)}

INSTRUÇÕES:
- Apresente o contexto do capítulo antes de cada pergunta
- Reformule as perguntas com suas próprias palavras (nunca repita literalmente)
- Espere minha resposta antes de continuar
- Avalie minha resposta identificando acertos e lacunas
- Use exemplos práticos para explicar o que faltou
- Se eu não compreender, reformule a pergunta de outra maneira
- Continue até cobrir todos os conceitos listados abaixo

${fidelityRules("pergunta")}

RESULTADO FINAL OBRIGATÓRIO:
Ao final de todas as questões, apresente um resumo estruturado assim:
"RESULTADO DA SESSÃO:
- Questões acertadas: [número]
- Questões parcialmente corretas: [número]
- Questões erradas: [número]
- Score aproximado: [porcentagem]%
- Principais lacunas identificadas: [lista]"

${evaluationBlock("questão")}

ANOTAÇÕES:

${sections}

Quando estiver pronto, diga "Vamos começar a revisão!" e inicie com o primeiro capítulo.`;
};

export const generateGuidedPrompt = (
  book: Book,
  chapterIds?: string[],
): string => {
  const sections = chapterSections(book, chapterIds);

  return `Você é um tutor que aplica a técnica de Feynman: o aluno deve explicar cada ideia com as próprias palavras, como se ensinasse a alguém que nunca leu o livro.

${bookHeader(book)}

INSTRUÇÕES:
- Apresente o contexto do capítulo, depois peça que eu explique o conceito em voz alta (por escrito)
- NÃO formule perguntas de memorização literal — peça explicações
- Espere minha explicação antes de continuar
- Avalie clareza, precisão e lacunas; peça analogias quando a explicação for vaga
- Se eu usar jargão sem explicar, peça que eu simplifique
- Continue até cobrir todos os conceitos listados abaixo

${fidelityRules("pergunta")}

RESULTADO FINAL OBRIGATÓRIO:
Ao final de todas as questões, apresente um resumo estruturado assim:
"RESULTADO DA SESSÃO:
- Questões acertadas: [número]
- Questões parcialmente corretas: [número]
- Questões erradas: [número]
- Score aproximado: [porcentagem]%
- Principais lacunas identificadas: [lista]"

${evaluationBlock("questão")}

ANOTAÇÕES:

${sections}

Quando estiver pronto, diga "Vamos começar a revisão!" e peça a primeira explicação.`;
};

export const generateRecognitionPrompt = (
  book: Book,
  chapterIds?: string[],
): string => {
  const concepts = conceptSections(book, chapterIds);

  return `Você é um tutor que testa reconhecimento e aplicação de conhecimento por meio de situações práticas.

${bookHeader(book)}

MISSÃO: Apresente situações do mundo real baseadas nas anotações abaixo. NÃO revele qual conceito está sendo testado, qual capítulo ou qual pergunta original — deixe eu identificar sozinho.

INSTRUÇÕES:
- Descreva uma situação prática, profissional ou cotidiana
- Pergunte: "Qual conceito que você aprendeu se relaciona com essa situação?"
- Espere minha resposta
- Avalie se identifiquei corretamente e explique a relação usando a anotação completa como referência
- Apresente novas situações progressivamente
- Aborde os conceitos anotados um a um, na ordem em que aparecem

${fidelityRules("conceito")}
- Nunca cite literalmente a pergunta anotada nem o texto da anotação ao apresentar a situação: use-os apenas para construir o cenário e para avaliar minha resposta

RESULTADO FINAL OBRIGATÓRIO:
Ao final, apresente um resumo estruturado assim:
"RESULTADO DA SESSÃO:
- Conceitos reconhecidos corretamente: [número]
- Conceitos identificados parcialmente: [número]
- Conceitos não reconhecidos: [número]
- Score aproximado: [porcentagem]%
- Conceitos com maior dificuldade: [lista]"

${evaluationBlock("conceito")}

ANOTAÇÕES (CONCEITOS A TESTAR):

${concepts}

Quando estiver pronto, apresente a primeira situação sem revelar qual conceito está sendo testado.`;
};
