# Feature Plan — Central de Ajuda & Fale com o Dev (`/ajuda`)

Documenta o escopo, decisões de arquitetura e passos de implementação para a página dedicada de **Ajuda (`/ajuda`)**, contendo guias sobre o método do app, perguntas frequentes (FAQ) e formulário de contato direto com o desenvolvedor persistido no banco de dados e enviado via Resend.

## 1. Objetivo

Oferecer aos usuários do **Book Consolidator** uma referência clara e autônoma sobre o funcionamento do sistema (Método FAST, níveis de consolidação e fluxo de uso) e um canal direto para envio de dúvidas, sugestões ou relatos de bugs para o criador (`hc.job.21@gmail.com`), mantendo histórico completo no PostgreSQL.

---

## 2. Resumo do Escopo (MVP)

- **Navegação (`src/components/Sidebar.tsx`)**:
  - Adicionar o item **Ajuda** (`/ajuda`) na barra lateral desktop e na barra inferior mobile com ícone de suporte/interrogação (`?`).
- **Rota e Layout (`src/app/(app)/ajuda/page.tsx` e `loading.tsx`)**:
  - Rota protegida sob `(app)` que carrega os dados básicos do usuário autenticado via `getCurrentUser()` e renderiza a view `HelpCenter`.
  - Suporte a seleção de aba via query string opcional (`?tab=topicos | faq | contato`) ou estado local, seguindo o padrão de `BookDetail`.
- **Conteúdo Estático (`src/domain/helpContent.ts`)**:
  - Tópicos explicativos estruturados sobre:
    1. **O Método FAST** (*Forced Retrieval, Alternating Approaches, Spaced Repetition, Tracking*).
    2. **Os 3 Modos de Sessão** (*Lembrar / Direct*, *Explicar / Guided - Feynman*, *Reconhecer e Aplicar / Recognition*).
    3. **Ciclo de Vida do Livro e Agendamento** (Status de leitura, estados de consolidação e escada de revisão `[3, 7, 14, 30, 60, 90, 365]` dias).
    4. **Integração com IA Externa** (Como copiar o prompt gerado nas sessões guiadas/reconhecimento e colar o JSON de avaliação).
  - Lista de **Perguntas Frequentes (FAQ)** categorizadas, exibidas em componente de acordeão (*accordion*).
- **Banco de Dados (`prisma/schema.prisma`)**:
  - Novo enum `FeedbackCategory` (`question`, `suggestion`, `bug`).
  - Novo enum `FeedbackEmailStatus` (`pending`, `sent`, `failed`).
  - Nova tabela `FeedbackMessage` vinculada ao `User` (`userId`), armazenando categoria, assunto, mensagem, status de entrega do e-mail, erro (se houver) e timestamps.
- **Envio de E-mail & Persistência (`src/domain/services/feedback.ts` + `src/app/actions/feedback.ts`)**:
  - Validação com Zod em `src/lib/validators.ts` (`CreateFeedbackInputSchema`).
  - Persistência da mensagem no banco via Prisma antes do disparo de e-mail (garantindo que nenhuma mensagem do usuário seja perdida mesmo se a API de e-mail oscilar).
  - Envio de e-mail para `hc.job.21@gmail.com` via API HTTP do **Resend** (ou SDK `resend`), utilizando `RESEND_API_KEY` e `reply_to` configurado com o e-mail do usuário autenticado.

---

## 3. Modelo de Dados (Prisma)

Adicionar ao `prisma/schema.prisma`:

```prisma
enum FeedbackCategory {
  question
  suggestion
  bug
}

enum FeedbackEmailStatus {
  pending
  sent
  failed
}

model FeedbackMessage {
  id          String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String              @db.Uuid
  category    FeedbackCategory
  subject     String
  message     String
  emailStatus FeedbackEmailStatus @default(pending)
  emailError  String?
  sentAt      DateTime?           @db.Timestamptz(3)
  createdAt   DateTime            @default(now()) @db.Timestamptz(3)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}
```

