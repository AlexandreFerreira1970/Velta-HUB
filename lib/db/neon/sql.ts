// Minimal SQL client used by the Neon repositories (an interface so the
// queries can also run against other Postgres drivers, e.g. in tests).

export type Row = Record<string, unknown>;

export interface SqlClient {
  query<T extends Row = Row>(text: string, params?: unknown[]): Promise<T[]>;
  /** Runs the statements atomically, in order. */
  transaction(statements: Array<[text: string, params?: unknown[]]>): Promise<void>;
}

/** timestamptz → ISO string (drivers return Date objects or strings). */
export function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

export function isoOrUndefined(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : iso(value);
}

/** SQL NULL → undefined, for optional fields. */
export function opt<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}
