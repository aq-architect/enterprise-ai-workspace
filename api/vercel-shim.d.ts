/**
 * Minimal types so api/*.ts typechecks without installing @vercel/node in CI.
 * On Vercel, the real @vercel/node runtime provides the implementation.
 */
export interface VercelRequest {
  method?: string;
  body?: any;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
}

export interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
  end: () => void;
  setHeader: (name: string, value: string) => void;
}
