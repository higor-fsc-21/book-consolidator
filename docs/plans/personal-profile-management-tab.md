# Plano de Implementação — Central de Perfil, Metas e Preferências

Transforma a página `/configuracoes` em uma central unificada de gerenciamento de perfil pessoal, metas de leitura/revisão (Método FAST), estatísticas da jornada de consolidação e preferências de lembretes, organizada em abas.

---

## 1. Objetivo

1. **Dados do Usuário (`Perfil`)**: Permitir ao leitor visualizar seu e-mail e data de cadastro, e editar seu nome de exibição (`name`), refletindo a alteração na barra lateral e no sistema.
2. **Configuração de Metas (`Metas`)**: Permitir configurar a **meta anual de livros lidos** (substituindo a constante fixa `ANNUAL_GOAL = 12`) e a **meta semanal de sessões de revisão** (para incentivar a consistência no método FAST).
3. **Estatísticas da Jornada (`Estatísticas`)**: Exibir indicadores globais acumulados da conta: total de revisões concluídas, progresso na meta semanal atual, média global de retenção/score, e distribuição de livros (consolidados vs. em consolidação).
4. **Lembretes (`Lembretes`)**: Manter o componente `NotificationSettings` existente integrado na quarta aba.
5. **Integração com Painel e Sidebar**: Atualizar o Dashboard (`/painel`) para calcular o progresso anual com base na meta personalizada do usuário, e tornar o bloco do usuário na `Sidebar` clicável direcionando para `/configuracoes?tab=perfil`.

---

## 2. Escopo e Alterações por Camada

### 2.1. Banco de Dados & Prisma (`prisma/schema.prisma`)

Adicionar dois campos com valores padrão ao modelo `User`:

```prisma
model User {
  // ... campos existentes
  annualBooksGoal         Int      @default(12)
  weeklyRevisionsGoal     Int      @default(3)
}
```

- **Migração**: Criar migração via `pnpm db:migrate` (ex: `add_user_reading_goals`).
- **Retrocompatibilidade**: Usuários já existentes recebem automaticamente `12` livros/ano e `3` revisões/semana.

### 2.2. Tipos de Domínio & Constantes (`src/domain/`)

- **`src/domain/constants.ts`**:
  - Manter `ANNUAL_GOAL = 12` como fallback padrão (`DEFAULT_ANNUAL_BOOKS_GOAL = 12`) e adicionar `DEFAULT_WEEKLY_REVISIONS_GOAL = 3`.
- **`src/domain/types.ts`**:
  - Adicionar interface `UserProfile`:
    ```ts
    export interface UserProfile {
      id: string;
      name: string;
      email: string;
      annualBooksGoal: number;
      weeklyRevisionsGoal: number;
      createdAt: Date;
    }
    ```
- **`src/domain/derived.ts`**:
  - Adicionar helper puro `userJourneyStats(books: Book[], now?: Date)` que calcula:
    - `totalCompletedSessions`: total de sessões com `completedAt !== null`.
    - `sessionsThisWeek`: sessões concluídas nos últimos 7 dias (ou semana corrente).
    - `globalAvgScore`: média ponderada ou simples dos scores das sessões concluídas (`number | null`).
    - `consolidatedBooksCount`: livros com `effectiveConsolidationState(b) === "consolidated"`.
    - `consolidatingBooksCount`: livros concluídos com `effectiveConsolidationState(b) === "consolidating"`.
    - `completedBooksCount`: total de livros com `status === "completed"`.

### 2.3. Validação (`src/lib/validators.ts`)

Adicionar schemas Zod para validação de entrada nas Server Actions:

```ts
export const UpdateUserProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(120, "Nome deve ter no máximo 120 caracteres"),
});

export const UpdateUserGoalsSchema = z.object({
  annualBooksGoal: z.coerce
    .number()
    .int("A meta deve ser um número inteiro")
    .min(1, "A meta mínima é de 1 livro por ano")
    .max(200, "A meta máxima é de 200 livros por ano"),
  weeklyRevisionsGoal: z.coerce
    .number()
    .int("A meta deve ser um número inteiro")
    .min(1, "A meta mínima é de 1 revisão por semana")
    .max(50, "A meta máxima é de 50 revisões por semana"),
});
```

### 2.4. Camada de Serviços e Server Actions

- **`src/domain/services/users.ts`** *(novo)*:
  - `updateUserProfile(userId: string, data: { name: string })`
  - `updateUserGoals(userId: string, data: { annualBooksGoal: number; weeklyRevisionsGoal: number })`
- **`src/app/actions/profile.ts`** *(novo, `"use server"`)*:
  - `updateUserProfileAction(input: UpdateUserProfileInput): Promise<ActionResult>`
    - Resolve usuário via `getCurrentUser()`.
    - Valida com `UpdateUserProfileSchema`.
    - Chama `updateUserProfile`.
    - Executa `revalidatePath("/", "layout")`, `revalidatePath("/configuracoes")` e `revalidatePath("/painel")`.
  - `updateUserGoalsAction(input: UpdateUserGoalsInput): Promise<ActionResult>`
    - Resolve usuário via `getCurrentUser()`.
    - Valida com `UpdateUserGoalsSchema`.
    - Chama `updateUserGoals`.
    - Executa `revalidatePath("/configuracoes")` e `revalidatePath("/painel")`.

