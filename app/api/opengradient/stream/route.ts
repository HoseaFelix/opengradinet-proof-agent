import { NextRequest } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { badRequest, serverError } from "@/lib/server/api";
import { getOgBaseUrl, getOgTokenForUser } from "@/lib/server/opengradient";
import { formatFetchError } from "@/lib/server/fetchError";

type StreamPayload = {
  model: string;
  systemPrompt: string;
  userMessage: string;
  memories?: string[];
};

function contentToText(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") return content;

  // Some providers / gateways return structured content blocks.
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (!block) return "";
        if (typeof block === "string") return block;
        if (typeof block === "object") {
          const b = block as { text?: unknown; content?: unknown; type?: unknown };
          if (typeof b.text === "string") return b.text;
          if (typeof b.content === "string") return b.content;
          // Common pattern: { type: "text", text: "..." }
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

function jsonLine(obj: unknown) {
  return `${JSON.stringify(obj)}\n`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as StreamPayload;
    if (!body?.model || !body?.userMessage) {
      return badRequest("Invalid stream payload");
    }

    const token = await getOgTokenForUser(auth.user.uid);
    const baseUrl = getOgBaseUrl();
    const messages = [
      ...(body.systemPrompt ? [{ role: "system", content: body.systemPrompt }] : []),
      ...(body.memories?.length
        ? [{ role: "system", content: `Relevant memory context: ${body.memories.join(" | ")}` }]
        : []),
      { role: "user", content: body.userMessage },
    ];

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
          stream: true,
        }),
      });
    } catch (e) {
      return badRequest(
        `OpenGradient network error (${formatFetchError(e)}). Check OG_LLM_BASE_URL (${baseUrl}) and your internet/DNS.`
      );
    }

    if (!upstream.ok || !upstream.body) {
      const errorText = await upstream.text();
      return badRequest(`OpenGradient stream error: ${errorText}`);
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const reader = upstream.body.getReader();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let buffer = "";
        let rawUpstream = "";
        let fullContent = "";
        let model = body.model;
        let promptTokens = 0;
        let completionTokens = 0;
        let totalTokens = 0;
        let proofHash = "";
        let sawData = false;

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const decoded = decoder.decode(value, { stream: true });
            rawUpstream += decoded;
            buffer += decoded;
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (!line.startsWith("data:")) continue;

              const payload = line.replace(/^data:\s*/, "");
              if (!payload || payload === "[DONE]") continue;

              let parsed: {
                id?: string;
                model?: string;
                error?: { message?: string } | string;
                usage?: {
                  prompt_tokens?: number;
                  completion_tokens?: number;
                  total_tokens?: number;
                };
                choices?: Array<{
                  delta?: { content?: unknown; text?: unknown };
                  message?: { content?: unknown; text?: unknown };
                }>;
              } | null = null;

              try {
                parsed = JSON.parse(payload);
              } catch {
                continue;
              }

              sawData = true;
              if (!parsed) continue;
              const errorMessage =
                typeof parsed.error === "string"
                  ? parsed.error
                  : parsed.error?.message;
              if (errorMessage) {
                controller.enqueue(
                  encoder.encode(jsonLine({ type: "error", message: errorMessage }))
                );
                controller.close();
                try {
                  await reader.cancel();
                } catch {
                  // ignore
                }
                return;
              }

              proofHash = parsed.id || proofHash;
              model = parsed.model || model;

              if (parsed.usage) {
                promptTokens = parsed.usage.prompt_tokens || promptTokens;
                completionTokens = parsed.usage.completion_tokens || completionTokens;
                totalTokens = parsed.usage.total_tokens || totalTokens;
              }

              const choice0 = parsed.choices?.[0];
              const tokenChunk =
                contentToText(choice0?.delta?.content ?? choice0?.message?.content) ||
                contentToText(choice0?.delta?.text ?? choice0?.message?.text);

              if (tokenChunk) {
                fullContent += tokenChunk;
                controller.enqueue(
                  encoder.encode(jsonLine({ type: "token", content: tokenChunk }))
                );
              }
            }
          }

          // Fallback: some gateways ignore `stream: true` and return a single JSON response.
          if (!fullContent && !sawData) {
            try {
              const parsed = JSON.parse(rawUpstream) as {
                id?: string;
                model?: string;
                choices?: Array<{ message?: { content?: unknown; text?: unknown } }>;
                usage?: {
                  prompt_tokens?: number;
                  completion_tokens?: number;
                  total_tokens?: number;
                };
              };
              proofHash = parsed.id || proofHash;
              model = parsed.model || model;
              if (parsed.usage) {
                promptTokens = parsed.usage.prompt_tokens || promptTokens;
                completionTokens = parsed.usage.completion_tokens || completionTokens;
                totalTokens = parsed.usage.total_tokens || totalTokens;
              }
              fullContent =
                contentToText(parsed.choices?.[0]?.message?.content) ||
                contentToText(parsed.choices?.[0]?.message?.text) ||
                "";
              if (fullContent) {
                controller.enqueue(encoder.encode(jsonLine({ type: "token", content: fullContent })));
              }
            } catch {
              // ignore
            }
          }

          controller.enqueue(
            encoder.encode(
              jsonLine({
                type: "proof",
                proofHash,
                attestation: {
                  teeProvider: "OpenGradient",
                  enclaveHash: "",
                  timestamp: Date.now(),
                  signature: "",
                },
              })
            )
          );

          controller.enqueue(
            encoder.encode(
              jsonLine({
                type: "done",
                result: {
                  content: fullContent || "[No text returned by model]",
                  proofHash,
                  attestation: {
                    teeProvider: "OpenGradient",
                    enclaveHash: "",
                    timestamp: Date.now(),
                    signature: "",
                  },
                  promptHash: "",
                  model,
                  tokenUsage: {
                    prompt: promptTokens,
                    completion: completionTokens || fullContent.split(/\s+/).filter(Boolean).length,
                    total:
                      totalTokens ||
                      promptTokens +
                        (completionTokens || fullContent.split(/\s+/).filter(Boolean).length),
                  },
                },
              })
            )
          );
          controller.close();
        } catch {
          controller.error(new Error("Failed to process OpenGradient stream"));
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