E adicionar a relação `feedbackMessages FeedbackMessage[]` no model `User`.

---

## 4. Arquitetura e Arquivos Envolvidos

### 4.1 Domínio e Validação
- **`src/domain/types.ts`**:
  - Exportar tipos `FeedbackCategory` (`"question" | "suggestion" | "bug"`) e `FeedbackEmailStatus`.
- **`src/domain/helpContent.ts`** *(novo)*:
  - Definir interfaces `HelpTopic` e `FaqItem`.
  - Exportar `HELP_TOPICS: HelpTopic[]`, `FAQ_ITEMS: FaqItem[]` e `FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, { label: string; description: string }>`.
- **`src/lib/validators.ts`**:
  - Adicionar `FeedbackCategorySchema = z.enum(["question", "suggestion", "bug"])`.
  - Adicionar `CreateFeedbackInputSchema`:
    - `category`: `FeedbackCategorySchema`
    - `subject`: `z.string().trim().min(3, "Assunto muito curto").max(150, "Assunto muito longo")`
    - `message`: `z.string().trim().min(10, "Escreva uma mensagem um pouco mais detalhada").max(3000, "Mensagem excede o limite de 3000 caracteres")`

### 4.2 Serviço e Integração com Resend
- **`src/domain/services/feedback.ts`** *(novo)*:
  - `submitFeedbackMessage(user, input)`:
    1. Cria o registro `FeedbackMessage` no banco com `emailStatus: "pending"`.
    2. Dispara requisição para a API do Resend (`https://api.resend.com/emails` ou via SDK `resend`) com:
       - `from`: `process.env.RESEND_FROM_EMAIL ?? "Book Consolidator <onboarding@resend.dev>"`
       - `to`: `[process.env.FEEDBACK_TO_EMAIL ?? "hc.job.21@gmail.com"]`
       - `reply_to`: `user.email`
       - `subject`: `[Book Consolidator - ${categoryLabel}] ${input.subject}`
       - `text` / `html`: Corpo estruturado contendo nome do usuário, e-mail, ID do usuário, categoria, data/hora e mensagem.
    3. Se o envio for bem-sucedido, atualiza `emailStatus: "sent"` e `sentAt: new Date()`.
    4. Se falhar (ex.: chave ausente ou erro de rede), registra o log via `logger.error`, atualiza `emailStatus: "failed"` e `emailError`, mantendo a mensagem salva no banco.

### 4.3 Server Action
- **`src/app/actions/feedback.ts`** *(novo)*:
  - `"use server"`
  - `sendFeedbackAction(input: unknown): Promise<ActionResult<{ id: string; emailSent: boolean }>>`
  - Autentica o usuário com `getCurrentUser()`.
  - Valida o payload com `CreateFeedbackInputSchema.safeParse(input)`.
  - Chama `feedbackService.submitFeedbackMessage(user, parsed.data)`.
  - Registra logs estruturados (`feedback.submitted` / `feedback.submit_failed`) via `src/lib/logger.ts`.

### 4.4 Interface e Componentes
- **`src/components/Sidebar.tsx`**:
  - Incluir `{ href: "/ajuda", label: "Ajuda", icon: (...) }` em `navItems`.
- **`src/views/HelpCenter.tsx`** *(novo)*:
  - Client Component (`"use client"`) seguindo a tipografia editorial (`font-display`, `font-sans`, `font-mono`) e sombras `shadow-paper`.
  - Cabeçalho seguindo o padrão de `Configurações` / `Biblioteca`.
  - Navegação em 3 abas:
    1. **Tópicos do App**: Cards explicativos sobre o Método FAST, os 3 modos de sessão, como funcionam as revisões espaçadas e dicas de estudo.
    2. **Perguntas Frequentes**: Busca rápida opcional ou filtro simples + lista de acordeões interativos (`<details>` ou estado controlado) com respostas diretas. Atalho no rodapé: *"Não encontrou o que procurava? Fale com o dev"*, que muda para a 3ª aba.
    3. **Fale com o Dev**:
       - Exibe identificação da conta logada (*"Enviando como Nome (email@exemplo.com)"*).
       - Seletor visual de Categoria (`Dúvida`, `Sugestão`, `Bug`).
       - Campo de `Assunto` e `Mensagem` com contador de caracteres (`0 / 3000`).
       - Botão de envio protegido contra cliques duplos (`useSingleFlightTransition` / `useTransition`).
       - Banner de confirmação após envio bem-sucedido e opção de enviar nova mensagem.
