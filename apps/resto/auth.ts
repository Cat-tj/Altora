import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { findRestoUserByEmail } from "./lib/resto-user";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

class TenantSuspendedError extends CredentialsSignin {
  code = "tenant_suspended";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const user = await findRestoUserByEmail(parsed.data.email);
        if (!user || !user.userActive) return null;
        if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null;
        if (!user.tenantActive) throw new TenantSuspendedError();
        return { id: user.id, name: user.name, email: user.email, tenantId: user.tenantId, tenantName: user.tenantName, role: user.role };
      },
    }),
  ],
});
