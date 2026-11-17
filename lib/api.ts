import { auth } from "@/auth";

/** Id of the signed-in user, or null when the request is unauthenticated. */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export const unauthorized = () => new Response("Unauthorized", { status: 401 });

export const badRequest = (message: string) =>
  new Response(message, { status: 400 });

export const serverError = () =>
  new Response("Internal server error", { status: 500 });

/** Parses the JSON body, returning `undefined` when it is missing or invalid. */
export async function readJson<T>(req: Request): Promise<T | undefined> {
  try {
    return (await req.json()) as T;
  } catch {
    return undefined;
  }
}
