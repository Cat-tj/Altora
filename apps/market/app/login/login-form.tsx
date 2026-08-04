"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/kasir";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Email atau kata sandi salah. Silakan coba lagi.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: "var(--color-warning-bg, #fee2e2)",
            color: "var(--color-warning-text, #991b1b)",
          }}
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="nama@usaha.id"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-[48px] rounded-lg border bg-white/70 px-4 text-base outline-none transition-colors duration-150 focus:bg-white focus:ring-2"
          style={{
            borderColor: "var(--color-border, #e2e6ec)",
            color: "var(--color-text)",
            // @ts-expect-error CSS custom property
            "--tw-ring-color": "color-mix(in srgb, var(--color-primary) 20%, transparent)",
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          Kata sandi
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Minimal 6 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-[48px] rounded-lg border bg-white/70 px-4 text-base outline-none transition-colors duration-150 focus:bg-white focus:ring-2"
          style={{
            borderColor: "var(--color-border, #e2e6ec)",
            color: "var(--color-text)",
            // @ts-expect-error CSS custom property
            "--tw-ring-color": "color-mix(in srgb, var(--color-primary) 20%, transparent)",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{
          backgroundColor: "var(--color-primary, #a730a8)",
          color: "var(--color-on-primary, #fff)",
        }}
      >
        {pending && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "transparent" }} />
        )}
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}
