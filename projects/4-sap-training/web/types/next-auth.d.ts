import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";
import type { UserRole } from "@/types/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      roles: UserRole[];
      username?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    roles?: UserRole[];
    username?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: UserRole;
    roles?: UserRole[];
    username?: string | null;
  }
}
