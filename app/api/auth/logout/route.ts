import { NextResponse } from "next/server";
import { signOut } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  // NextAuth v5 signOut() can run on the server and clear cookies.
  await signOut({ redirect: false });
  return NextResponse.json({ ok: true });
}
