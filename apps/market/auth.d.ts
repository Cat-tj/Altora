import type { DefaultSession } from "next-auth";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    tenantId: string;
    tenantName: string;
    role: "OWNER" | "MANAGER" | "STAFF";
  }

  interface Session {
    user: {
      id: string;
      tenantId: string;
      tenantName: string;
      role: "OWNER" | "MANAGER" | "STAFF";
    } & NonNullable<DefaultSession["user"]>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId?: string;
    tenantName?: string;
    role?: "OWNER" | "MANAGER" | "STAFF";
  }
}
