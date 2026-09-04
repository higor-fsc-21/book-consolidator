export type ReadingStatus =
  | "want"
  | "reading"
  | "completed"
  | "paused"
  | "archived";
export type ConsolidationState = "consolidating" | "consolidated" | "archived";
export type Importance = 1 | 2 | 3;
export type SessionMode = "direct" | "guided" | "recognition";
export type Performance = "correct" | "partial" | "wrong";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  text: string;
  answer: string;
  lastPerformance?: Performance;
  difficulty: Difficulty;
}

export interface Chapter {
  id: string;
  bookId: string;
  number: number;
  title: string;
  description?: string;
  summary?: string;
  questions: Question[];
  isRead: boolean;
}

export interface RevisionRecord {
  id: string;
  date: string;
  mode: SessionMode;
  score: number;
  questionsCount: number;
  difficultTopics: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverGradient: [string, string];
  status: ReadingStatus;
  importance: Importance;
  startDate?: string;
  endDate?: string;
  currentChapter?: number;
  totalChapters: number;
  consolidationState: ConsolidationState;
  lastRevision?: string;
  nextRevision?: string;
  revisions: RevisionRecord[];
  chapters: Chapter[];
  summary?: string;
  pages?: number;
  year?: number;
}

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
];

let _idCounter = 1000;
export const generateId = () => `gen_${Date.now()}_${++_idCounter}`;

export const avgScore = (book: Book): number | null =>
  book.revisions.length === 0
    ? null
    : Math.round(
        book.revisions.reduce((a, r) => a + r.score, 0) / book.revisions.length,
      );

export const ANNUAL_GOAL = 12;
export const CURRENT_USER = { name: "Rafael", streak: 18 };

