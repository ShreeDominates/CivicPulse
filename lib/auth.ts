import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import crypto from "crypto";

// Safe Prisma import — works even if DB is unavailable
let prisma: any = null;
try {
  const mod = require("./prisma");
  prisma = mod.prisma;
} catch {
  console.warn("[CivicPulse] Prisma not available — auth will use JWT-only mode");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "disabled",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "disabled",
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
        const fullName = String(credentials?.fullName || "Citizen");

        // Validate Aadhaar: must be exactly 12 digits
        if (!/^\d{12}$/.test(aadhaar)) {
          console.warn("[CivicPulse] Invalid Aadhaar format");
          return null;
        }

        // Validate OTP: demo accepts "123456"
        if (otp !== "123456") {
          console.warn("[CivicPulse] Invalid OTP attempt");
          return null;
        }

        // Hash Aadhaar immediately — never store raw
        const salt = process.env.AADHAAR_SALT || "civicpulse-dev-salt";
        const aadhaarHash = crypto
          .createHash("sha256")
          .update(aadhaar + salt)
          .digest("hex");

        // Try to persist user in DB — but don't fail if DB is down
        let userId = `jwt-${aadhaarHash.slice(0, 12)}`;
        let userName = fullName;
        let userRole = "CITIZEN";
        let userMobile = "+919876543210";
        let userEmail = `aadhaar-${aadhaarHash.slice(0, 8)}@civicpulse.gov.in`;

        if (prisma) {
          try {
            let user = await prisma.user.findFirst({ where: { aadhaarHash } });
            if (!user) {
              user = await prisma.user.create({
                data: {
                  aadhaarHash,
                  name: fullName,
                  email: userEmail,
                  mobile: userMobile,
                  role: "CITIZEN",
                },
              });
            }
            userId = user.id;
            userName = user.name;
            userRole = user.role;
            userMobile = user.mobile || userMobile;
            userEmail = user.email || userEmail;
          } catch (dbErr) {
            console.warn("[CivicPulse] DB unavailable, using JWT-only mode:", (dbErr as Error).message?.slice(0, 100));
          }
        }

        // Return user object — this gets encoded into the JWT
        return {
          id: userId,
          name: userName,
          email: userEmail,
          role: userRole,
          mobile: userMobile,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign-in, copy all user fields into token
      if (user) {
        token.userId = user.id;
        token.role = (user as any).role || "CITIZEN";
        token.mobile = (user as any).mobile || "+919876543210";
        token.fullName = user.name;
      }

      // On session update (e.g. after profile change), refresh from DB if available
      if (trigger === "update" && token.userId && prisma) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: token.userId as string } });
          if (dbUser) {
            token.role = dbUser.role;
            token.mobile = dbUser.mobile;
            token.fullName = dbUser.name;
          }
        } catch {
          // DB down — keep existing token data
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.userId) {
        session.user.id = token.userId as string;
        (session.user as any).role = token.role || "CITIZEN";
        (session.user as any).mobile = token.mobile || "+919876543210";
        session.user.name = (token.fullName as string) || session.user.name;
      }
      return session;
    },
  },
});
