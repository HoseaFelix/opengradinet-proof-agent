import { NextRequest } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { badRequest, ok, serverError } from "@/lib/server/api";
import { getOgBaseUrl, getOgTokenForUser } from "@/lib/server/opengradient";
import { formatFetchError } from "@/lib/server/fetchError";

type ChatPayload = {
  model: string;
  systemPrompt: string;
  userMessage: string;
  memories?: string[];
};

function contentToText(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (!block) return "";
        if (typeof block === "string") return block;
        if (typeof block === "object") {
          const b = block as { text?: unknown; content?: unknown; type?: unknown };
          if (typeof b.text === "string") return b.text;
          if (typeof b.content === "string") return b.content;
          if (b.type === "text" && typeof b.text === "string") return b.text;
        }
        return "";
      })
      .join("");
  }

  if (typeof content === "object") {
    const obj = content as { text?: unknown; content?: unknown };
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.content === "string") return obj.content;
  }

  return "";
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as ChatPayload;
    if (!body?.model || !body?.userMessage) {
      return badRequest("Invalid chat payload");
    }

    const token = await getOgTokenForUser(auth.user.uid);
    const messages = [
      ...(body.systemPrompt ? [{ role: "system", content: body.systemPrompt }] : []),
      ...(body.memories?.length
        ? [{ role: "system", content: `Relevant memory context: ${body.memories.join(" | ")}` }]
        : []),
      { role: "user", content: body.userMessage },
    ];

    const baseUrl = getOgBaseUrl();
    let upstream: Response;
    try {
      upstream = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: body.model,
          messages,
          stream: false,
        }),
      });
    } catch (e) {
      return badRequest(
        `OpenGradient network error (${formatFetchError(e)}). Check OG_LLM_BASE_URL (${baseUrl}) and your internet/DNS.`
      );
    }

    if (!upstream.ok) {
      const errorText = await upstream.text();
      return badRequest(`OpenGradient error: ${errorText}`);
    }

    const data = (await upstream.json()) as {
      id?: string;
      model?: string;
      choices?: Array<{ message?: { content?: unknown } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };

    const content = contentToText(data.choices?.[0]?.message?.content);
    return ok({
      content,
      proofHash: data.id || "",
      promptHash: "",
      model: data.model || body.model,
      tokenUsage: {
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0,
      },
      attestation: {
        teeProvider: "OpenGradient",
        enclaveHash: "",
        timestamp: Date.now(),
        signature: "",
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
