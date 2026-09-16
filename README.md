# Book Consolidator — Sistema Pessoal de Consolidação do Conhecimento

Book Consolidator é uma aplicação projetada para transformar leituras em conhecimento retido, explicável e aplicável a longo prazo, por meio de sessões estruturadas de consolidação espaçada.

## Método FAST

- **F — Forced Retrieval**: reconstrua as ideias antes de consultar as respostas.
- **A — Alternating Approaches**: alterne entre as modalidades Direct, Guided e Practical.
- **S — Spaced Repetition**: revise em intervalos cada vez maiores e otimizados.
- **T — Tracking**: acompanhe visualmente seu progresso e a consolidação do conhecimento.

As bases do método são _Make It Stick_ e _A Mind for Numbers_, de Peter C. Brown, Henry L. Roediger III, Mark A. McDaniel e Barbara Oakley.

## Filosofia & Níveis de Consolidação

Baseado na especificação em `docs/knowledge-consolidation-app.md`:

> _"Não tente lembrar tudo. Tente conseguir reconstruir as ideias mais importantes sem consultar suas anotações."_

A aplicação estrutura a consolidação em três níveis progressivos:

1. **Lembrar (`direct`)**: Reconstrução ativa de conceitos-chave sem pistas.
2. **Explicar (`guided`)**: Explicação conceitual em linguagem própria (Técnica Feynman).
3. **Reconhecer e Aplicar (`recognition`)**: Identificação e aplicação do conceito em situações práticas do cotidiano.

## Stack Tecnológica

- **Frontend**: React 19, TypeScript 5.7
- **Build Tool**: Vite 8
- **Estilização**: Tailwind CSS v4 com `@tailwindcss/vite` e tipografia editorial (`Libre Caslon Text`, `Hanken Grotesk`, `JetBrains Mono`)
- **Ambiente**: Figma Make
- **Formatador**: oxfmt

## Comandos

```bash
# Instalar dependências
pnpm install

# Iniciar servidor de desenvolvimento (já iniciado automaticamente no ambiente Figma Make)
pnpm dev

# Typechecking TypeScript
pnpm exec tsc --noEmit

# Build de produção
pnpm build

# Pré-visualização do bundle
pnpm preview

# Formatar código
pnpm format
```

## Estrutura do Projeto

- `src/main.tsx` — Ponto de entrada React
- `src/App.tsx` — Estado principal da aplicação e controle de navegação
- `src/data.ts` — Modelos de domínio (`Book`, `Chapter`, `Question`, etc.) e dados iniciais
- `src/views/` — Telas da aplicação (`Dashboard`, `Library`, `BookDetail`, `ChapterDetail`, `MemorizationSession`, `Login`)
- `src/components/` — Componentes reutilizáveis (`BookModal`)
- `docs/` — Documentação de design (`docs/DESIGN.md`) e especificação conceitual (`docs/knowledge-consolidation-app.md`)
