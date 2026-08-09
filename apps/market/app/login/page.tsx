import { Suspense } from "react";
import { auth } from "../../auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export const metadata = { title: "Masuk — Altora Market" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/kasir");

  return (
    <div
      className="flex min-h-screen flex-1 md:grid md:grid-cols-2"
      style={{
        "--color-primary": "#a730a8",
        "--color-primary-dark": "#7e2582",
      } as React.CSSProperties}
    >
      {/* Form side */}
      <div
        className="flex flex-1 items-center justify-center px-4 py-10"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(47,59,163,.2) 0%, rgba(167,48,168,.16) 45%, rgba(242,138,78,.2) 100%), radial-gradient(1000px 620px at 8% -5%, rgba(47,59,163,.38) 0%, transparent 60%), radial-gradient(900px 560px at 100% 0%, rgba(242,138,78,.38) 0%, transparent 55%), radial-gradient(800px 700px at 50% 120%, rgba(167,48,168,.32) 0%, transparent 60%)",
        }}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-6 shadow-xl sm:p-8"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(18px) saturate(1.6)",
            WebkitBackdropFilter: "blur(18px) saturate(1.6)",
            border: "1px solid rgba(255,255,255,0.45)",
          }}
        >
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            {/* Altora Logo SVG Mark */}
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl p-2 shadow-lg" style={{ background: "transparent" }}>
              <img src="/altora-icon.svg" alt="Altora Logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col gap-1">
              <h1
                className="text-2xl font-semibold tracking-tight"
                style={{ color: "var(--color-text)" }}
              >
                Masuk ke Altora
              </h1>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Kelola kasir, produk, dan karyawan tokomu.
              </p>
            </div>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      {/* Visual side — desktop only */}
      <div className="relative hidden md:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(167,48,168,.10) 0%, rgba(167,48,168,.32) 100%), linear-gradient(135deg, #7e2582 0%, #a730a8 50%, #f28a4e 100%)",
          }}
        />
        <p className="absolute bottom-8 right-8 max-w-xs text-right text-lg italic text-white" style={{ textShadow: "0 2px 14px rgba(0,0,0,.5)" }}>
          &ldquo;Bisnis secantik ini, pantas dikelola sepintar itu.&rdquo;
        </p>
      </div>
    </div>
  );
}