export const MOCK_BOOKS: Book[] = [
  {
    id: "b1",
    title: "Comunicação Não-Violenta",
    author: "Marshall B. Rosenberg",
    coverGradient: ["#2D1A4A", "#5A3680"],
    status: "reading",
    importance: 1,
    startDate: "2026-07-15",
    currentChapter: 6,
    totalChapters: 12,
    consolidationState: "consolidating",
    lastRevision: "2026-07-26",
    nextRevision: "2026-09-02",
    pages: 264,
    year: 2003,
    revisions: [
      {
        id: "r1",
        date: "2026-07-26",
        mode: "direct",
        score: 55,
        questionsCount: 11,
        difficultTopics: [
          "Observação vs. Julgamento",
          "Necessidades universais",
        ],
      },
      {
        id: "r2",
        date: "2026-08-02",
        mode: "direct",
        score: 64,
        questionsCount: 11,
        difficultTopics: ["Pedidos concretos"],
      },
    ],
    chapters: [
      {
        id: "c1",
        bookId: "b1",
        number: 1,
        title: "Comunicação que bloqueia a compaixão",
        isRead: true,
        description:
          "Identifica os padrões de linguagem que nos afastam da compaixão.",
        summary:
          "Rosenberg apresenta quatro formas de comunicação que bloqueiam a empatia: julgamentos moralizantes, comparações, negação de responsabilidade e exigências.",
        questions: [
          {
            id: "q1",
            text: 'Por que o autor chama certos padrões de comunicação de "alienantes da vida"?',
            answer:
              "Porque esses padrões desconectam as pessoas de suas necessidades e sentimentos genuínos, criando distância emocional e conflitos.",
            difficulty: "medium",
          },
          {
            id: "q2",
            text: "Quais são as quatro formas de comunicação que bloqueiam a compaixão segundo Rosenberg?",
            answer:
              'Julgamentos moralizantes, comparações, negação de responsabilidade ("tenho que", "me fez") e exigências disfarçadas de pedidos.',
            difficulty: "hard",
          },
          {
            id: "q3",
            text: "Como a negação de responsabilidade aparece na linguagem cotidiana?",
            answer:
              'Através de expressões como "Tenho que...", "Você me faz...", "Não posso...", que removem nossa agência.',
            difficulty: "medium",
            lastPerformance: "partial",
          },
        ],
      },
      {
        id: "c2",
        bookId: "b1",
        number: 2,
        title: "Comunicar com compaixão",
        isRead: true,
        description: "Apresenta os quatro componentes do modelo CNV.",
        summary:
          "O modelo CNV tem quatro componentes: observar, sentir, necessitar e pedir.",
        questions: [
          {
            id: "q4",
            text: "Quais são os quatro componentes do modelo CNV?",
            answer:
              "Observar (sem julgamento), Sentir (estado emocional interno), Necessitar (necessidades por trás dos sentimentos) e Pedir (pedidos claros, não exigências).",
            difficulty: "hard",
            lastPerformance: "correct",
          },
          {
            id: "q5",
            text: "Qual é a diferença entre um pedido e uma exigência na CNV?",
            answer:
              'Um pedido respeita um "não" como resposta válida. Uma exigência vem com ameaça implícita ou explícita de punição.',
            difficulty: "hard",
            lastPerformance: "wrong",
          },
        ],
      },
      {
        id: "c3",
        bookId: "b1",
        number: 3,
        title: "Observar sem avaliar",
        isRead: true,
        description:
          "A distinção fundamental entre descrever comportamentos e emitir julgamentos.",
        questions: [
          {
            id: "q6",
            text: "Por que o autor diferencia observação de julgamento?",
            answer:
              "Observações descrevem fatos; julgamentos adicionam avaliação moral. Julgamentos tornam as pessoas defensivas, observações abrem diálogo genuíno.",
            difficulty: "medium",
            lastPerformance: "partial",
          },
          {
            id: "q7",
            text: "Como transformar um julgamento em uma observação concreta?",
            answer:
              'Substituindo avaliações abstratas por comportamentos específicos e observáveis. Ex.: "você é irresponsável" → "você chegou após o horário combinado em quatro ocasiões este mês."',
            difficulty: "easy",
            lastPerformance: "correct",
          },
        ],
      },
      {
        id: "c4",
        bookId: "b1",
        number: 4,
        title: "Identificar e expressar sentimentos",
        isRead: true,
        description: "Distinguir sentimentos genuínos de pseudossentimentos.",
        questions: [
          {
            id: "q8",
            text: "Qual é a diferença entre um sentimento real e um pseudossentimento?",
            answer:
              'Sentimentos reais descrevem estados internos (triste, satisfeito). Pseudossentimentos contêm avaliações sobre o outro: "sinto que você não me respeita" é um pensamento.',
            difficulty: "medium",
            lastPerformance: "correct",
          },
        ],
      },
      {
        id: "c5",
        bookId: "b1",
        number: 5,
        title: "Assumir responsabilidade pelos nossos sentimentos",
        isRead: true,
        description:
          "Conectar sentimentos às nossas necessidades ao invés de culpar o outro.",
        questions: [
          {
            id: "q9",
            text: "Como a CNV propõe que nos relacionemos com os comportamentos dos outros e nossos sentimentos?",
            answer:
              'Nossos sentimentos surgem de nossas necessidades, não do comportamento alheio. Fórmula: "Quando X acontece, sinto Y porque preciso de Z" — em vez de "você me fez sentir".',
            difficulty: "hard",
          },
        ],
      },
      {
        id: "c6",
        bookId: "b1",
        number: 6,
        title: "Pedir o que enriquece a vida",
        isRead: false,
        questions: [],
      },
      {
        id: "c7",
        bookId: "b1",
        number: 7,
        title: "Recebendo com empatia",
        isRead: false,
        questions: [],
      },
      {
        id: "c8",
        bookId: "b1",
        number: 8,
        title: "O poder da empatia",
        isRead: false,
        questions: [],
      },
      {
        id: "c9",
        bookId: "b1",
        number: 9,
        title: "Conectar-se consigo mesmo com compaixão",
        isRead: false,
        questions: [],
      },
      {
        id: "c10",
        bookId: "b1",
        number: 10,
        title: "Expressar raiva plenamente",
        isRead: false,
        questions: [],
      },
      {
        id: "c11",
        bookId: "b1",
        number: 11,
        title: "Resolver conflitos e mediar disputas",
        isRead: false,
        questions: [],
      },
      {
        id: "c12",
        bookId: "b1",
        number: 12,
        title: "Usando a CNV na sua vida",
        isRead: false,
        questions: [],
      },
    ],
    summary: "",
  },
  {
    id: "b2",
    title: "Rápido e Devagar: Duas Formas de Pensar",
    author: "Daniel Kahneman",
    coverGradient: ["#0E2A3A", "#1A5278"],
    status: "completed",
    importance: 1,
    startDate: "2026-04-02",
    endDate: "2026-05-18",
    currentChapter: 38,
    totalChapters: 38,
    consolidationState: "consolidating",
    lastRevision: "2026-08-05",
    nextRevision: "2026-09-09",
    pages: 512,
    year: 2011,
    revisions: [
      {
        id: "r3",
        date: "2026-05-20",
        mode: "direct",
        score: 48,
        questionsCount: 20,
        difficultTopics: ["Vieses cognitivos", "Heurística da disponibilidade"],
      },
      {
        id: "r4",
        date: "2026-05-27",
        mode: "guided",
        score: 61,
        questionsCount: 20,
        difficultTopics: ["Efeito ancoragem"],
      },
      {
        id: "r5",
        date: "2026-06-25",
        mode: "direct",
        score: 73,
        questionsCount: 18,
        difficultTopics: ["Pensamento estatístico"],
      },
      {
        id: "r6",
        date: "2026-08-05",
        mode: "recognition",
        score: 82,
        questionsCount: 16,
        difficultTopics: [],
      },
    ],
    chapters: [
      {
        id: "c20",
        bookId: "b2",
        number: 1,
        title: "Os personagens da história",
        isRead: true,
        description: "Introdução ao Sistema 1 e Sistema 2 de pensamento.",
        questions: [
          {
            id: "q20",
            text: "Qual é a diferença fundamental entre o Sistema 1 e o Sistema 2?",
            answer:
              "Sistema 1: rápido, intuitivo, automático, emocional. Sistema 2: lento, deliberado, analítico. A maioria das decisões vem do Sistema 1, que comete erros sistemáticos.",
            difficulty: "medium",
            lastPerformance: "correct",
          },
          {
            id: "q21",
            text: "Por que somos frequentemente enganados pela nossa própria mente?",
            answer:
              "O Sistema 1 cria histórias coerentes a partir de informações incompletas e as apresenta ao Sistema 2 como verdades. Temos confiança excessiva em intuições sem perceber os erros sistemáticos.",
            difficulty: "hard",
            lastPerformance: "partial",
          },
        ],
      },
    ],
    summary:
      "Kahneman demonstra que temos dois sistemas de pensamento. O Sistema 1 (rápido, intuitivo) comete erros sistemáticos previsíveis chamados vieses cognitivos. O Sistema 2 (lento, deliberado) pode corrigi-los, mas é preguiçoso. Compreender isso nos ajuda a criar melhores sistemas de decisão.",
  },
  {
    id: "b3",
    title: "Hábitos Atômicos",
    author: "James Clear",
    coverGradient: ["#0D2A1A", "#1A5235"],
    status: "completed",
    importance: 2,
    startDate: "2026-01-10",
    endDate: "2026-02-14",
    currentChapter: 20,
    totalChapters: 20,
    consolidationState: "consolidated",
    lastRevision: "2026-06-15",
    nextRevision: "2026-12-15",
    pages: 320,
    year: 2018,
    revisions: [
      {
        id: "r7",
        date: "2026-02-16",
        mode: "direct",
        score: 62,
        questionsCount: 16,
        difficultTopics: ["Quatro leis"],
      },
      {
        id: "r8",
        date: "2026-02-23",
        mode: "guided",
        score: 74,
        questionsCount: 14,
        difficultTopics: [],
      },
      {
        id: "r9",
        date: "2026-03-25",
        mode: "direct",
        score: 83,
        questionsCount: 14,
        difficultTopics: [],
      },
      {
        id: "r10",
        date: "2026-06-15",
        mode: "recognition",
        score: 91,
        questionsCount: 12,
        difficultTopics: [],
      },
    ],
    chapters: [
      {
        id: "c30",
        bookId: "b3",
        number: 1,
        title: "O poder surpreendente dos hábitos atômicos",
        isRead: true,
        description:
          "Como melhorias de 1% ao dia compõem resultados extraordinários.",
        questions: [
          {
            id: "q30",
            text: "Por que pequenas melhorias constantes importam tanto?",
            answer:
              'Uma melhoria de 1% ao dia resulta em 37x de melhoria em um ano. Hábitos são "atômicos" — pequenos e fundamentais. Resultados aparecem após uma curva de acumulação invisível (Platô do Potencial Latente).',
            difficulty: "medium",
            lastPerformance: "correct",
          },
        ],
      },
    ],
    summary:
      "Clear apresenta quatro leis para criar bons hábitos: torná-los óbvios, atraentes, fáceis e satisfatórios (e suas inversas para maus hábitos). O argumento central: identidade precede comportamento. Cada hábito é um voto para o tipo de pessoa que queremos ser.",
  },
  {
    id: "b4",
    title: "Trabalho Profundo",
    author: "Cal Newport",
    coverGradient: ["#2A1208", "#6B3015"],
    status: "completed",
    importance: 1,
    startDate: "2026-03-01",
    endDate: "2026-03-28",
    currentChapter: 7,
    totalChapters: 7,
    consolidationState: "consolidating",
    lastRevision: "2026-07-10",
    nextRevision: "2026-10-10",
    pages: 296,
    year: 2016,
    revisions: [
      {
        id: "r11",
        date: "2026-03-30",
        mode: "direct",
        score: 70,
        questionsCount: 10,
        difficultTopics: ["Filosofias de agendamento"],
      },
      {
        id: "r12",
        date: "2026-04-06",
        mode: "guided",
        score: 80,
        questionsCount: 10,
        difficultTopics: [],
      },
      {
        id: "r13",
        date: "2026-07-10",
        mode: "direct",
        score: 75,
        questionsCount: 9,
        difficultTopics: ["Ritual de encerramento"],
      },
    ],
    chapters: [
      {
        id: "c40",
        bookId: "b4",
        number: 1,
        title: "Trabalho Profundo é Valioso",
        isRead: true,
        description: "Por que o foco profundo é cada vez mais raro e valioso.",
        questions: [
          {
            id: "q40",
            text: "Por que o trabalho profundo é simultaneamente mais valioso e mais raro?",
            answer:
              "Mais valioso: a economia do conhecimento recompensa quem domina habilidades difíceis e produz em alto nível. Mais raro: redes sociais e conectividade constante destroem a capacidade de concentração profunda.",
            difficulty: "hard",
            lastPerformance: "partial",
          },
        ],
      },
    ],
    summary:
      "Newport defende que trabalho profundo — foco sem distrações em tarefas cognitivamente exigentes — é a habilidade mais importante da economia do conhecimento. Apresenta quatro filosofias de implementação e regras práticas para cultivar essa capacidade.",
  },
  {
    id: "b5",
    title: "O Poder do Hábito",
    author: "Charles Duhigg",
    coverGradient: ["#1E1040", "#402070"],
    status: "paused",
    importance: 2,
    startDate: "2026-06-01",
    currentChapter: 4,
    totalChapters: 12,
    consolidationState: "consolidating",
    pages: 375,
    year: 2012,
    revisions: [],
    chapters: [
      {
        id: "c50",
        bookId: "b5",
        number: 1,
        title: "O Loop do Hábito",
        isRead: true,
        description: "A estrutura neurológica fundamental de todo hábito.",
        questions: [
          {
            id: "q50",
            text: "Quais são os três elementos do loop do hábito?",
            answer:
              'Gatilho (sinal), Rotina (comportamento) e Recompensa (o que o cérebro aprende a desejar). Com repetição, o cérebro cria "chunks" automáticos.',
            difficulty: "medium",
          },
        ],
      },
    ],
    summary: "",
  },
  {
    id: "b6",
    title: "Mindset: A Nova Psicologia do Sucesso",
    author: "Carol S. Dweck",
    coverGradient: ["#0A1A2A", "#1A3A5A"],
    status: "want",
    importance: 2,
    totalChapters: 8,
    consolidationState: "consolidating",
    revisions: [],
    chapters: [],
    pages: 288,
    year: 2006,
  },
  {
    id: "b7",
    title: "O Homem em Busca de Sentido",
    author: "Viktor E. Frankl",
    coverGradient: ["#2A1A0E", "#5A3820"],
    status: "want",
    importance: 1,
    totalChapters: 4,
    consolidationState: "consolidating",
    revisions: [],
    chapters: [],
    pages: 192,
    year: 1946,
  },
  {
    id: "b8",
    title: "Essencialismo",
    author: "Greg McKeown",
    coverGradient: ["#2A2010", "#5A4A20"],
    status: "completed",
    importance: 2,
    startDate: "2025-10-05",
    endDate: "2025-10-28",
    currentChapter: 16,
    totalChapters: 16,
    consolidationState: "consolidated",
    lastRevision: "2026-04-10",
    nextRevision: "2026-10-10",
    pages: 260,
    year: 2014,
    revisions: [
      {
        id: "r20",
        date: "2025-10-30",
        mode: "direct",
        score: 68,
        questionsCount: 12,
        difficultTopics: ["Critério de 90%"],
      },
      {
        id: "r21",
        date: "2025-11-15",
        mode: "guided",
        score: 79,
        questionsCount: 10,
        difficultTopics: [],
      },
      {
        id: "r22",
        date: "2026-01-10",
        mode: "direct",
        score: 88,
        questionsCount: 10,
        difficultTopics: [],
      },
      {
        id: "r23",
        date: "2026-04-10",
        mode: "recognition",
        score: 93,
        questionsCount: 8,
        difficultTopics: [],
      },
    ],
    chapters: [
      {
        id: "c60",
        bookId: "b8",
        number: 1,
        title: "O caminho do essencialista",
        isRead: true,
        description: "A filosofia de fazer menos, mas melhor.",
        questions: [
          {
            id: "q60",
            text: "Qual é a diferença entre a mentalidade não-essencialista e a essencialista?",
            answer:
              "O não-essencialista acredita que pode fazer tudo, reage ao urgente e perde o importante. O essencialista reconhece que quase tudo não tem valor e escolhe deliberadamente onde investir energia.",
            difficulty: "medium",
            lastPerformance: "correct",
          },
        ],
      },
    ],
    summary:
      "McKeown defende a disciplina sistemática de buscar somente o essencial: fazer menos, mas melhor. O critério de 90% é central: se não for um sim claro, é um não.",
  },
  {
    id: "b9",
    title: "Os Sete Hábitos das Pessoas Altamente Eficazes",
    author: "Stephen R. Covey",
    coverGradient: ["#181830", "#303060"],
    status: "completed",
    importance: 2,
    startDate: "2025-07-10",
    endDate: "2025-08-20",
    currentChapter: 7,
    totalChapters: 7,
    consolidationState: "consolidated",
    lastRevision: "2026-02-20",
    nextRevision: "2026-08-20",
    pages: 432,
    year: 1989,
    revisions: [
      {
        id: "r30",
        date: "2025-08-22",
        mode: "direct",
        score: 55,
        questionsCount: 14,
        difficultTopics: ["Mentalidade de abundância"],
      },
      {
        id: "r31",
        date: "2025-09-05",
        mode: "guided",
        score: 68,
        questionsCount: 12,
        difficultTopics: [],
      },
      {
        id: "r32",
        date: "2025-11-10",
        mode: "direct",
        score: 80,
        questionsCount: 10,
        difficultTopics: [],
      },
      {
        id: "r33",
        date: "2026-02-20",
        mode: "recognition",
        score: 88,
        questionsCount: 8,
        difficultTopics: [],
      },
    ],
    chapters: [],
    summary:
      "Covey organiza a eficácia em sete hábitos: ser proativo, começar com o fim em mente, primeiro o mais importante, pensar ganha-ganha, primeiro compreender, criar sinergia e afiar a serra.",
  },
];

export const getReadingBook = (books: Book[]) =>
  books.find((b) => b.status === "reading");
export const getCompletedBooks = (books: Book[]) =>
  books.filter((b) => b.status === "completed");

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

export const statusLabels: Record<ReadingStatus, string> = {
  want: "Quero ler",
  reading: "Lendo",
  completed: "Concluído",
  paused: "Pausado",
  archived: "Arquivado",
};

export const consolidationLabels: Record<ConsolidationState, string> = {
  consolidating: "Em consolidação",
  consolidated: "Consolidado",
  archived: "Arquivado",
};

export const modeLabels: Record<SessionMode, string> = {
  direct: "Recuperação Direta",
  guided: "Explicação Guiada",
  recognition: "Reconhecimento e Aplicação",
};
