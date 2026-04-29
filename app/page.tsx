import LoginForm from "@/components/login-form"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-5 sm:py-10 md:px-6 md:py-12">
      <div className="glass-surface-strong grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-2xl md:grid-cols-2 md:min-h-[28rem]">
        {/* Branding — orange wash over glass (mesh shows through like dashboard) */}
        <aside
          className="relative flex flex-col justify-center overflow-hidden p-10 md:rounded-l-2xl md:p-12"
          aria-label="Brand"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ED7614]/82 via-[#c9590e]/72 to-[#5c2404]/88"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-white/[0.04]" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0 opacity-35"
            aria-hidden
            style={{
              backgroundImage: `linear-gradient(125deg, transparent 0%, rgba(255,255,255,0.08) 40%, transparent 55%),
                linear-gradient(18deg, transparent 50%, rgba(0,0,0,0.06) 72%, transparent 88%)`,
            }}
          />
          <div
            className="pointer-events-none absolute -right-6 top-[18%] h-32 w-32 rotate-12 border border-white/12 md:h-36 md:w-36"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-[20%] right-[10%] h-20 w-20 -rotate-6 border border-white/10 md:h-24 md:w-24"
            aria-hidden
          />

          <div className="relative z-10">
            <div className="mb-6">
              <Image
                src="/logo.svg"
                alt="AD-EASE"
                width={204}
                height={72}
                className="h-8 w-auto brightness-0 invert drop-shadow-sm sm:h-9"
                priority
                unoptimized
              />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">AD-EASE</h1>
            <p className="mt-2 text-base font-semibold text-orange-100/95">Digital Hoarding System</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/92">
              The digital hoarding system for your screens — run advertisements and playlists from one
              dashboard.
            </p>

            <p className="mt-6">
              <Link
                href="#sign-in"
                className="text-sm font-medium text-white/90 underline decoration-white/35 underline-offset-4 transition hover:text-white hover:decoration-white/65"
              >
                Learn more
              </Link>
            </p>
          </div>
        </aside>

        {/* Login — same glass language as dashboard cards */}
        <section
          id="sign-in"
          className="login-split-panel relative flex flex-col justify-center border-t border-white/10 bg-black/[0.22] p-8 backdrop-blur-xl md:rounded-r-2xl md:border-l md:border-t-0 md:border-white/10"
          aria-label="Sign in"
        >
          <div className="pointer-events-none absolute inset-0 bg-white/[0.03]" aria-hidden />
          <div className="relative z-10 mx-auto w-full max-w-sm space-y-4">
            <div>
              <Image
                src="/logo.svg"
                alt="AD-EASE"
                width={204}
                height={72}
                className="mx-auto h-8 w-auto sm:h-9"
                unoptimized
              />
            </div>

            <header className="space-y-1 text-center">
              <h2 className="text-xl font-semibold tracking-tight text-white">Hello Again!</h2>
              <p className="text-sm text-white/55">Welcome Back</p>
            </header>

            <LoginForm variant="split" />
          </div>
        </section>
      </div>
    </div>
  )
}
