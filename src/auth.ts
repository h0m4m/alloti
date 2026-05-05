import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "@/lib/mongodb-client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(client),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
    authorized: async ({ auth: session }) => {
      return !!session;
    },
  },
});
