"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="market-login-form">
      <input name="callbackUrl" type="hidden" value={callbackUrl} />
      {state.error && <p className="market-login-error" aria-live="assertive">{state.error}</p>}
      <label htmlFor="email">Email</label>
      <input autoComplete="email" defaultValue={state.email ?? ""} id="email" name="email" placeholder="nama@usaha.id" required type="email" />
      <label htmlFor="password">Kata sandi</label>
      <div className="market-password-field">
        <input autoComplete="current-password" id="password" name="password" placeholder="Minimal 6 karakter" required type={showPassword ? "text" : "password"} />
        <button aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} type="button">
          {showPassword ? "Sembunyikan" : "Tampilkan"}
        </button>
      </div>
      <button className="market-login-submit" disabled={pending} type="submit">{pending ? "Memeriksa…" : "Masuk"}</button>
    </form>
  );
}
