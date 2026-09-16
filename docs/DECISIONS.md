# Decisões de Arquitetura — Migração para Next.js + PostgreSQL

Registro das decisões tomadas para converter o Book Consolidator de um protótipo React/Vite com estado
em memória para uma aplicação full-stack Next.js com PostgreSQL gerenciado.

Cada decisão possui um identificador estável (`D01`…`D51`) referenciado por
[MIGRATION-PHASES.md](./MIGRATION-PHASES.md).

**Status:** todas as decisões abaixo estão **aceitas**. Alterações devem ser feitas por adição
de uma nova decisão (`D41`…), preservando o histórico.

---

## Índice

| ID                                                                  | Tema                        | Decisão                                            |
| ------------------------------------------------------------------- | --------------------------- | -------------------------------------------------- |
| [D01](#d01--estratégia-de-migração)                                 | Estratégia de migração      | Migração gradual                                   |
| [D02](#d02--roteador-do-nextjs)                                     | Roteador do Next.js         | App Router                                         |
| [D03](#d03--modelo-de-navegação)                                    | Modelo de navegação         | Rotas reais (URL)                                  |
| [D04](#d04--organização-do-domínio)                                 | Organização do domínio      | Separar por responsabilidade                       |
| [D05](#d05--modelagem-das-entidades)                                | Modelagem das entidades     | Entidades independentes                            |
| [D06](#d06--orm)                                                    | ORM                         | Prisma                                             |
| [D07](#d07--provedor-do-postgresql)                                 | Provedor do PostgreSQL      | Supabase                                           |
| [D08](#d08--isolamento-de-dados-por-usuário)                        | Isolamento de dados         | Banco compartilhado com `user_id`                  |
| [D09](#d09--autenticação)                                           | Autenticação                | Supabase Auth                                      |
| [D10](#d10--identidade-do-usuário)                                  | Identidade do usuário       | Tabela `users`                                     |
| [D11](#d11--geração-de-ids)                                         | Geração de IDs              | UUID gerado pelo banco                             |
| [D12](#d12--representação-de-estados)                               | Representação de estados    | Enums nativos do PostgreSQL                        |
| [D13](#d13--datas-e-timezone)                                       | Datas e timezone            | `timestamptz` para eventos, `date` para calendário |
| [D14](#d14--histórico-de-desempenho)                                | Histórico de desempenho     | Tabela de tentativas                               |
| [D15](#d15--modelo-de-sessão-de-revisão)                            | Modelo de sessão            | Sessão com perguntas e tentativas                  |
| [D16](#d16--cálculo-de-score)                                       | Cálculo de score            | Calculado no backend                               |
| [D17](#d17--estado-de-consolidação)                                 | Estado de consolidação      | Calculado                                          |
| [D18](#d18--localização-da-lógica-de-negócio)                       | Lógica de negócio           | Serviços de domínio                                |
| [D19](#d19--server-components-server-actions-e-route-handlers)      | Camada de acesso            | SC + Server Actions + Route Handlers               |
| [D20](#d20--validação-de-dados)                                     | Validação                   | Zod no backend                                     |
| [D21](#d21--exposição-de-respostas)                                 | Exposição de respostas      | Perguntas e respostas juntas                       |
| [D22](#d22--geração-de-prompts)                                     | Geração de prompts          | No cliente                                         |
| [D23](#d23--integração-com-ia)                                      | Integração com IA           | Prompts externos + interface de domínio            |
| [D24](#d24--granularidade-das-queries)                              | Granularidade das queries   | Buscar tudo por livro                              |
| [D25](#d25--cache-e-revalidação)                                    | Cache                       | Cache do Next.js                                   |
| [D26](#d26--operações-compostas)                                    | Operações compostas         | Transação PostgreSQL                               |
| [D27](#d27--exclusão-de-dados)                                      | Exclusão de dados           | Soft delete                                        |
| [D28](#d28--dados-iniciais)                                         | Dados iniciais              | `prisma/seed.ts` a partir de `MOCK_BOOKS`          |
| [D29](#d29--dados-derivados)                                        | Dados derivados             | Calcular sob demanda                               |
| [D30](#d30--capas-e-metadados-de-livros)                            | Capas e metadados           | Google Books API                                   |
| [D31](#d31--estratégia-de-busca)                                    | Estratégia de busca         | Híbrida (PostgreSQL + Google Books)                |
| [D32](#d32--paginação)                                              | Paginação                   | Apenas na Google Books API                         |
| [D33](#d33--estado-no-frontend)                                     | Estado no frontend          | Baseado no servidor                                |
| [D34](#d34--feedback-de-mutações)                                   | Feedback de mutações        | Atualização pessimista                             |
| [D35](#d35--estratégia-de-testes)                                   | Testes                      | Unitário + integração, sem E2E                     |
| [D36](#d36--deploy)                                                 | Deploy                      | Vercel + Supabase                                  |
| [D37](#d37--variáveis-de-ambiente)                                  | Variáveis de ambiente       | Segredos apenas no servidor                        |
| [D38](#d38--observabilidade)                                        | Observabilidade             | `console.log` com interface abstraída              |
| [D39](#d39--rate-limiting)                                          | Rate limiting               | Não implementar                                    |
| [D40](#d40--documentação-de-api)                                    | Documentação de API         | Não formalizar                                     |
| [D41](#d41--persistência-do-gradiente-de-capa)                      | Gradiente de capa           | Derivar em tempo de renderização                   |
| [D42](#d42--exclusão-física-de-perguntas-e-histórico-de-tentativas) | Exclusão de perguntas       | `questionId` opcional + `SetNull`                  |
| [D43](#d43--postgres-local-em-docker--supabase)                     | Postgres local              | Docker local + Supabase                            |
| [D44](#d44--escopo-de-escrita-da-fase-3)                            | Escopo de escrita da Fase 3 | Mutações via Prisma já na Fase 3                   |
| [D45](#d45--forma-dos-tipos-de-domínio)                             | Tipos de domínio            | Espelham o schema do Prisma                        |
| [D46](#d46--provisionamento-jit-por-authuserid)                     | Autenticação e Usuário      | Provisionamento JIT por `authUserId` apenas        |
| [D47](#d47--reconciliação-do-seed-com-supabase-auth)                | Seed e Usuário de Teste     | `SEED_USER_AUTH_ID` obrigatório no seed            |
| [D48](#d48--padronização-de-retorno-de-server-actions)              | Server Actions              | Formato tipado `ActionResult` com fieldErrors      |
| [D49](#d49--limiar-de-consolidação)                                 | Estado de consolidação      | ≥3 sessões, média ≥80, recência 90 dias            |
| [D50](#d50--escada-de-intervalos-de-revisão)                        | Próxima revisão             | Escada fixa ancorada na leitura                    |
| [D51](#d51--adiamento-de-recordattempt)                             | Ciclo de vida da sessão     | Buffer no cliente; retomar do início               |

---

## D01 — Estratégia de migração

**Contexto:** o app hoje é um protótipo Vite com estado em memória em `src/App.tsx`.

**Alternativas:** migração gradual · reescrita completa.

**Decisão:** **migração gradual**.

**Motivo:** menor risco, permite validar cada etapa e mantém o produto utilizável durante
toda a transição.

**Implicações:**

- Ao final de cada fase a aplicação deve estar funcional.
- Durante um período curto coexistirão mock e banco; o mock deve ser eliminado assim que as
  leituras forem migradas.

---

## D02 — Roteador do Next.js

**Alternativas:** App Router · Pages Router.

**Decisão:** **App Router**.

**Motivo:** é o padrão atual do Next.js, oferece Server Components, layouts aninhados e
Server Actions — todos usados por outras decisões deste documento.

**Implicações:**

- Necessário distinguir explicitamente Server Components de Client Components.
- Habilita [D19](#d19--server-components-server-actions-e-route-handlers) e
  [D25](#d25--cache-e-revalidação).

---

## D03 — Modelo de navegação

**Contexto:** hoje a navegação usa `NavState` e o tipo
`View = "dashboard" | "library" | "book" | "chapter" | "session"`.

**Alternativas:** manter navegação por estado · migrar para rotas.

**Decisão:** **migrar para rotas reais**.

**Mapeamento acordado:**

```text
dashboard  →  /
library    →  /biblioteca
book       →  /livros/[bookId]
chapter    →  /livros/[bookId]/capitulos/[chapterId]
session    →  /sessoes/[sessionId]
```

**Motivo:** deep linking, refresh preservando a tela, botão voltar funcional e alinhamento
com o App Router.

**Implicações:**

- `NavigateFn` e `NavState` são removidos.
- Estados temporários (passo do modal, revelação de resposta) permanecem locais no cliente.

---

## D04 — Organização do domínio

**Contexto:** `src/data.ts` concentra tipos, mock, labels, geração de IDs e prompts.

**Alternativas:** manter tudo em `data.ts` · separar por responsabilidade.

**Decisão:** **separar por responsabilidade**.

**Estrutura acordada:**

```text
src/domain/types.ts        Tipos e enums do domínio
src/domain/constants.ts    Labels, gradientes, metas
src/domain/prompts.ts      generateDirectPrompt / generateRecognitionPrompt
src/domain/derived.ts      Métricas calculadas (ver D29)
src/domain/services/       Regras de negócio (ver D18)
prisma/seed.ts             Dados iniciais (ver D28)
```

**Motivo:** o domínio passa a ser reutilizável por frontend, backend e seed sem acoplamento
a dados de desenvolvimento.

**Implicações:** `src/data.ts` deixa de existir como arquivo único.

---

## D05 — Modelagem das entidades

**Contexto:** o tipo `Book` atual aninha `chapters: Chapter[]` e `revisions: RevisionRecord[]`.

**Alternativas:** persistir o agregado completo · entidades independentes.

**Decisão:** **entidades independentes no banco**.

**Entidades:** `User`, `Book`, `Chapter`, `Question`, `RevisionSession`, `SessionAttempt`.

**Motivo:** aproveita corretamente o modelo relacional, permite atualizações precisas e
histórico independente.

**Implicações:**

- O objeto agregado é montado apenas na camada de query, conforme
  [D24](#d24--granularidade-das-queries).
- `Chapter.bookId` deixa de ser mantido manualmente e passa a ser uma foreign key.

---

## D06 — ORM

**Alternativas:** Prisma · Drizzle · SQL direto.

**Decisão:** **Prisma**.

**Motivo:** schema declarativo, migrations claras, seed simples e boa expressividade para as
relações entre livro, capítulo, pergunta e sessão — adequado a um modelo ainda em evolução.

**Implicações:**

- Migrations versionadas via `prisma migrate`.
- Atenção a connection pooling em ambiente serverless (ver [D36](#d36--deploy)).

---

## D07 — Provedor do PostgreSQL

**Alternativas:** PostgreSQL local · Supabase · Neon · Railway/Render.

**Decisão:** **Supabase**.

**Motivo:** PostgreSQL gerenciado com autenticação integrada, o que sustenta diretamente
[D09](#d09--autenticação).

**Implicações:**

- `DATABASE_URL` apontando para o Supabase, com pooler para produção.
- Dashboard do Supabase disponível para inspeção, sem substituir as migrations do Prisma.

---

## D08 — Isolamento de dados por usuário

**Alternativas:** banco compartilhado com `user_id` · banco por usuário.

**Decisão:** **banco compartilhado com `user_id`**.

**Motivo:** mais simples, mais barato e suficiente para uma aplicação pessoal que pode
evoluir para multiusuário.

**Implicações:**

- **Toda** query de entidade pertencente ao usuário deve filtrar por `userId`.
- Autorização é responsabilidade da camada de serviço, não do componente.

---

## D09 — Autenticação

**Contexto:** hoje `Login` apenas alterna um booleano `isAuthenticated`.

**Alternativas:** login falso · Auth.js · Supabase Auth · Clerk.

**Decisão:** **Supabase Auth**.

**Motivo:** o PostgreSQL já está no Supabase ([D07](#d07--provedor-do-postgresql)); usar o
mesmo ecossistema evita infraestrutura duplicada.

**Implicações:**

- A sessão determina o `userId` usado por [D08](#d08--isolamento-de-dados-por-usuário).
- O `Login` atual é substituído por um fluxo real.

---

## D10 — Identidade do usuário

**Contexto:** existe `CURRENT_USER = { name: "Rafael", streak: 18 }` fixo no código.

**Alternativas:** dados hardcoded · tabela `users`.

**Decisão:** **tabela `users`**.

**Motivo:** permite autenticação real, preferências e estatísticas persistidas.

**Implicações:**

- `streak` deixa de ser constante e passa a ser derivado das sessões concluídas
  (ver [D29](#d29--dados-derivados)).
- A tabela `users` deve se relacionar com o usuário do Supabase Auth.

---

## D11 — Geração de IDs

**Contexto:** o código usa `generateId()` no cliente.

**Alternativas:** ID no frontend · UUID no banco · incremental.

**Decisão:** **UUID gerado pelo banco**.

**Motivo:** identidade de entidades persistidas não deve ser controlada pelo cliente; UUID
evita expor volume de dados e facilita sincronização futura.

**Implicações:**

- `generateId()` é removido para entidades persistidas.
- IDs fixos do mock (`b1`, `c1`, `q1`) sobrevivem apenas dentro do seed.

---

## D12 — Representação de estados

**Alternativas:** enums nativos do PostgreSQL · texto validado na aplicação.

**Decisão:** **enums nativos do PostgreSQL**.

**Aplicado a:** `ReadingStatus`, `ConsolidationState`, `SessionMode`, `Performance`,
`Difficulty`.

**Motivo:** garante integridade no próprio banco, impedindo valores inválidos.

**Implicações:** adicionar um novo valor exige migration — aceitável, pois são estados
fechados e estáveis.

---

## D13 — Datas e timezone

**Decisão:**

```text
date         →  datas de calendário (startDate, endDate, nextRevision)
timestamptz  →  eventos (createdAt, updatedAt, startedAt, completedAt, attemptedAt)
```

**Motivo:** datas de calendário não devem sofrer deslocamento por timezone; eventos precisam
registrar o momento real.

**Implicações:** a interface converte `timestamptz` para o timezone do usuário na exibição.

---

## D14 — Histórico de desempenho

**Contexto:** `Question.lastPerformance` guarda apenas o último resultado e descarta o histórico.

**Alternativas:** manter só o último desempenho · criar tabela de tentativas.

**Decisão:** **criar tabela de tentativas (`SessionAttempt`)**.

**Campos mínimos:** `sessionId`, `questionId`, `performance`, `userAnswer?`, `attemptedAt`.

**Motivo:** habilita evolução por pergunta, identificação de tópicos difíceis e cálculo
confiável de score.

**Implicações:** `lastPerformance` deixa de ser fonte de verdade; se permanecer na UI, é
derivado.

---

## D15 — Modelo de sessão de revisão

**Contexto:** `RevisionRecord` é apenas um resumo (data, modo, score, contagem).

**Alternativas:** registro resumido · sessão com perguntas e tentativas.

**Decisão:** **sessão com perguntas e tentativas**.

**Estrutura:**

```text
RevisionSession
 ├── mode, startedAt, completedAt, score
 └── attempts[] → SessionAttempt (D14)
```

**Motivo:** permite salvar progresso, retomar sessões e produzir estatísticas reais.

**Implicações:** é necessário definir o ciclo de vida explícito: iniciar → registrar
tentativas → concluir.

---

## D16 — Cálculo de score

**Alternativas:** calcular no frontend · calcular no backend.

**Decisão:** **calcular no backend**.

**Fórmula inicial:**

```text
correct = 1 · partial = 0.5 · wrong = 0
score = (pontos obtidos / pontos possíveis) × 100
```

**Regra específica para sessões em ferramentas externas (GPT/Gemini):** a análise final
produzida pela IA é **inputada pelo usuário no sistema**, convertida em `SessionAttempt`s
([D14](#d14--histórico-de-desempenho)) e só então o score é calculado pelo backend — o score
nunca é digitado diretamente.

**Motivo:** regra centralizada, histórico confiável e fórmula alterável sem depender do cliente.

---

## D17 — Estado de consolidação

**Alternativas:** editável manualmente · calculado.

**Decisão:** **calculado**.

**Critérios de referência:**

```text
consolidating  →  poucas sessões ou desempenho baixo
consolidated   →  desempenho consistente e sessões recentes
archived       →  estado administrativo, definido explicitamente pelo usuário
```

**Motivo:** o estado passa a refletir o desempenho real registrado.

**Implicações:** recalculado ao concluir uma sessão, dentro da transação de
[D26](#d26--operações-compostas).

---

## D18 — Localização da lógica de negócio

**Contexto:** hoje as mutações vivem dentro de `App.tsx`.

**Alternativas:** dentro dos componentes · em serviços de domínio.

**Decisão:** **serviços de domínio**.

**Motivo:** regras centralizadas, testáveis e reutilizáveis por Server Actions, queries e seed.

**Implicações:** componentes ficam responsáveis apenas por apresentação e estado local.

---

## D19 — Server Components, Server Actions e Route Handlers

**Decisão:** combinação das três camadas:

```text
Server Components  →  leitura de dados
Server Actions     →  CRUD interno (livros, capítulos, perguntas, sessões)
Route Handlers     →  integrações externas (ex.: proxy da Google Books API, D30/D31)
```

**Motivo:** evita chamadas HTTP internas desnecessárias, mantendo um ponto explícito para
integrações externas.

**Implicações:** cada Server Action valida a sessão do usuário antes de qualquer operação.

---

## D20 — Validação de dados

**Alternativas:** só frontend · só backend · schemas compartilhados.

**Decisão:** **Zod no backend**, com reuso de schemas no frontend apenas quando houver
benefício claro.

**Motivo:** o servidor precisa ser a fonte confiável de validação; o frontend pode reaproveitar
o schema para feedback imediato.

**Implicações:** tipos de input (`CreateBookInput`, `CreateQuestionInput`, etc.) derivam dos
schemas Zod, e não do tipo completo `Book`.

---

## D21 — Exposição de respostas

**Alternativas:** enviar pergunta e resposta juntas · buscar a resposta ao revelar.

**Decisão:** **enviar perguntas e respostas juntas**.

**Motivo:** simplicidade e revelação instantânea na interface; a aplicação é pessoal e o
usuário não tem incentivo real em burlar a própria recuperação ativa.

**Implicações:**

- Não haverá endpoint separado de "revelar resposta".
- Combina com [D24](#d24--granularidade-das-queries), que já carrega o livro completo.

---

## D22 — Geração de prompts

**Alternativas:** gerar no cliente · gerar no servidor.

**Decisão:** **gerar no cliente**.

**Motivo:** os prompts são semi-fixos — apenas perguntas e respostas variam — e o cliente já
possui esses dados por força de [D21](#d21--exposição-de-respostas).

**Implicações:** `generateDirectPrompt` e `generateRecognitionPrompt` permanecem funções puras
em `src/domain/prompts.ts`, importáveis por Client Components.

---

## D23 — Integração com IA

**Alternativas:** apenas copiar prompts para ferramenta externa · integrar provedor de IA.

**Decisão:** **prompts externos**, com uma interface de domínio preparada para integração futura.

```ts
interface TutorProvider {
  evaluateAnswer(input: EvaluationInput): Promise<EvaluationResult>;
}
```

**Motivo:** sem custo de API e sem gestão de tokens; o resultado externo retorna ao sistema
pelo fluxo definido em [D16](#d16--cálculo-de-score).

---

## D24 — Granularidade das queries

**Alternativas:** buscar tudo por livro · queries específicas por tela.

**Decisão:** **buscar tudo por livro**.

**Motivo:** menos queries, código mais simples e compatível com o formato de dados que os
componentes já esperam.

**Implicações:**

- Aceitável dado o porte de uma biblioteca pessoal.
- Se o volume crescer, reavaliar com uma nova decisão.

---

## D25 — Cache e revalidação

**Decisão:** usar o **cache do Next.js**.

**Motivo:** reduz consultas repetidas e melhora a performance percebida.

**Implicações:**

- Dados pessoais nunca podem ser servidos de cache compartilhado entre usuários.
- Toda mutação deve chamar `revalidatePath` / `revalidateTag` correspondente.

---

## D26 — Operações compostas

**Alternativas:** operações separadas · transação.

**Decisão:** **transação PostgreSQL** (`prisma.$transaction`).

**Aplicado a:**

- concluir sessão (tentativas + score + estado de consolidação);
- criar livro com capítulos iniciais;
- excluir livro e dados associados;
- atualizar estado de consolidação.

**Motivo:** evita estados parcialmente gravados.

---

## D27 — Exclusão de dados

**Decisão:** **soft delete** (`deletedAt`) para livros e usuários. Capítulos e perguntas podem
ser excluídos fisicamente, já que o histórico relevante vive nas tentativas.

**Motivo:** evita perda acidental e preserva histórico.

**Implicações:** todas as queries devem filtrar registros com `deletedAt` nulo.

---

## D28 — Dados iniciais

**Alternativas:** manter `MOCK_BOOKS` no frontend · converter em seed.

**Decisão:** **converter para `prisma/seed.ts`**.

**Motivo:** elimina a duplicidade de fonte de verdade e torna o ambiente reproduzível.

**Implicações:** o seed mapeia os IDs fixos do mock para UUIDs gerados pelo banco
([D11](#d11--geração-de-ids)).

---

## D29 — Dados derivados

**Contexto:** `avgScore`, capítulos lidos, total de perguntas, progresso.

**Alternativas:** persistir · calcular sob demanda.

**Decisão:** **calcular sob demanda**.

**Motivo:** fonte de verdade única e menor risco de inconsistência.

**Implicações:** só materializar métricas se houver problema real de performance.

---

## D30 — Capas e metadados de livros

**Contexto:** hoje a capa é `coverGradient: [string, string]`.

**Alternativas:** manter gradientes · upload próprio · **Google Books API**.

**Decisão:** **Google Books API**.

**Motivo:** fornece capa, título, autor, ano e número de páginas sem exigir storage próprio.

**Implicações:**

- O modelo passa a ter `coverUrl` (e opcionalmente identificadores da Google Books).
- `COVER_GRADIENTS` permanece apenas como fallback visual quando não houver capa.

---

## D31 — Estratégia de busca

**Decisão:** **busca híbrida**:

```text
Dados já cadastrados (livros do usuário, capítulos, perguntas)  →  PostgreSQL
Livros ainda não cadastrados                                     →  Google Books API
```

**Motivo:** o banco responde pelo acervo pessoal; a API externa responde pela descoberta de
novos títulos.

**Implicações:** o fluxo de adicionar livro passa por uma etapa de busca externa antes da
confirmação dos dados.

---

## D32 — Paginação

**Decisão:** **paginar apenas os resultados da Google Books API**. Listagens internas
(biblioteca, capítulos, histórico) não são paginadas inicialmente.

**Motivo:** a biblioteca pessoal é pequena; a API externa pode retornar muitos resultados.

---

## D33 — Estado no frontend

**Alternativas:** estado global centralizado · estado baseado no servidor.

**Decisão:** **estado baseado no servidor**.

**Motivo:** o banco passa a ser a fonte de verdade, eliminando sincronização manual.

**Implicações:**

- O estado global de livros de `App.tsx` é removido.
- `useState` fica restrito a formulários e interações locais.

---

## D34 — Feedback de mutações

**Alternativas:** pessimista · otimista.

**Decisão:** **atualização pessimista**.

**Motivo:** estado sempre confiável e tratamento de falhas mais simples.

**Implicações:** a UI deve exibir estados de carregamento claros em ações como marcar capítulo
como lido.

---

## D35 — Estratégia de testes

**Decisão:**

```text
Testes unitários     →  score, estado de consolidação, prompts, validações, derivados
Testes de integração →  Server Actions, queries, autorização, transações
Testes E2E           →  não implementar
```

**Motivo:** cobre as regras críticas e a fronteira com o banco sem o custo de manter uma suíte
E2E.

---

## D36 — Deploy

**Decisão:** **Vercel** para o Next.js e **Supabase** para o PostgreSQL.

**Motivo:** integração natural com o App Router e coerência com
[D07](#d07--provedor-do-postgresql).

**Implicações:** configurar connection pooling do Supabase para o ambiente serverless
([D06](#d06--orm)).

---

## D37 — Variáveis de ambiente

**Decisão:** segredos **apenas no servidor**.

```text
DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_BOOKS_API_KEY
NEXT_PUBLIC_SUPABASE_URL          (público por natureza)
NEXT_PUBLIC_SUPABASE_ANON_KEY     (público por natureza)
```

**Motivo:** qualquer variável `NEXT_PUBLIC_*` fica exposta no navegador.

**Implicações:** chamadas à Google Books API que usem chave privada devem passar por um Route
Handler ([D19](#d19--server-components-server-actions-e-route-handlers)).

---

## D38 — Observabilidade

**Decisão:** **`console.log` inicialmente**, atrás de uma interface abstraída pronta para
Sentry ou similar.

```ts
interface Logger {
  info(event: string, meta?: Record<string, unknown>): void;
  error(event: string, error: unknown, meta?: Record<string, unknown>): void;
}
```

**Motivo:** evita custo e configuração agora, sem criar dívida de refatoração depois.

**Implicações:** nunca registrar respostas completas ou dados pessoais desnecessários.

---

## D39 — Rate limiting

**Decisão:** **não implementar**.

**Motivo:** aplicação pessoal, sem API pública e sem chamadas pagas de IA
([D23](#d23--integração-com-ia)).

**Reavaliar se:** a API for exposta publicamente ou houver integração direta com IA.

---

## D40 — Documentação de API

**Decisão:** **não formalizar** (sem OpenAPI).

**Motivo:** a API é consumida apenas pelo próprio Next.js.

**Reavaliar se:** surgir aplicativo mobile ou integração de terceiros.

---

## D41 — Persistência do gradiente de capa

**Contexto:** [D30](#d30--capas-e-metadados-de-livros) introduz `coverUrl`, mas o schema da
Fase 2 não tem coluna para `coverGradient`.

**Alternativas:** coluna `coverGradientIndex` · coluna `String[]` com as duas cores · derivar
o gradiente de fallback a partir do id do livro em tempo de renderização.

**Decisão:** **derivar em tempo de renderização**, sem coluna.

**Motivo:** o gradiente é puramente um fallback visual quando não há `coverUrl`
([D30](#d30--capas-e-metadados-de-livros)); calculá-lo a partir do id evita uma coluna cujo
único propósito é estético e nunca é editada pelo usuário.

**Implicações:** a Fase 3 cria um helper determinístico (id do livro → índice em
`COVER_GRADIENTS`) reutilizado onde a capa é renderizada.

---

## D42 — Exclusão física de perguntas e histórico de tentativas

**Contexto:** [D27](#d27--exclusão-de-dados) permite exclusão física de perguntas, mas
[D14](#d14--histórico-de-desempenho) depende de `SessionAttempt` para o histórico real.

**Decisão:** `SessionAttempt.questionId` é **opcional**, com `onDelete: SetNull`.

**Motivo:** excluir uma pergunta não deve apagar as tentativas já registradas contra ela; o
histórico de desempenho da sessão permanece intacto, apenas perdendo o vínculo com a
pergunta removida.

**Implicações:** consultas que exibem o histórico de uma sessão devem tratar
`attempt.questionId` (e a pergunta relacionada) como potencialmente nulos.

---

## D43 — Postgres local em Docker + Supabase

**Contexto:** [D07](#d07--provedor-do-postgresql) já decide Supabase como provedor
gerenciado, mas o desenvolvimento do dia a dia não deve depender de rede/latência externa.

**Decisão:** **ambos** — Postgres local via Docker Compose para desenvolvimento, Supabase
como banco compartilhado/produção.

**Motivo:** desenvolvimento local rápido e offline-friendly, com paridade de schema garantida
pelas mesmas migrations do Prisma aplicadas nos dois ambientes.

**Implicações:**

- A troca entre ambientes é feita apenas via `DATABASE_URL`/`DIRECT_URL` no `.env`.
- `docker-compose.yml` expõe o Postgres local na porta `55432` (não `5432`), evitando
  conflito com outros containers Postgres já em uso na máquina do desenvolvedor.

---

## D44 — Escopo de escrita da Fase 3

**Contexto:** o plano original ([D01](#d01--estratégia-de-migração)) previa a Fase 3
somente-leitura, deixando as Server Actions mutarem um store em memória até a Fase 4 trazer
autenticação real.

**Alternativas:** manter a Fase 3 somente-leitura, com as actions temporariamente desativadas
(app fica sem escrita) · manter o store em memória convivendo com o banco até a Fase 4 · portar
as Server Actions para o Prisma já na Fase 3, sem Zod/autorização real.

**Decisão:** **portar as Server Actions para o Prisma na Fase 3**, sem validação Zod, sem
`$transaction` em operações compostas e sem autenticação real — apenas a posse por `userId` do
usuário de desenvolvimento fixo ([D08](#d08--isolamento-de-dados-por-usuário)).

**Motivo:** a regra de progressão exige que a aplicação fique funcional ao final de cada fase
([D01](#d01--estratégia-de-migração)); um app somente-leitura ou com dois back-ends de
persistência simultâneos viola isso sem necessidade.

**Implicações:**

- A Fase 4 deixa de "introduzir mutações" e passa a **endurecê-las**: validação Zod, transações
  em operações compostas e troca do usuário fixo pela sessão do Supabase Auth.
- `src/lib/auth.ts` (`getCurrentUser()`) é o único ponto que a Fase 4 precisa alterar — os call
  sites em Server Components e Actions não mudam.

---

## D45 — Forma dos tipos de domínio

**Contexto:** o mock em `src/domain/mock.ts` usava um formato próprio (`revisions:
RevisionRecord[]`, datas como `string`, `coverGradient` persistido) que não corresponde ao
schema do Prisma introduzido na Fase 2.

**Alternativas:** manter os tipos de domínio no formato do mock e criar uma camada de
mapeadores (`src/domain/mappers.ts`) na leitura · reformular `src/domain/types.ts` para
espelhar o schema do Prisma campo a campo.

**Decisão:** **reformular os tipos de domínio para espelhar o Prisma** (`Book`, `Chapter`,
`Question`, `RevisionSession`, `SessionAttempt`), sem camada de mapeadores.

**Motivo:** evita manter dois modelos de dados paralelos e a tradução constante entre eles;
qualquer nova coluna do schema já aparece no domínio sem trabalho extra.

**Implicações:**

- Datas passam a ser `Date | null` (não `string | undefined`).
- `revisions: RevisionRecord[]` dá lugar a `sessions: RevisionSession[]` com `attempts:
SessionAttempt[]` aninhados; a UI consome uma projeção derivada
  (`revisionRecords(book)` em `src/domain/derived.ts`) que reconstitui o formato antigo de
  exibição a partir de `sessions`/`attempts`.
- `Question.lastPerformance` deixa de ser persistido; vira `lastPerformance(question, book)`,
  calculado a partir da tentativa mais recente.

---

## D46 — Provisionamento JIT por `authUserId`

**Contexto:** na Fase 4, a autenticação passa a ser feita via Supabase Auth (Google OAuth).
É necessário conectar a identidade externa do Supabase com o registro `User` no Postgres local.

**Alternativas:** adoção por e-mail preexistente · provisionamento JIT por `authUserId` apenas.

**Decisão:** **provisionamento JIT por `authUserId` apenas**.

**Motivo:** simplicidade e segurança contra impersonação ou colisão de contas; não há tentativa
de associar contas por e-mail sem vínculo de autenticação estabelecido.

**Implicações:**

- `getCurrentUser()` consulta `db.user.findFirst({ where: { authUserId: authUser.id, deletedAt: null } })`.
- Se não encontrar, insere um novo `User` associando `authUserId`, `email` e `name` (extraído dos
  metadados do provedor Google).

---

## D47 — Reconciliação do seed com Supabase Auth

**Contexto:** o seed (`prisma/seed.ts`) popula 9 livros de demonstração. Com a autenticação real
ativa, o usuário autenticado no navegador precisa ser dono desses livros.

**Alternativas:** manter usuário fictício desacoplado · vincular o seed ao ID de autenticação real.

**Decisão:** **`SEED_USER_AUTH_ID` obrigatório no seed**.

**Motivo:** permite que o desenvolvedor crie uma conta no Supabase Auth via Google OAuth e, em
seguida, execute `pnpm db:seed` para receber imediatamente todo o acervo inicial de livros e
histórico de consolidação.

**Implicações:**

- O arquivo `prisma/seed.ts` valida a presença de `SEED_USER_AUTH_ID` e popula o campo `authUserId`.
- Documentado em `.env.example`.

---

## D48 — Padronização de retorno de Server Actions

**Contexto:** na Fase 3, as actions lançavam erros ou não retornavam dados de validação. Na Fase
4, validações Zod e operações de exclusão precisam fornecer feedback ao cliente.

**Alternativas:** exceções não capturadas · tuplas `[error, data]` · união discriminada `ActionResult`.

**Decisão:** **união discriminada `ActionResult<T>` com `fieldErrors`**.

**Motivo:** padrão idiomático do Next.js App Router para consumo por `useTransition` e formulários
reativos com mensagens de erro inline amigáveis.

**Implicações:**

- Todas as Server Actions em `src/app/actions/*.ts` retornam `ActionResult` em caso de erro de
  validação Zod ou falha de operação.

---

## D49 — Limiar de consolidação

**Contexto:** [D17](#d17--estado-de-consolidação) deixou `consolidated` como “desempenho
consistente e sessões recentes”, sem números. A Fase 5 precisa de uma regra executável.

**Decisão:** um livro é `consolidated` quando **todas** as condições valem:

```text
completedSessions.length >= 3
avg(score das últimas 3 sessões concluídas) >= 80
última sessão concluída há no máximo 90 dias
```

Caso contrário, `consolidating`. `archived` continua sendo um estado administrativo definido
explicitamente pelo usuário.

**Implicações:**

- O valor é persistido em `Book.consolidationState` na transação de `completeSession`.
- A cláusula de recência seria inerte se só fosse avaliada na escrita; as views usam
  `effectiveConsolidationState(book)` em `src/domain/derived.ts` para reavaliar na leitura.
- Constantes em `src/domain/constants.ts`: `CONSOLIDATION_MIN_SESSIONS`,
  `CONSOLIDATION_MIN_AVG_SCORE`, `CONSOLIDATION_RECENCY_DAYS`.

---

## D50 — Escada de intervalos de revisão

**Contexto:** `Book.nextRevision` existia no schema sem regra de cálculo.

**Decisão:** escada **fixa**, ancorada no momento em que o livro foi lido/concluído — offsets,
não intervalos cumulativos entre sessões:

```text
3d → 7d → 14d → 30d → 60d → 90d → 365d
```

Âncora = `book.endDate ?? firstCompletedSessionDate ?? completedAt`. Passada a escada →
`completedAt + 365d`. Sempre `max(calculado, completedAt + 1d)`. Campos `@db.Date` usam
precisão de dia UTC.

**Implicações:** a 1ª, 2ª e 3ª sessões de um livro concluído caem em `endDate+3d`, `+7d` e
`+14d` respectivamente (desde que isso não fique no passado relativo a `completedAt + 1d`).

---

## D51 — Adiamento de `recordAttempt`

**Contexto:** [D15](#d15--modelo-de-sessão-de-revisão) descreveu o ciclo iniciar → registrar
tentativas → concluir. Persistência por tentativa exigiria resume no meio da sessão e uma
constraint `@@unique([sessionId, questionId])`.

**Decisão:** **não implementar `recordAttempt` na Fase 5**. O cliente acumula avaliações e
envia todas em `completeSession`. A action é `await`ed com `useTransition` e erro inline
([D34](#d34--feedback-de-mutações)). Retomar uma sessão pendente reentra **do início** (modo
preservado), não no nível da tentativa.

**Implicações:**

- Sem migração Prisma nesta fase.
- Sessões abandonadas aparecem como “Em andamento” e podem ser retomadas ou canceladas
  (`cancelSession`).
- Captura de `userAnswer` na UI permanece fora de escopo; o campo continua opcional no schema.
