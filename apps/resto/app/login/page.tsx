import type { Metadata } from "next";
import { resolveSafeCallbackPath } from "../../lib/resto-auth-policy.mjs";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk - Altora Resto", description: "Masuk ke operasional F&B Altora Resto." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const params = await searchParams;
  const callbackUrl = resolveSafeCallbackPath(params.callbackUrl);
  return (
    <main className="resto-login-page">
      <section className="resto-login-panel" aria-labelledby="resto-login-title">
        <p className="resto-login-product">ALTORA RESTO</p>
        <h1 id="resto-login-title">Masuk ke operasional restoran</h1>
        <p className="resto-login-intro">Kelola pesanan, meja, modifier menu, dan dapur Anda.</p>
        <LoginForm callbackUrl={callbackUrl} />
      </section>
    </main>
  );
}
