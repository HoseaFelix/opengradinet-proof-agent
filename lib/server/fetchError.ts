export function formatFetchError(error: unknown): string {
  const err = error as {
    message?: string;
    cause?: unknown;
  };

  const message = err?.message || "fetch failed";
  const cause = err?.cause as
    | { code?: string; errno?: number | string; syscall?: string; hostname?: string }
    | undefined;

  if (cause && typeof cause === "object") {
    const parts = [
      cause.code ? `code=${cause.code}` : null,
      cause.errno !== undefined ? `errno=${String(cause.errno)}` : null,
      cause.syscall ? `syscall=${cause.syscall}` : null,
      cause.hostname ? `host=${cause.hostname}` : null,
    ].filter(Boolean);

    if (parts.length) return `${message} (${parts.join(", ")})`;
  }

  return message;
}
