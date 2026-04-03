import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { unauthorized } from "@/lib/server/api";

export type AuthUser = {
  uid: string;
  email?: string;
};

export async function requireUser(
  request: NextRequest
): Promise<{ user: AuthUser } | { response: Response }> {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return { response: unauthorized("Missing auth token") };
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    return {
      user: {
        uid: decoded.uid,
        email: decoded.email,
      },
    };
  } catch {
    return { response: unauthorized("Invalid or expired auth token") };
  }
}
