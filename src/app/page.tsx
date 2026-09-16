import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/BrandMark";
import { FAST_PRINCIPLES } from "@/domain/fast";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://book-consolidator.vercel.app";

export const metadata: Metadata = {
  title: "Book Consolidator | Transforme leitura em conhecimento",
  description:
    "Leia menos no piloto automático. Consolide as ideias importantes dos seus livros através de lembrança, explicação e aplicação.",
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "Book Consolidator | Transforme leitura em conhecimento",
    siteName: "Book Consolidator",
    description:
      "Uma prática simples para transformar leitura em conhecimento retido, explicável e aplicável.",
    url: siteUrl,
    type: "website",
  },
};

function Mark() {
  return (
    <BrandMark
      size={36}
      className="rounded-[10px] shadow-[0_4px_14px_rgba(242,212,146,0.24)]"
    />
  );
}

function ArrowUpRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Book Consolidator",
  url: siteUrl,
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <main className="min-h-screen overflow-hidden bg-[#f6f3ed] text-[#172f3b]">
        <header className="absolute inset-x-0 top-0 z-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="Book Consolidator"
            >
              <Mark />
              <span className="font-display text-lg tracking-[-0.02em] text-white">
                Book Consolidator
              </span>
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <a
                href="#metodo"
                className="hidden text-white/75 transition-colors hover:text-white sm:block"
              >
                O método
              </a>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-white hover:text-[#172f3b]"
              >
                Entrar <ArrowUpRight />
              </Link>
            </nav>
          </div>
        </header>

        <section
          className="relative flex min-h-[760px] items-end bg-[#172f3b] bg-cover bg-center px-6 pb-20 pt-36 lg:min-h-[840px] lg:px-10 lg:pb-28"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=2200&q=85')",
          }}
        >
          <div className="absolute inset-0 bg-[#172f3b]/75" />
          <div className="relative mx-auto w-full max-w-7xl">
            <div className="max-w-3xl animate-[fade-up_700ms_ease-out_both]">
              <p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#f2d492]">
                <span className="h-px w-10 bg-[#f2d492]" />
                Leitura que permanece
              </p>
              <h1 className="max-w-3xl font-display text-5xl leading-[0.98] tracking-[-0.045em] text-white sm:text-7xl lg:text-[6.8rem]">
                Não leia para terminar. Leia para lembrar.
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/75 sm:text-xl">
                O Book Consolidator transforma seus livros em uma prática de
                conhecimento: você recorda as ideias, explica o que entendeu e
                aprende a reconhecê-las no mundo real.
              </p>
              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-3 rounded-full bg-[#f2d492] px-6 py-3.5 text-sm font-bold text-[#172f3b] shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-0.5"
                >
                  Começar a consolidar <ArrowUpRight />
                </Link>
                <span className="text-sm text-white/55">
                  Uma ideia importante por vez.
                </span>
              </div>
            </div>

            <div className="mt-20 flex items-center gap-3 text-sm text-white/60 lg:absolute lg:bottom-2 lg:right-0 lg:mt-0">
              <span className="font-mono text-xs text-[#f2d492]">01</span>
              <span className="h-px w-10 bg-white/30" />
              <span>Da página para a memória</span>
            </div>
          </div>
        </section>

        <section className="border-b border-[#dcd7cc] bg-[#f6f3ed] px-6 py-20 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8d6f3e]">
                A ideia central
              </p>
              <h2 className="mt-5 max-w-md font-display text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
                O que você reconstrói, você realmente aprende.
              </h2>
            </div>
            <div className="max-w-2xl self-end">
              <p className="text-xl leading-relaxed text-[#45545a]">
                Ler é receber. Aprender é conseguir voltar à ideia sem o livro
                aberto. O Book Consolidator cria o espaço entre uma coisa e
                outra, onde a informação deixa de ser passagem e começa a virar
                repertório.
              </p>
              <div className="mt-8 grid gap-3 text-sm font-semibold text-[#172f3b] sm:grid-cols-3">
                <span className="flex items-center gap-2">
                  <Check /> Menos releitura
                </span>
                <span className="flex items-center gap-2">
                  <Check /> Mais clareza
                </span>
                <span className="flex items-center gap-2">
                  <Check /> Aplicação real
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          id="metodo"
          className="bg-[#203e47] px-6 py-20 text-[#f6f3ed] lg:px-10 lg:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-8 border-b border-white/15 pb-10 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f2d492]">
                  O método FAST
                </p>
                <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
                  Quatro princípios para fazer uma ideia ficar.
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-white/60">
                Recuperação ativa, ângulos diferentes, revisão espaçada e
                progresso visível para transformar leitura em conhecimento.
              </p>
            </div>

            <div className="grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
              {FAST_PRINCIPLES.map((principle) => (
                <article
                  key={principle.letter}
                  className="bg-[#203e47] px-6 py-8 lg:px-7"
                >
                  <span className="font-mono text-3xl text-[#f2d492]">
                    {principle.letter}
                  </span>
                  <h3 className="mt-8 font-display text-2xl tracking-[-0.025em]">
                    {principle.name}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/60">
                    {principle.description}
                  </p>
                  <div className="mt-7 border-t border-white/15 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f2d492]">
                      Base de estudo
                    </p>
                    <p className="mt-2 text-sm leading-snug text-white/85">
                      {principle.book}
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      {principle.authors}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-white/60">
                      {principle.evidence}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8d6f3e]">
                Seu espaço de leitura
              </p>
              <h2 className="mt-5 max-w-xl font-display text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
                Uma biblioteca que devolve perguntas, não só páginas.
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#45545a]">
                Organize livros, capítulos e perguntas essenciais. Volte quando
                for a hora certa e veja o que está se tornando parte de você.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#172f3b] underline decoration-[#d2a64c] decoration-2 underline-offset-4 hover:text-[#8d6f3e]"
              >
                Conhecer meu espaço de leitura <ArrowUpRight />
              </Link>
            </div>
            <div className="relative min-h-[360px] overflow-hidden rounded-[4px] bg-[#d7c7a7] shadow-[16px_18px_0_#e7dfd0]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(32,62,71,0.06),rgba(23,47,59,0.28))]" />
              <img
                src="https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1200&q=85"
                alt="Livros abertos sobre uma mesa"
                className="h-full w-full object-cover grayscale-[15%]"
                loading="lazy"
              />
              <div className="absolute bottom-5 left-5 bg-[#f6f3ed] px-4 py-3 text-sm text-[#172f3b] shadow-lg">
                <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#8d6f3e]">
                  Prática
                </span>
                <span className="mt-1 block font-display text-lg">
                  Ler. Fechar. Reconstruir.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f2d492] px-6 py-20 lg:px-10 lg:py-24">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8d6f3e]">
                Comece pelo próximo capítulo
              </p>
              <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight tracking-[-0.035em] text-[#172f3b] sm:text-6xl">
                Seu próximo livro pode continuar com você.
              </h2>
            </div>
            <Link
              href="/login"
              className="inline-flex shrink-0 items-center gap-3 rounded-full bg-[#172f3b] px-6 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Entrar no Book Consolidator <ArrowUpRight />
            </Link>
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-4 bg-[#172f3b] px-6 py-8 text-xs text-white/55 sm:flex-row lg:px-10">
          <div className="flex items-center gap-2.5">
            <BrandMark size={24} className="rounded-[6px]" />
            <span className="font-display text-base text-white">
              Book Consolidator
            </span>
          </div>
          <span>
            Conhecimento não é o que você leu. É o que você consegue
            reconstruir.
          </span>
        </footer>
      </main>
    </>
  );
}
