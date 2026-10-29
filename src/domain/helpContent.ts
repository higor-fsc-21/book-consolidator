import type { FeedbackCategory } from "./types"

export interface HelpTopic {
  id: string
  title: string
  subtitle: string
  badge?: string
  content: string
  bullets?: { title: string; text: string }[]
}

export interface FaqItem {
  id: string
  category: "metodologia" | "sessoes" | "livros" | "ia" | "notificacoes"
  question: string
  answer: string
}

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, {
  label: string
  description: string
  badgeColor: string
}> = {
  question: {
    label: "Dúvida",
    description: "Perguntas sobre o funcionamento do app, método ou recursos.",
    badgeColor: "bg-[#1a2e44]/10 text-[#1a2e44]",
  },
  suggestion: {
    label: "Sugestão",
    description: "Ideias para novas funções, melhorias de fluxo ou design.",
    badgeColor: "bg-[#2e6b35]/10 text-[#2e6b35]",
  },
  bug: {
    label: "Problema / Bug",
    description: "Relatar falhas visuais, erros em ações ou travamentos.",
    badgeColor: "bg-[#ba1a1a]/10 text-[#ba1a1a]",
  },
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "metodo-fast",
    title: "O Método FAST",
    subtitle: "A ciência por trás da retenção duradoura",
    badge: "Metodologia",
    content:
      "O Book Consolidator foi desenvolvido sobre os pilares da ciência da aprendizagem descritos nas obras 'Make It Stick' (Brown, Roediger, McDaniel) e 'Aprendendo a Aprender' (Barbara Oakley). O objetivo não é reler anotações passivamente, mas reconstruir o conhecimento ativamente.",
    bullets: [
      {
        title: "F — Forced Retrieval (Recuperação Ativa)",
        text: "Tente lembrar e formular as respostas antes de consultar o gabarito. O esforço neural de recuperação é o que consolida as sinapses.",
      },
      {
        title: "A — Alternating Approaches (Abordagens Alternadas)",
        text: "Varie entre lembrar conceitos puros, explicar a uma terceira pessoa e reconhecer aplicações práticas no cotidiano.",
      },
      {
        title: "S — Spaced Repetition (Repetição Espaçada)",
        text: "Revisões em intervalos estrategicamente calculados (3, 7, 14, 30, 60, 90 e 365 dias) combatem a curva do esquecimento de Ebbinghaus.",
      },
      {
        title: "T — Tracking (Acompanhamento Contínuo)",
        text: "Monitore pontuações, datas de revisão e a transição gradual dos livros de 'Em consolidação' para 'Consolidado'.",
      },
    ],
  },
  {
    id: "modos-sessao",
    title: "Três Níveis de Consolidação",
    subtitle: "Alternando a forma de desafiar seu cérebro",
    badge: "Sessões",
    content:
      "A cada nova sessão de consolidação, você pode escolher o modo de desafio ideal para o momento do seu aprendizado:",
    bullets: [
      {
        title: "1. Lembrar (Direct)",
        text: "Recuperação ativa direta sem pistas. Responda mentalmente ou por escrito às perguntas criadas para os capítulos e avalie se seu recall foi correto, parcial ou incorreto.",
      },
      {
        title: "2. Explicar (Guided — Técnica de Feynman)",
        text: "O app gera um roteiro pedagógico para você explicar os conceitos como se estivesse ensinando alguém leigo. Excelente para expor pontos cegos da sua compreensão.",
      },
      {
        title: "3. Reconhecer e Aplicar (Recognition)",
        text: "Focado em cenários práticos e estudos de caso. Testa se você consegue identificar os princípios do livro operando em situações reais do dia a dia.",
      },
    ],
  },
  {
    id: "ciclo-vida-agendamento",
    title: "Ciclo de Vida & Escada de Revisões",
    subtitle: "Quando e como as revisões são agendadas",
    badge: "Agendamento",
    content:
      "Quando você marca um livro como 'Concluído' ou realiza sua primeira sessão de consolidação, o sistema programa automaticamente sua próxima data na escada de repetição espaçada.",
    bullets: [
      {
        title: "Escada de Intervalos",
        text: "Os intervalos padrão são de 3, 7, 14, 30, 60, 90 e 365 dias a partir da data de término ou da última revisão concluída.",
      },
      {
        title: "Critério de Consolidação",
        text: "Um livro atinge o estado 'Consolidado' após acumular pelo menos 3 sessões completadas, com média de acertos de pelo menos 80% e revisão recente nos últimos 90 dias.",
      },
      {
        title: "Sessões Pendentes",
        text: "Sessões iniciadas que não foram finalizadas permanecem disponíveis como 'Em andamento' na página do livro para você retomar de onde parou ou cancelar se desejar.",
      },
    ],
  },
  {
    id: "integracao-ia",
    title: "Fluxo de Avaliação com IA Externa",
    subtitle: "Aproveitando ChatGPT, Claude ou Gemini como tutores",
    badge: "IA Externa",
    content:
      "Nas modalidades 'Explicar' e 'Reconhecer e Aplicar', você tem o poder de utilizar qualquer modelo de inteligência artificial de sua escolha como tutor avaliador:",
    bullets: [
      {
        title: "1. Gerar e Copiar o Prompt",
        text: "Ao iniciar a sessão guiada, o sistema monta um prompt completo com as perguntas, instruções de avaliação e formato de resposta esperado.",
      },
      {
        title: "2. Colar no Modelo de sua Escolha",
        text: "Abra seu assistente favorito (ex: Claude, ChatGPT, Gemini), cole o prompt e forneça suas explicações ou resoluções dos cenários.",
      },
      {
        title: "3. Importar a Avaliação",
        text: "Copie o bloco JSON gerado pela IA e cole de volta no Book Consolidator para preencher automaticamente as notas por questão ou ajuste o grid manualmente.",
      },
    ],
  },
]

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-1",
    category: "metodologia",
    question: "Por que não devo simplesmente reler minhas anotações do livro?",
    answer:
      "Pesquisas em neurociência mostram que a releitura passiva cria uma 'ilusão de competência': você reconhece o texto e acredita que o domina, mas não treina o cérebro para recuperar a informação quando precisa. A recuperação forçada (tentar responder sem olhar) constrói caminhos neurais muito mais duradouros.",
  },
  {
    id: "faq-2",
    category: "sessoes",
    question: "O que acontece se eu errar perguntas na sessão de revisão?",
    answer:
      "Errar faz parte crucial do aprendizado! Ao errar, você calibra a autopercepção e reforça o conceito ao consultar a resposta correta em seguida. Sua pontuação refletirá o desempenho e o livro continuará no ciclo de consolidação até atingir consistência.",
  },
  {
    id: "faq-3",
    category: "livros",
    question:
      "Posso criar perguntas por capítulo ou apenas para o livro inteiro?",
    answer:
      "As perguntas no Book Consolidator são organizadas por capítulos. Isso permite que você estude enquanto avança na leitura ou faça sessões direcionadas a partes específicas da obra.",
  },
  {
    id: "faq-4",
    category: "sessoes",
    question:
      "Posso fazer uma sessão de consolidação focada em apenas um capítulo?",
    answer:
      "Sim. Ao iniciar uma sessão a partir da página do capítulo ou selecionar o capítulo específico, o teste reunirá apenas as perguntas daquela seção.",
  },
  {
    id: "faq-5",
    category: "ia",
    question:
      "Preciso pagar por alguma API de IA para usar as sessões guiadas?",
    answer:
      "Não! O aplicativo gera prompts otimizados para que você utilize gratuitamente na versão web de qualquer IA (ChatGPT gratuito, Claude, Gemini, etc.). Não é necessária nenhuma chave de API ou custo extra.",
  },
  {
    id: "faq-6",
    category: "notificacoes",
    question: "Como funcionam os lembretes de revisão?",
    answer:
      "Você pode ativar notificações Web Push em 'Configurações'. O app enviará um lembrete no horário configurado sempre que houver um livro agendado para o dia.",
  },
  {
    id: "faq-7",
    category: "metodologia",
    question: "O que é o estado 'Consolidado'?",
    answer:
      "É a confirmação de que os conceitos fundamentais do livro foram integrados à sua memória de longo prazo. O critério exige pelo menos 3 sessões concluídas, média de pontuação ≥ 80% e atividade recente nos últimos 90 dias.",
  },
]
