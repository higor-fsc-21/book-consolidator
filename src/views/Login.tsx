import Link from "next/link";

export function Login({ onLogin }: { onLogin: () => Promise<void> }) {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#172f3b] bg-cover bg-center px-6 py-10 sm:px-10"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=2200&q=85')",
      }}
    >
      <div className="absolute inset-0 bg-[#172f3b]/80" />

      <div className="relative grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_400px] lg:gap-24">
        <div className="hidden text-white lg:block">
          <Link
            href="/"
            className="inline-flex items-center gap-3"
            aria-label="Voltar para a página inicial"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f2d492] text-[#172f3b]">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span className="font-display text-xl tracking-[-0.02em]">
              Book Consolidator
            </span>
          </Link>
          <p className="mt-20 max-w-xl font-display text-5xl leading-[0.98] tracking-[-0.04em] xl:text-6xl">
            O que você reconstrói, você realmente aprende.
          </p>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-white/65">
            Volte para os livros que importam e transforme leitura em memória
            viva, explicável e aplicável.
          </p>
          <div className="mt-10 flex items-center gap-3 text-sm text-white/55">
            <span className="font-mono text-xs text-[#f2d492]">01</span>
            <span className="h-px w-10 bg-white/30" />
            <span>Da página para a memória</span>
          </div>
        </div>

        <div className="w-full max-w-[400px] justify-self-center rounded-[4px] bg-[#f6f3ed] p-7 shadow-[16px_18px_0_rgba(242,212,146,0.25)] sm:p-9">
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#f2d492] text-[#172f3b]">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <span className="font-display text-xl text-[#172f3b]">
                Book Consolidator
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8d6f3e]">
              Seu próximo capítulo
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight tracking-[-0.035em] text-[#172f3b]">
              Boas-vindas.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[#536066]">
              Entre para guardar o que vale a pena lembrar e voltar às suas
              ideias no momento certo.
            </p>
          </div>

          <form action={onLogin}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-full bg-[#172f3b] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(23,47,59,0.18)] transition-transform hover:-translate-y-0.5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar com Google
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-[#687278]">
            Ao entrar, você concorda com os termos de uso e política de
            privacidade do Book Consolidator.
          </p>

          <Link
            href="/"
            className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-[#172f3b] underline decoration-[#d2a64c] decoration-2 underline-offset-4 hover:text-[#8d6f3e]"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}
