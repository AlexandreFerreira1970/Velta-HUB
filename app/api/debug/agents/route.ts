export const runtime = "nodejs";

async function tryFetch(url: string, headers: Record<string, string>) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: new Headers({ "Content-Type": "application/json", ...headers }),
    });
    let body: unknown;
    try { body = await res.json(); } catch { body = await res.text(); }
    return { status: res.status, body };
  } catch (err) {
    return { status: 0, body: { error: err instanceof Error ? err.message : String(err) } };
  }
}

export async function GET() {
  const rawEndpoint = process.env.AZURE_AI_PROJECT_ENDPOINT!.replace(/\/$/, "");
  const apiKey = process.env.AZURE_FOUNDRY_API_KEY!;
  const auth = { "api-key": apiKey };

  const hostMatch = rawEndpoint.match(/^(https:\/\/[^/]+)/);
  const host = hostMatch?.[1] ?? rawEndpoint;

  const results: Record<string, unknown> = { rawEndpoint, host };

  // OpenAI Assistants API paths — agents in Foundry playground are OpenAI Assistants
  const assistantVersions = [
    "2024-05-01-preview",
    "2025-01-01-preview",
    "2025-05-15-preview",
  ];
  const assistantPaths = [
    `${rawEndpoint}/openai/assistants`,
    `${host}/openai/assistants`,
  ];

  for (const path of assistantPaths) {
    for (const version of assistantVersions) {
      const url = `${path}?api-version=${version}`;
      const r = await tryFetch(url, auth);
      const key = `ASSISTANTS: ${path.replace(host, "")}?api-version=${version}`;
      results[key] = { status: r.status, body: r.body };
      if (r.status === 200 && typeof r.body === "object" && r.body !== null &&
          "data" in r.body && Array.isArray((r.body as Record<string, unknown>).data) &&
          ((r.body as Record<string, unknown>).data as unknown[]).length > 0) {
        results["__found_assistants__"] = url;
        return Response.json(results);
      }
    }
  }

  // Also try the Responses API agents path for comparison
  const r1 = await tryFetch(`${rawEndpoint}/agents?api-version=2025-05-15-preview`, auth);
  results["AGENTS (responses api)"] = { status: r1.status, body: r1.body };

  return Response.json(results);
}
