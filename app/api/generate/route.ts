import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    // Just echo back what the server can see
    return NextResponse.json({
      success: true,
      fullText: `
DEBUG MODE - PolicySprint AI

Environment check:
- OPENAI_API_KEY present? ${apiKey ? "YES ✅" : "NO ❌"}

Notes:
- If this says NO, Vercel is not seeing your key. Check the Environment Variables in your Vercel project settings.
- If this says YES, then the issue is likely with the key itself (disabled, no billing, or wrong project).

This is only a temporary debug response. Once this is working, we will restore the real policy generator.
      `.trim(),
    });
  } catch (error) {
    console.error("Error in /api/generate debug:", error);
    return NextResponse.json(
      { success: false, error: "Debug route error" },
      { status: 500 }
    );
  }
}
