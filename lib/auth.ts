import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import crypto from "crypto";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "Aadhaar OTP",
      credentials: {
        aadhaar: { label: "Aadhaar Number", type: "text" },
        otp: { label: "OTP", type: "text" },
        fullName: { label: "Full Name", type: "text" },
      },
      async authorize(credentials) {
        const aadhaar = String(credentials?.aadhaar || "");
        const otp = String(credentials?.otp || "");
        const fullName = String(credentials?.fullName || "Aryan Mehta");

        // Validate
        if (!aadhaar || aadhaar.length !== 12) return null;
        if (otp !== "123456") return null;

        // Hash Aadhaar immediately
        const salt = process.env.AADHAAR_SALT || "dev-salt";
        const aadhaarHash = crypto
          .createHash("sha256")
          .update(aadhaar + salt)
          .digest("hex");

        // Find or create user
        let user = await prisma.user.findFirst({ where: { aadhaarHash } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              aadhaarHash,
              name: fullName,
              email: `aadhaar-${aadhaarHash.slice(0, 8)}@civicpulse.gov.in`,
              mobile: "+919876543210",
              role: "CITIZEN",
            },
          });
        }

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      if (token.userId && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.mobile = dbUser.mobile;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId) {
        session.user.id = token.userId as string;
        (session.user as any).role = token.role || "CITIZEN";
        (session.user as any).mobile = token.mobile || "+919876543210";
      }
      return session;
    },
  },
});
