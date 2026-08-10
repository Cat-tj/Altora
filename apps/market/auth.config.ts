import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        const marketUser = user as typeof user & { tenantId: string; tenantName: string; role: string };
        token.tenantId = marketUser.tenantId;
        token.tenantName = marketUser.tenantName;
        token.role = marketUser.role;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.sub, tenantId: token.tenantId, tenantName: token.tenantName, role: token.role },
    }),
    redirect: ({ url, baseUrl }) => {
      if (url.startsWith("/")) return new URL(url, baseUrl).toString();
      try {
        const candidate = new URL(url);
        if (candidate.origin === new URL(baseUrl).origin) return candidate.toString();
      } catch {
        // Invalid absolute callback URLs fall back to the current Market origin.
      }
      return baseUrl;
    },
  },
};
