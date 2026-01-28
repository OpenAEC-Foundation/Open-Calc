import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Default user ID for public access (authentication disabled)
const DEFAULT_USER_ID = "default-user";
const DEFAULT_USER_EMAIL = "gebruiker@opencalc.nl";
const DEFAULT_USER_NAME = "OpenCalc Gebruiker";

// Get or create the default user for public access
export async function getDefaultUserId(): Promise<string> {
  const existingUser = await prisma.user.findUnique({
    where: { id: DEFAULT_USER_ID },
  });

  if (existingUser) {
    return existingUser.id;
  }

  // Create default user if it doesn't exist
  const newUser = await prisma.user.create({
    data: {
      id: DEFAULT_USER_ID,
      email: DEFAULT_USER_EMAIL,
      name: DEFAULT_USER_NAME,
    },
  });

  return newUser.id;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) {
          return null;
        }

        const { email, password } = validated.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        // Simple password check for demo (in production, use bcrypt)
        const passwordMatch = user.password === password;

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
});
