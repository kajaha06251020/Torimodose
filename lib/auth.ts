import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email || typeof credentials.email !== "string") return null;

        const email = credentials.email;

        let user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .then((rows) => rows[0]);

        if (!user) {
          const result = await db
            .insert(users)
            .values({ email })
            .returning();
          user = result[0];
        }

        return { id: user.id, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
