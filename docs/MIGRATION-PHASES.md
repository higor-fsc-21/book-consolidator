# Plano de Transição Faseado — Memora

Plano de migração do protótipo React/Vite para uma aplicação Next.js com PostgreSQL no Supabase.

As decisões referenciadas (`D01`…`D40`) estão detalhadas em [DECISIONS.md](./DECISIONS.md).

Conforme [D01](./DECISIONS.md#d01--estratégia-de-migração), a migração é **gradual**: ao final
de cada fase a aplicação deve estar funcional e utilizável.

---

## Visão geral

| Fase                                                        | Título                                          | Decisões principais                         |
| ----------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------- |
| [1](#fase-1--fundação-next-js-app-router--domínio-separado) | Fundação: Next.js App Router + domínio separado | D02, D03, D04, D18, D33                     |
| [2](#fase-2--modelagem-postgresql-prisma-e-seed)            | Modelagem PostgreSQL, Prisma e seed             | D05, D06, D07, D08, D10–D15, D27, D28       |
| [3](#fase-3--conectar-leituras-ao-banco)                    | Conectar leituras ao banco                      | D21, D24, D25, D29, D33                     |
| [4](#fase-4--autenticação-mutações-e-google-books)          | Autenticação, mutações e Google Books           | D09, D19, D20, D26, D27, D30, D31, D32, D34 |
| [5](#fase-5--sessões-tentativas-e-score)                    | Sessões, tentativas e score                     | D14, D15, D16, D17, D22, D23, D39           |
| [6](#fase-6--testes-observabilidade-e-deploy)               | Testes, observabilidade e deploy                | D35, D36, D37, D38, D40                     |

**Regra de progressão:** só avançar para a próxima fase quando todos os critérios de conclusão
da fase atual estiverem atendidos.

---

## Fase 1 — Fundação: Next.js App Router + domínio separado

**Objetivo:** aplicação rodando em Next.js, navegável por URLs reais, com o domínio de
`src/data.ts` reorganizado — ainda sem banco de dados.

**Decisões aplicadas:**
[D02](./DECISIONS.md#d02--roteador-do-nextjs) ·
[D03](./DECISIONS.md#d03--modelo-de-navegação) ·
[D04](./DECISIONS.md#d04--organização-do-domínio) ·
[D18](./DECISIONS.md#d18--localização-da-lógica-de-negócio) ·
[D33](./DECISIONS.md#d33--estado-no-frontend) (preparação) ·
[D22](./DECISIONS.md#d22--geração-de-prompts) (extração)

### Escopo

**1.1 — Projeto Next.js**

- Inicializar o projeto com App Router, TypeScript e Tailwind CSS v4.
- Portar `src/index.css` (tokens `@theme`, tipografia editorial, `shadow-paper`) para o layout raiz.
- Migrar o `Sidebar` de `App.tsx` para um layout compartilhado do grupo de rotas autenticadas.

**1.2 — Estrutura de rotas ([D03](./DECISIONS.md#d03--modelo-de-navegação))**

```text
app/
├── (auth)/login/page.tsx
└── (app)/
    ├── layout.tsx                                   Sidebar + shell
    ├── page.tsx                                     Dashboard
    ├── biblioteca/page.tsx                          Library
    ├── livros/[bookId]/page.tsx                     BookDetail
    ├── livros/[bookId]/capitulos/[chapterId]/page.tsx  ChapterDetail
    └── sessoes/[sessionId]/page.tsx                  MemorizationSession
```

- Remover `View`, `NavState` e `NavigateFn`.
- Substituir `onNavigate({ view, bookId })` por `<Link>` e `useRouter`.

**1.3 — Separação do domínio ([D04](./DECISIONS.md#d04--organização-do-domínio))**

```text
src/domain/types.ts       Book, Chapter, Question, RevisionRecord + enums
src/domain/constants.ts   statusLabels, consolidationLabels, modeLabels,
                          COVER_GRADIENTS, ANNUAL_GOAL
src/domain/prompts.ts     generateDirectPrompt, generateRecognitionPrompt
src/domain/derived.ts     avgScore, progresso, contagens
src/domain/mock.ts        MOCK_BOOKS (temporário, removido na Fase 3)
```

**1.4 — Extração da lógica de negócio ([D18](./DECISIONS.md#d18--localização-da-lógica-de-negócio))**

Mover de `App.tsx` para `src/domain/services/` como funções puras sobre arrays:
`addBook`, `updateBook`, `addChapter`, `addQuestion`, `addRevision`, `toggleChapterRead`,
`startReading`.

**1.5 — Login placeholder**

Tela dedicada em `/login`, ainda sem autenticação real (substituída na Fase 4).

### Entregáveis

- Projeto Next.js funcional com todas as telas atuais.
- `src/domain/` criado; `src/data.ts` removido.
- Zero lógica de negócio dentro de componentes.

### Critérios de conclusão

- [ ] Todas as telas acessíveis por URL direta.
- [ ] Refresh do navegador preserva a tela atual.
- [ ] Botão voltar do navegador funciona.
- [ ] Nenhum componente contém regra de negócio.
- [ ] `pnpm build` e `tsc --noEmit` passam sem erros.

### Riscos

- Componentes que usam `useState` precisam da diretiva `"use client"`.
- A UI é em português ([AGENTS.md](../AGENTS.md)); manter todas as strings existentes.

---

## Fase 2 — Modelagem PostgreSQL, Prisma e seed

**Objetivo:** schema relacional criado no Supabase e populado via seed, **sem** conectar a
aplicação ainda.

**Decisões aplicadas:**
[D05](./DECISIONS.md#d05--modelagem-das-entidades) ·
[D06](./DECISIONS.md#d06--orm) ·
[D07](./DECISIONS.md#d07--provedor-do-postgresql) ·
[D08](./DECISIONS.md#d08--isolamento-de-dados-por-usuário) ·
[D10](./DECISIONS.md#d10--identidade-do-usuário) ·
[D11](./DECISIONS.md#d11--geração-de-ids) ·
[D12](./DECISIONS.md#d12--representação-de-estados) ·
[D13](./DECISIONS.md#d13--datas-e-timezone) ·
[D14](./DECISIONS.md#d14--histórico-de-desempenho) ·
[D15](./DECISIONS.md#d15--modelo-de-sessão-de-revisão) ·
[D27](./DECISIONS.md#d27--exclusão-de-dados) ·
[D28](./DECISIONS.md#d28--dados-iniciais) ·
[D30](./DECISIONS.md#d30--capas-e-metadados-de-livros) (colunas)

### Escopo

**2.1 — Supabase e ambiente**

- Criar o projeto no Supabase.
- Configurar `DATABASE_URL` (com pooler) e demais variáveis, todas server-side
  ([D37](./DECISIONS.md#d37--variáveis-de-ambiente)).

**2.2 — Schema Prisma ([D05](./DECISIONS.md#d05--modelagem-das-entidades))**

```text
User             id, authUserId, name, email, createdAt, updatedAt, deletedAt
Book             id, userId, title, author, status, importance, startDate, endDate,
                 currentChapter, totalChapters, consolidationState, nextRevision,
                 summary, pages, year, coverUrl, googleBooksId,
                 createdAt, updatedAt, deletedAt
Chapter          id, bookId, number, title, description, summary, isRead,
                 createdAt, updatedAt
Question         id, chapterId, text, answer, difficulty, createdAt, updatedAt
RevisionSession  id, userId, bookId, mode, score, startedAt, completedAt, createdAt
SessionAttempt   id, sessionId, questionId, performance, userAnswer, attemptedAt
```

**Convenções obrigatórias:**

- IDs `uuid` com default no banco ([D11](./DECISIONS.md#d11--geração-de-ids)).
- Enums nativos do PostgreSQL para `ReadingStatus`, `ConsolidationState`, `SessionMode`,
  `Performance`, `Difficulty` ([D12](./DECISIONS.md#d12--representação-de-estados)).
- `date` para datas de calendário e `timestamptz` para eventos
  ([D13](./DECISIONS.md#d13--datas-e-timezone)).
- `userId` em `Book`, `RevisionSession` e demais entidades do usuário
  ([D08](./DECISIONS.md#d08--isolamento-de-dados-por-usuário)).
- `deletedAt` em `User` e `Book` ([D27](./DECISIONS.md#d27--exclusão-de-dados)).
- Restrição única `(bookId, number)` em `Chapter`.

**2.3 — Migrations**

- Executar a primeira `prisma migrate dev` e versionar o resultado.

**2.4 — Seed ([D28](./DECISIONS.md#d28--dados-iniciais))**

- Converter `src/domain/mock.ts` em `prisma/seed.ts`.
- Criar um `User` de desenvolvimento a partir de `CURRENT_USER`
  ([D10](./DECISIONS.md#d10--identidade-do-usuário)).
- Mapear IDs fixos (`b1`, `c1`, `q1`) para UUIDs gerados, resolvendo relações no insert.
- Converter cada `RevisionRecord` em `RevisionSession`; `difficultTopics` pode ser preservado
  como coluna auxiliar ou descartado, já que as tentativas passam a ser a fonte real.

### Entregáveis

- `prisma/schema.prisma` completo e migrado.
- `prisma/seed.ts` funcional.
- Banco no Supabase populado com os dados equivalentes ao mock.

### Critérios de conclusão

- [ ] `prisma migrate` aplicado sem erros no Supabase.
- [ ] `prisma db seed` popula 9 livros com capítulos, perguntas e sessões.
- [ ] Dados inspecionáveis via `prisma studio`.
- [ ] A aplicação continua funcionando com o mock (nada quebrado).

### Riscos

- Ordem de inserção do seed precisa respeitar as foreign keys.
- Definir desde já como `User.authUserId` se conecta ao Supabase Auth (usado na Fase 4).

---

## Fase 3 — Conectar leituras ao banco

**Objetivo:** todas as telas de leitura passam a consultar o PostgreSQL; o mock é eliminado.

**Decisões aplicadas:**
[D21](./DECISIONS.md#d21--exposição-de-respostas) ·
[D24](./DECISIONS.md#d24--granularidade-das-queries) ·
[D25](./DECISIONS.md#d25--cache-e-revalidação) ·
[D29](./DECISIONS.md#d29--dados-derivados) ·
[D33](./DECISIONS.md#d33--estado-no-frontend)

### Escopo

**3.1 — Cliente Prisma**

- Criar `src/lib/db.ts` com singleton do Prisma Client (evitando múltiplas instâncias em dev).

**3.2 — Camada de queries ([D24](./DECISIONS.md#d24--granularidade-das-queries))**

```text
src/domain/queries/books.ts
  getBooksForUser(userId)          lista + relações necessárias
  getBookWithEverything(bookId)    capítulos + perguntas + sessões
  getChapterWithQuestions(chapterId)
```

- Cada query carrega o **livro completo** com capítulos, perguntas e sessões
  ([D24](./DECISIONS.md#d24--granularidade-das-queries)).
- Perguntas trazem `text` e `answer` juntos
  ([D21](./DECISIONS.md#d21--exposição-de-respostas)) — não existe endpoint de "revelar".
- Todas filtram `deletedAt: null` ([D27](./DECISIONS.md#d27--exclusão-de-dados)).
- Todas filtram por `userId` ([D08](./DECISIONS.md#d08--isolamento-de-dados-por-usuário)).

**3.3 — Server Components**

- Dashboard, Biblioteca, BookDetail e ChapterDetail passam a chamar as queries diretamente,
  sem API HTTP intermediária ([D19](./DECISIONS.md#d19--server-components-server-actions-e-route-handlers)).
- Componentes interativos são isolados como Client Components recebendo dados por props.

**3.4 — Cache ([D25](./DECISIONS.md#d25--cache-e-revalidação))**

- Definir a estratégia de cache por rota e as tags de revalidação que serão usadas na Fase 4.
- Garantir que nenhum dado pessoal seja cacheado de forma compartilhada.

**3.5 — Derivados e limpeza**

- `avgScore`, progresso e contagens permanecem em `src/domain/derived.ts`
  ([D29](./DECISIONS.md#d29--dados-derivados)).
- Remover `src/domain/mock.ts` e qualquer resquício de estado global de livros
  ([D33](./DECISIONS.md#d33--estado-no-frontend)).

### Entregáveis

- `src/lib/db.ts` e `src/domain/queries/`.
- Todas as telas de leitura exibindo dados reais do Supabase.

### Critérios de conclusão

- [ ] Nenhuma tela importa dados de mock.
- [ ] Dashboard, Biblioteca, BookDetail e ChapterDetail carregam do banco.
- [ ] Métricas derivadas continuam corretas (comparar com o comportamento anterior).
- [ ] Cache configurado e verificado.

### Riscos

- O formato retornado pelo Prisma difere do tipo `Book` original (ex.: `Decimal`, `Date`);
  criar mapeadores em `src/domain/mappers.ts` se necessário.
- Fase ainda usa um `userId` fixo de desenvolvimento — a autenticação real chega na Fase 4.

---

## Fase 4 — Autenticação, mutações e Google Books

**Objetivo:** login real e CRUD persistido de livros, capítulos e perguntas, com cadastro
alimentado pela Google Books API.

**Decisões aplicadas:**
[D09](./DECISIONS.md#d09--autenticação) ·
[D19](./DECISIONS.md#d19--server-components-server-actions-e-route-handlers) ·
[D20](./DECISIONS.md#d20--validação-de-dados) ·
[D26](./DECISIONS.md#d26--operações-compostas) ·
[D27](./DECISIONS.md#d27--exclusão-de-dados) ·
[D30](./DECISIONS.md#d30--capas-e-metadados-de-livros) ·
[D31](./DECISIONS.md#d31--estratégia-de-busca) ·
[D32](./DECISIONS.md#d32--paginação) ·
[D34](./DECISIONS.md#d34--feedback-de-mutações)

### Escopo

**4.1 — Supabase Auth ([D09](./DECISIONS.md#d09--autenticação))**

- Substituir o login placeholder por autenticação real.
- Middleware protegendo o grupo de rotas `(app)`.
- Helper `getCurrentUser()` resolvendo o `User` local a partir de `authUserId`.
- Todas as queries da Fase 3 passam a receber o `userId` da sessão.

**4.2 — Validação ([D20](./DECISIONS.md#d20--validação-de-dados))**

- Criar `src/lib/validators.ts` com schemas Zod: `CreateBookInput`, `UpdateBookInput`,
  `CreateChapterInput`, `CreateQuestionInput`.
- Inputs nunca aceitam `id`, `userId`, `score` ou `consolidationState` vindos do cliente.

**4.3 — Server Actions ([D19](./DECISIONS.md#d19--server-components-server-actions-e-route-handlers))**

```text
createBook / updateBook / softDeleteBook
createChapter / updateChapter / toggleChapterRead
createQuestion / updateQuestion / deleteQuestion
```

Cada action: valida sessão → valida input com Zod → executa serviço de domínio →
`revalidatePath`.

**4.4 — Transações ([D26](./DECISIONS.md#d26--operações-compostas))**

- `createBook` gera o livro e seus capítulos iniciais em uma única transação.
- `softDeleteBook` marca o livro e trata os dados associados de forma consistente.

**4.5 — Google Books ([D30](./DECISIONS.md#d30--capas-e-metadados-de-livros), [D31](./DECISIONS.md#d31--estratégia-de-busca), [D32](./DECISIONS.md#d32--paginação))**

- Route Handler `app/api/books/search/route.ts` como proxy da Google Books API, mantendo a
  chave no servidor ([D37](./DECISIONS.md#d37--variáveis-de-ambiente)).
- Busca híbrida no fluxo de adicionar livro:
  - acervo já cadastrado → PostgreSQL;
  - título novo → Google Books API.
- Preencher `title`, `author`, `year`, `pages`, `coverUrl` e `googleBooksId` a partir do
  resultado escolhido, permitindo edição manual antes de salvar.
- Paginação implementada **apenas** nos resultados da Google Books
  ([D32](./DECISIONS.md#d32--paginação)).
- `COVER_GRADIENTS` passa a ser fallback quando não houver `coverUrl`.

**4.6 — Feedback pessimista ([D34](./DECISIONS.md#d34--feedback-de-mutações))**

- Ações como marcar capítulo como lido aguardam a confirmação do servidor, com estado de
  carregamento explícito.

### Entregáveis

- Autenticação real ponta a ponta.
- CRUD completo persistido.
- `BookModal` integrado à busca da Google Books API.

### Critérios de conclusão

- [ ] Login e logout funcionais; dados isolados por usuário.
- [ ] Criar, editar e excluir livro/capítulo/pergunta persistem corretamente.
- [ ] Operações compostas executam em transação.
- [ ] Adicionar livro busca corretamente na Google Books API, com paginação.
- [ ] Cache revalidado após cada mutação.

### Riscos

- Sincronizar o usuário do Supabase Auth com a tabela `users` no primeiro login.
- Capas externas exigem configurar `images.remotePatterns` no Next.js.
- Tratar ausência de resultados e falhas da Google Books API sem bloquear o cadastro manual.

---

## Fase 5 — Sessões, tentativas e score

**Objetivo:** o fluxo de consolidação passa a gerar sessões persistidas, com score e estado de
consolidação calculados no backend.

**Decisões aplicadas:**
[D14](./DECISIONS.md#d14--histórico-de-desempenho) ·
[D15](./DECISIONS.md#d15--modelo-de-sessão-de-revisão) ·
[D16](./DECISIONS.md#d16--cálculo-de-score) ·
[D17](./DECISIONS.md#d17--estado-de-consolidação) ·
[D22](./DECISIONS.md#d22--geração-de-prompts) ·
[D23](./DECISIONS.md#d23--integração-com-ia) ·
[D26](./DECISIONS.md#d26--operações-compostas) ·
[D39](./DECISIONS.md#d39--rate-limiting)

### Escopo

**5.1 — Ciclo de vida da sessão ([D15](./DECISIONS.md#d15--modelo-de-sessão-de-revisão))**

```text
startSession(bookId, mode, chapterIds?)   → cria RevisionSession, retorna sessionId
recordAttempt(sessionId, questionId, performance, userAnswer?)
completeSession(sessionId)                → calcula score e atualiza o livro
```

- A rota `/sessoes/[sessionId]` da Fase 1 passa a operar sobre a sessão real.

**5.2 — Modalidade Recuperação Direta (`direct`)**

- A UI registra cada avaliação (acertei / parcialmente / errei) via `recordAttempt`
  ([D14](./DECISIONS.md#d14--histórico-de-desempenho)).
- Segue feedback pessimista ([D34](./DECISIONS.md#d34--feedback-de-mutações)).

**5.3 — Modalidades externas (`guided` e `recognition`)**

- Prompts continuam gerados **no cliente** a partir de `src/domain/prompts.ts`
  ([D22](./DECISIONS.md#d22--geração-de-prompts)), reutilizando os dados já carregados
  ([D21](./DECISIONS.md#d21--exposição-de-respostas)).
- Criar a tela/ação de **entrada do resultado externo**
  ([D16](./DECISIONS.md#d16--cálculo-de-score)): o usuário informa o desempenho por
  pergunta/conceito a partir da análise final da IA.
- Esse input é convertido em `SessionAttempt`s e o score é calculado pelo backend — o score
  nunca é digitado diretamente.

```ts
interface ExternalSessionResult {
  performances: { questionId: string; performance: Performance }[];
}
```

- Manter a interface `TutorProvider` de [D23](./DECISIONS.md#d23--integração-com-ia) como
  ponto de extensão futuro, sem implementação real.

**5.4 — Score e consolidação ([D16](./DECISIONS.md#d16--cálculo-de-score), [D17](./DECISIONS.md#d17--estado-de-consolidação))**

- `completeSession` roda em transação ([D26](./DECISIONS.md#d26--operações-compostas)):
  1. agrega as tentativas da sessão;
  2. calcula o score (`correct = 1`, `partial = 0.5`, `wrong = 0`);
  3. grava `score` e `completedAt` na sessão;
  4. recalcula `consolidationState` e `nextRevision` do livro.
- `archived` permanece um estado administrativo definido explicitamente pelo usuário.

**5.5 — Histórico**

- BookDetail passa a exibir o histórico real de sessões e tentativas, substituindo o resumo
  herdado de `RevisionRecord`.

**5.6 — Sem rate limiting**

- Nenhum limite é aplicado às actions de sessão ([D39](./DECISIONS.md#d39--rate-limiting)).

### Entregáveis

- Ciclo completo de sessão persistido para as três modalidades.
- Entrada de resultado de ferramentas externas.
- Score e estado de consolidação derivados no servidor.

### Critérios de conclusão

- [ ] As três modalidades produzem `RevisionSession` com tentativas associadas.
- [ ] Score nunca é enviado pelo cliente.
- [ ] `consolidationState` é recalculado ao concluir sessão.
- [ ] Histórico do livro reflete tentativas reais.
- [ ] Sessão incompleta pode ser retomada.

### Riscos

- Definir claramente o critério de `consolidated` ([D17](./DECISIONS.md#d17--estado-de-consolidação))
  antes de implementar; documentar como nova decisão se mudar.
- A entrada do resultado externo precisa ser simples o bastante para não desestimular o uso.

---

## Fase 6 — Testes, observabilidade e deploy

**Objetivo:** endurecer o que foi construído e publicar em produção.

**Decisões aplicadas:**
[D35](./DECISIONS.md#d35--estratégia-de-testes) ·
[D36](./DECISIONS.md#d36--deploy) ·
[D37](./DECISIONS.md#d37--variáveis-de-ambiente) ·
[D38](./DECISIONS.md#d38--observabilidade) ·
[D40](./DECISIONS.md#d40--documentação-de-api)

### Escopo

**6.1 — Testes unitários ([D35](./DECISIONS.md#d35--estratégia-de-testes))**

- Cálculo de score ([D16](./DECISIONS.md#d16--cálculo-de-score)).
- Cálculo de `consolidationState` ([D17](./DECISIONS.md#d17--estado-de-consolidação)).
- Geração de prompts ([D22](./DECISIONS.md#d22--geração-de-prompts)).
- Schemas Zod ([D20](./DECISIONS.md#d20--validação-de-dados)).
- Derivados ([D29](./DECISIONS.md#d29--dados-derivados)).

**6.2 — Testes de integração**

- Criar livro com capítulos (transação).
- Criar sessão, registrar tentativas, concluir sessão.
- Autorização: usuário não acessa dados de outro `userId`
  ([D08](./DECISIONS.md#d08--isolamento-de-dados-por-usuário)).
- Soft delete some das listagens ([D27](./DECISIONS.md#d27--exclusão-de-dados)).
- Executar contra schema/banco de teste isolado.

**6.3 — Sem testes E2E**

- Decisão explícita ([D35](./DECISIONS.md#d35--estratégia-de-testes)); não criar suíte E2E.

**6.4 — Logger ([D38](./DECISIONS.md#d38--observabilidade))**

```ts
// src/lib/logger.ts
interface Logger {
  info(event: string, meta?: Record<string, unknown>): void;
  error(event: string, error: unknown, meta?: Record<string, unknown>): void;
}
```

- Implementação atual apenas com `console`; assinatura pronta para Sentry.
- Aplicar em todas as Server Actions e Route Handlers.
- Nunca registrar respostas completas ou dados pessoais desnecessários.

**6.5 — Deploy ([D36](./DECISIONS.md#d36--deploy))**

- Publicar o Next.js na Vercel, com Supabase em produção.
- Configurar connection pooling do Prisma para ambiente serverless.
- Revisar variáveis de ambiente ([D37](./DECISIONS.md#d37--variáveis-de-ambiente)): apenas
  `NEXT_PUBLIC_*` expostas.
- Rodar migrations e seed inicial no ambiente de produção.

**6.6 — Sem documentação formal de API**

- Decisão explícita ([D40](./DECISIONS.md#d40--documentação-de-api)); não gerar OpenAPI.

### Entregáveis

- Suíte de testes unitários e de integração.
- `src/lib/logger.ts` em uso.
- Aplicação publicada e conectada ao Supabase de produção.

### Critérios de conclusão

- [ ] Testes unitários e de integração passando.
- [ ] Nenhum teste E2E criado.
- [ ] Logger aplicado em todas as Server Actions e Route Handlers.
- [ ] Deploy funcional na Vercel com banco de produção.
- [ ] Nenhum segredo exposto no bundle do cliente.

### Riscos

- Prisma em serverless exige atenção a conexões; usar o pooler do Supabase.
- Testes de integração precisam de estratégia de limpeza entre execuções.

---

## Rastreabilidade decisão → fase

| Decisão | Fase                  | Decisão | Fase                       |
| ------- | --------------------- | ------- | -------------------------- |
| D01     | Transversal           | D21     | 3                          |
| D02     | 1                     | D22     | 1 (extração), 5 (uso)      |
| D03     | 1                     | D23     | 5                          |
| D04     | 1                     | D24     | 3                          |
| D05     | 2                     | D25     | 3, 4                       |
| D06     | 2                     | D26     | 4, 5                       |
| D07     | 2                     | D27     | 2 (schema), 3–4 (uso)      |
| D08     | 2 (schema), 3–4 (uso) | D28     | 2                          |
| D09     | 4                     | D29     | 3                          |
| D10     | 2                     | D30     | 2 (colunas), 4 (uso)       |
| D11     | 2                     | D31     | 4                          |
| D12     | 2                     | D32     | 4                          |
| D13     | 2                     | D33     | 1 (preparo), 3 (conclusão) |
| D14     | 2 (schema), 5 (uso)   | D34     | 4, 5                       |
| D15     | 2 (schema), 5 (uso)   | D35     | 6                          |
| D16     | 5                     | D36     | 6                          |
| D17     | 5                     | D37     | 2 (setup), 6 (produção)    |
| D18     | 1                     | D38     | 6                          |
| D19     | 3, 4                  | D39     | 5                          |
| D20     | 4                     | D40     | 6                          |
