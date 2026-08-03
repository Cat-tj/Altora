"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const errorId = useId();
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);

  return (
    <form action={formAction} className="resto-login-form">
      <input name="callbackUrl" type="hidden" value={callbackUrl} />
      {state.error && <p className="resto-login-error" data-testid="resto-login-error" id={errorId} ref={errorRef} role="alert" tabIndex={-1}>{state.error}</p>}
      <label htmlFor="email">Email</label>
      <input aria-describedby={state.error ? errorId : undefined} aria-invalid={Boolean(state.error)} autoComplete="email" defaultValue={state.email ?? ""} id="email" name="email" placeholder="nama@usaha.id" required type="email" />
      <label htmlFor="password">Kata sandi</label>
      <div className="resto-password-field">
        <input aria-describedby={state.error ? errorId : undefined} aria-invalid={Boolean(state.error)} autoComplete="current-password" id="password" name="password" placeholder="Minimal 6 karakter" required type={showPassword ? "text" : "password"} />
        <button aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} type="button">
          {showPassword ? "Sembunyikan" : "Tampilkan"}
        </button>
      </div>
      <button className="resto-login-submit" disabled={pending} type="submit">{pending ? "Memeriksa…" : "Masuk"}</button>
    </form>
  );
}