### 2.5. Interface & Componentes (`src/views/` e `src/components/`)

- **`src/app/(app)/configuracoes/page.tsx`**:
  - Server Component que carrega `user = await getCurrentUser()` e `books = await getBooksForUser(user.id)`.
  - Passa `user` (serializado como `UserProfile`) e `books` para a view `ProfileSettingsView`.
- **`src/views/ProfileSettings.tsx`** *(novo, `"use client"`)*:
  - Controla a aba ativa via `useSearchParams()` (`?tab=perfil | metas | estatisticas | lembretes`, default `perfil`), seguindo o mesmo padrão visual de abas de `BookDetail.tsx`.
  - **Aba 1 — `Perfil`**:
    - Avatar com inicial do nome e gradiente editorial (`#1a2e44` → `#2d4460`).
    - Campo editável `Nome de exibição` com feedback otimista/transição (`useSingleFlightTransition`) e mensagens de sucesso/erro inline.
    - Campo somente leitura `E-mail` (com indicação de conta vinculada via Google) e data de criação (`Membro desde ...`).
  - **Aba 2 — `Metas`**:
    - Card de **Meta Anual de Leitura**: input numérico + seletores rápidos (ex: 6, 12, 24, 36 livros/ano) e barra de visualização do progresso atual (`completed.length / annualBooksGoal`).
    - Card de **Meta Semanal de Revisões**: input numérico + seletores rápidos (ex: 2, 3, 5, 7 sessões/semana) e barra de progresso da semana atual (`sessionsThisWeek / weeklyRevisionsGoal`).
    - Botão "Salvar metas" acionando `updateUserGoalsAction`.
  - **Aba 3 — `Estatísticas`**:
    - Grid de cartões com tipografia editorial (`font-display` e `font-mono`):
      1. Sessões concluídas (total histórico + sessões nesta semana).
      2. Retenção média global (`globalAvgScore%` com chip semântico de cor).
      3. Livros consolidados vs. em consolidação.
      4. Desempenho por modalidade (`Lembrar`, `Explicar`, `Reconhecer e Aplicar`).
    - Empty state amigável caso o leitor ainda não tenha concluído nenhuma sessão de revisão.
  - **Aba 4 — `Lembretes`**:
    - Renderiza o componente `<NotificationSettings />` existente sem alterar seu funcionamento.

### 2.6. Integração com Dashboard e Sidebar

- **`src/app/(app)/painel/page.tsx` & `src/views/Dashboard.tsx`**:
  - Passar `annualGoal={user.annualBooksGoal}` para `<Dashboard />` (com fallback para `ANNUAL_GOAL`).
  - Substituir o uso fixo de `ANNUAL_GOAL` nos cards de estatísticas e na barra de progresso anual pelo valor de `annualGoal` do usuário, evitando divisão por zero (`Math.max(1, annualGoal)`).
- **`src/components/Sidebar.tsx`**:
  - Transformar o bloco inferior com avatar, nome e e-mail do usuário em um `<Link href="/configuracoes?tab=perfil">` com estado hover sutil, mantendo o botão de `Sair` (`logout`) separado ao lado.

---

## 3. Entregáveis (Deliverables)

1. `prisma/schema.prisma` atualizado + nova migration em `prisma/migrations/`.
2. `src/domain/types.ts`, `src/domain/constants.ts` e `src/domain/derived.ts` atualizados com tipos de perfil e cálculo de estatísticas da jornada.
3. `src/lib/validators.ts` atualizado com `UpdateUserProfileSchema` e `UpdateUserGoalsSchema`.
4. `src/domain/services/users.ts` e `src/app/actions/profile.ts` criados.
5. `src/views/ProfileSettings.tsx` criado e conectado em `src/app/(app)/configuracoes/page.tsx`.
6. `src/views/Dashboard.tsx`, `src/app/(app)/painel/page.tsx` e `src/components/Sidebar.tsx` atualizados.

---

## 4. Critérios de Conclusão (Verification Checklist)

- [ ] A migração Prisma aplica sem erros e preserva usuários existentes com `annualBooksGoal = 12` e `weeklyRevisionsGoal = 3`.
- [ ] `/configuracoes` exibe as 4 abas (`Perfil`, `Metas`, `Estatísticas`, `Lembretes`) e sincroniza a aba ativa com `?tab=`.
- [ ] Alterar o nome na aba `Perfil` persiste no banco e atualiza imediatamente o nome exibido na `Sidebar`.
- [ ] Alterar a meta anual na aba `Metas` reflete no cálculo e na barra de progresso do `/painel` (Dashboard).
- [ ] A aba `Estatísticas` calcula corretamente o total de revisões, média de retenção e contagem por modalidade, além de tratar o estado vazio (0 sessões).
- [ ] Clicar no card do usuário no rodapé da `Sidebar` navega para `/configuracoes?tab=perfil`.
- [ ] `pnpm exec tsc --noEmit` passa sem erros de tipagem.
