import type { Metadata } from "next";
import { resolveSafeCallbackPath } from "../../lib/market-auth-policy.mjs";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk - Altora Market", description: "Masuk ke operasional retail Altora Market." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const params = await searchParams;
  const callbackUrl = resolveSafeCallbackPath(params.callbackUrl);
  return (
    <main className="market-login-page">
      <section className="market-login-panel" aria-labelledby="market-login-title">
        <p className="market-login-product">ALTORA MARKET</p>
        <h1 id="market-login-title">Masuk ke operasional retail</h1>
        <p className="market-login-intro">Kelola kasir, produk, stok, dan laporan outlet Anda.</p>
        <LoginForm callbackUrl={callbackUrl} />
      </section>
    </main>
  );
}
