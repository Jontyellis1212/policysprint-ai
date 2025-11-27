import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Check environment variable
    const apiKey = process.env.OPENAI_API_KEY;

    // Build a detailed debug response
    const debugOutput = `
=== PolicySprint AI — DEBUG MODE ===

This temporary debug endpoint ignores OpenAI and instead reports:
- Whether Vercel received the OPENAI_API_KEY
- What environment the server thinks it's running in
- Whether the body parsing works

-------------------------------
ENVIRONMENT VARIABLES
-------------------------------
OPENAI_API_KEY present? ${apiKey ? "YES ✅" : "NO ❌"}

If this says NO:
- Vercel does NOT see your API key.
- Fix: Go to Vercel → Project → Settings → Environment Variables
  Add:
    Name: OPENAI_API_KEY
    Value: your full sk-... key
    Environment: All Environments
  Then click Redeploy.

-------------------------------
REQUEST BODY CHECK
-------------------------------
(The request body sent from the wizard)
${JSON.stringify(await request.json().catch(() => "Body parse error"), null, 2)}

-------------------------------
PROCESS.ENV (partial dump)
-------------------------------
${JSON.stringify(
  {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    REGION: process.env.VERCEL_REGION,
  },
  null,
  2
)}

-------------------------------
NEXT STEPS
-------------------------------
1. If OPENAI_API_KEY = NO ❌:
   → The key isn't loaded in this deployment.
   → Add it to Vercel project env vars and redeploy.

2. If OPENAI_API_KEY = YES ✅:
   → Great. The issue is NOT Vercel.
   → Next step is verifying the key is valid (active billing, not revoked).

3. Once debug is done, replace this file with the real generator again.
`.trim();

    // Always return debug info
    return NextResponse.json({
      success: true,
      fullText: debugOutput,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Debug route crashed",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