- **`src/app/(app)/ajuda/page.tsx` e `src/app/(app)/ajuda/loading.tsx`** *(novos)*:
  - Server Component da rota `/ajuda` e skeleton de carregamento.

---

## 5. Variáveis de Ambiente

Adicionar documentação no `.env.example` (se existir) ou nas notas de deploy:

```env
# Resend (Envio de e-mails da aba Ajuda / Fale com o Dev)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Book Consolidator <onboarding@resend.dev>"
FEEDBACK_TO_EMAIL="hc.job.21@gmail.com"
```

---

## 6. Passo a Passo de Implementação

1. **Fase 1 — Schema & Tipos**:
   - Atualizar `prisma/schema.prisma` com `FeedbackCategory`, `FeedbackEmailStatus` e `FeedbackMessage`.
   - Gerar e aplicar migração Prisma (`pnpm db:migrate` / `prisma generate`).
   - Atualizar `src/domain/types.ts` e `src/lib/validators.ts`.
2. **Fase 2 — Conteúdo Estático de Ajuda**:
   - Criar `src/domain/helpContent.ts` com os tópicos do Método FAST, modos de sessão e perguntas frequentes em português.
3. **Fase 3 — Backend (Service & Server Action)**:
   - Implementar `src/domain/services/feedback.ts` com gravação via Prisma e disparo HTTP para a API do Resend (sem necessidade de dependência pesada ou adicionando `resend` se preferir).
   - Implementar `src/app/actions/feedback.ts`.
4. **Fase 4 — UI & Navegação**:
   - Criar `src/views/HelpCenter.tsx` com as 3 abas (*Tópicos do App*, *Perguntas Frequentes* e *Fale com o Dev*).
   - Criar `src/app/(app)/ajuda/page.tsx` e `src/app/(app)/ajuda/loading.tsx`.
   - Atualizar `src/components/Sidebar.tsx` com o link para `/ajuda`.
5. **Fase 5 — Testes & Validação**:
   - Testes unitários em `src/lib/validators.test.ts` cobrindo `CreateFeedbackInputSchema`.
   - Testes unitários/integração do serviço de feedback mockando a chamada ao Resend.
   - Verificação de tipos (`pnpm exec tsc --noEmit`) e formatação (`pnpm format`).

---

## 7. Critérios de Aceite

- [ ] O link "Ajuda" aparece na `Sidebar` (desktop e mobile) e destaca o estado ativo quando em `/ajuda`.
- [ ] A aba **Tópicos do App** explica com clareza o Método FAST e as 3 modalidades (*Lembrar*, *Explicar*, *Reconhecer e Aplicar*).
- [ ] A aba **Perguntas Frequentes** permite expandir/recolher respostas pré-definidas.
- [ ] A aba **Fale com o Dev** valida categoria, assunto e mensagem, impede cliques múltiplos e exibe feedback claro de sucesso ou erro.
- [ ] A mensagem enviada é persistida na tabela `FeedbackMessage` associada ao `userId` autenticado.
- [ ] O e-mail é disparado via Resend para `hc.job.21@gmail.com` contendo os dados do remetente e o conteúdo da mensagem.
- [ ] Caso o Resend falhe ou não esteja configurado em ambiente local, a mensagem ainda é salva no banco com `emailStatus = "failed"` sem quebrar a aplicação.
