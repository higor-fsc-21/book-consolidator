import type { Book } from "./types";

export const generateDirectPrompt = (
  book: Book,
  chapterIds?: string[],
): string => {
  const chapters = chapterIds
    ? book.chapters.filter(
        (c) => chapterIds.includes(c.id) && c.questions.length > 0,
      )
    : book.chapters.filter((c) => c.questions.length > 0);

  const sections = chapters
    .map((c) => {
      const qs = c.questions
        .map((q, i) => `Q${i + 1}: ${q.text}\nR: ${q.answer}`)
        .join("\n\n");
      return `--- CAPÍTULO ${c.number}: ${c.title} ---\n${
        c.description ? `Contexto: ${c.description}\n\n` : ""
      }${qs}`;
    })
    .join("\n\n");

  return `Você é um tutor especializado em aprendizagem por recuperação ativa.

LIVRO: ${book.title}
AUTOR: ${book.author}

INSTRUÇÕES:
- Apresente o contexto do capítulo antes de cada pergunta
- Reformule as perguntas com suas próprias palavras (nunca repita literalmente)
- Espere minha resposta antes de continuar
- Avalie minha resposta identificando acertos e lacunas
- Use exemplos práticos para explicar o que faltou
- Se eu não compreender, reformule a pergunta de outra maneira
- Continue até cobrir todos os conceitos listados abaixo

RESULTADO FINAL OBRIGATÓRIO:
Ao final de todas as questões, apresente um resumo estruturado assim:
"RESULTADO DA SESSÃO:
- Questões acertadas: [número]
- Questões parcialmente corretas: [número]
- Questões erradas: [número]
- Score aproximado: [porcentagem]%
- Principais lacunas identificadas: [lista]"

ANOTAÇÕES:

${sections}

Quando estiver pronto, diga "Vamos começar a revisão!" e inicie com o primeiro capítulo.`;
};

export const generateRecognitionPrompt = (
  book: Book,
  chapterIds?: string[],
): string => {
  const chapters = chapterIds
    ? book.chapters.filter(
        (c) => chapterIds.includes(c.id) && c.questions.length > 0,
      )
    : book.chapters.filter((c) => c.questions.length > 0);

  const concepts = chapters
    .flatMap((c) => c.questions.map((q) => `- ${q.answer.split(".")[0]}.`))
    .join("\n");

  return `Você é um tutor que testa reconhecimento e aplicação de conhecimento por meio de situações práticas.

LIVRO: ${book.title}
AUTOR: ${book.author}

MISSÃO: Apresente situações do mundo real baseadas nos conceitos abaixo. NÃO revele qual conceito está sendo testado, qual capítulo ou qual pergunta original — deixe eu identificar sozinho.

INSTRUÇÕES:
- Descreva uma situação prática, profissional ou cotidiana
- Pergunte: "Qual conceito que você aprendeu se relaciona com essa situação?"
- Espere minha resposta
- Avalie se identifiquei corretamente e explique a relação
- Apresente novas situações progressivamente
- Aborde os conceitos principais um a um

RESULTADO FINAL OBRIGATÓRIO:
Ao final, apresente um resumo estruturado assim:
"RESULTADO DA SESSÃO:
- Conceitos reconhecidos corretamente: [número]
- Conceitos identificados parcialmente: [número]
- Conceitos não reconhecidos: [número]
- Score aproximado: [porcentagem]%
- Conceitos com maior dificuldade: [lista]"

CONCEITOS A TESTAR:
${concepts}

Quando estiver pronto, apresente a primeira situação sem revelar qual conceito está sendo testado.`;
};
