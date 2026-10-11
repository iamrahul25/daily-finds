const env = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  d1DatabaseId: process.env.D1_DATABASE_ID,
  kvNamespaceId: process.env.KV_NAMESPACE_ID,
};

const ENV_NAMES: Record<keyof typeof env, string> = {
  accountId: "CLOUDFLARE_ACCOUNT_ID",
  apiToken: "CLOUDFLARE_API_TOKEN",
  d1DatabaseId: "D1_DATABASE_ID",
  kvNamespaceId: "KV_NAMESPACE_ID",
};

export function missingCloudflareEnv(): string[] {
  return (Object.keys(env) as (keyof typeof env)[]).filter((k) => !env[k]).map((k) => ENV_NAMES[k]);
}

export const isCloudflareConfigured = () => missingCloudflareEnv().length === 0;

const apiBase = () => `https://api.cloudflare.com/client/v4/accounts/${env.accountId}`;
const authHeader = () => ({ Authorization: `Bearer ${env.apiToken}` });

type ApiError = { code: number; message: string };

type D1Response<T> = {
  success: boolean;
  errors: ApiError[];
  result: { results: T[]; success: boolean }[];
};

export async function d1Query<T>(
  sql: string,
  params: (string | number)[] = [],
  init: { cache?: RequestCache; next?: NextFetchRequestConfig } = { cache: "no-store" },
): Promise<T[]> {
  const res = await fetch(`${apiBase()}/d1/database/${env.d1DatabaseId}/query`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params }),
    ...init,
  });
  const data = (await res.json()) as D1Response<T>;
  if (!res.ok || !data.success) {
    throw new Error(`D1 query failed: ${data.errors?.map((e) => e.message).join("; ") || res.status}`);
  }
  return data.result[0]?.results ?? [];
}

const kvValueUrl = (key: string) =>
  `${apiBase()}/storage/kv/namespaces/${env.kvNamespaceId}/values/${encodeURIComponent(key)}`;

async function kvError(action: string, res: Response) {
  const data = (await res.json().catch(() => null)) as { errors?: ApiError[] } | null;
  return new Error(`KV ${action} failed: ${data?.errors?.map((e) => e.message).join("; ") || res.status}`);
}

export async function kvPut(key: string, body: ArrayBuffer) {
  const res = await fetch(kvValueUrl(key), {
    method: "PUT",
    headers: { ...authHeader(), "Content-Type": "application/octet-stream" },
    body,
  });
  if (!res.ok) throw await kvError("upload", res);
}

/** Returns null when the key doesn't exist. */
export async function kvGet(key: string): Promise<ArrayBuffer | null> {
  const res = await fetch(kvValueUrl(key), { headers: authHeader(), cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw await kvError("read", res);
  return res.arrayBuffer();
}

export async function kvDelete(key: string) {
  const res = await fetch(kvValueUrl(key), { method: "DELETE", headers: authHeader() });
  if (!res.ok && res.status !== 404) throw await kvError("delete", res);
}
