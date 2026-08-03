"use server";

import { AuthError } from "next-auth";
import { signIn } from "../../auth";
import { resolveSafeCallbackPath } from "../../lib/resto-auth-policy.mjs";
import { getRestoClientIp } from "../../lib/resto-client-ip";
import { checkRateLimit, formatRetryMessage } from "../../lib/resto-rate-limit.mjs";

export type LoginState = { error?: string; email?: string };

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = resolveSafeCallbackPath(String(formData.get("callbackUrl") ?? ""));
  if (!email || !password) return { error: "Email dan kata sandi wajib diisi.", email };

  const ipLimit = checkRateLimit(`login:ip:${await getRestoClientIp()}`, 20, 60_000);
  if (!ipLimit.allowed) return { error: formatRetryMessage(ipLimit.retryAfterMs), email };

  const emailLimit = checkRateLimit(`login:email:${email.toLowerCase()}`, 5, 60_000);
  if (!emailLimit.allowed) return { error: formatRetryMessage(emailLimit.retryAfterMs), email };

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.type === "CredentialsSignin" && (error as AuthError & { code?: string }).code === "tenant_suspended" ? "Akun restoran ini sedang nonaktif. Hubungi admin Altora." : "Email atau kata sandi salah. Coba periksa lagi.", email };
    }
    throw error;
  }
}
