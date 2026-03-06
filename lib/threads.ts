// Threads API uses graph.threads.net, NOT graph.facebook.com
const THREADS_GRAPH_API = "https://graph.threads.net/v1.0";
const THREADS_OAUTH_URL = "https://www.threads.net/oauth/authorize";

interface TokenResult {
  token: string;
  expiresIn: number;
}

// ===== Threads OAuth =====

export function getThreadsOAuthUrl(state: string): string {
  const appId = process.env.THREADS_APP_ID || process.env.META_APP_ID;
  const redirectUri = process.env.THREADS_REDIRECT_URI;
  if (!appId || !redirectUri) throw new Error("THREADS_APP_ID and THREADS_REDIRECT_URI must be set");

  const scopes = [
    "threads_basic",
    "threads_content_publish",
    "threads_read_replies",
    "threads_manage_replies",
  ].join(",");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: "code",
    state,
  });

  return `${THREADS_OAUTH_URL}?${params.toString()}`;
}

export async function exchangeThreadsCode(code: string): Promise<string> {
  const appId = process.env.THREADS_APP_ID || process.env.META_APP_ID;
  const appSecret = process.env.THREADS_APP_SECRET || process.env.META_APP_SECRET;
  const redirectUri = process.env.THREADS_REDIRECT_URI;
  if (!appId || !appSecret || !redirectUri) throw new Error("Threads env vars missing");

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(`${THREADS_GRAPH_API}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Threads token exchange failed: ${err}`);
  }
  const data = await res.json();
  return data.access_token;
}

export async function getThreadsLongLivedToken(shortToken: string): Promise<TokenResult> {
  const appSecret = process.env.THREADS_APP_SECRET || process.env.META_APP_SECRET;
  if (!appSecret) throw new Error("THREADS_APP_SECRET missing");

  const params = new URLSearchParams({
    grant_type: "th_exchange_token",
    client_secret: appSecret,
    access_token: shortToken,
  });

  const res = await fetch(`${THREADS_GRAPH_API}/access_token?${params.toString()}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Threads long-lived token failed: ${err}`);
  }
  const data = await res.json();
  return { token: data.access_token, expiresIn: data.expires_in || 5184000 };
}

export async function refreshThreadsToken(token: string): Promise<TokenResult> {
  const params = new URLSearchParams({
    grant_type: "th_refresh_token",
    access_token: token,
  });

  const res = await fetch(`${THREADS_GRAPH_API}/refresh_access_token?${params.toString()}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Threads token refresh failed: ${err}`);
  }
  const data = await res.json();
  return { token: data.access_token, expiresIn: data.expires_in || 5184000 };
}

// ===== Threads Profile =====

export async function getThreadsProfile(
  token: string
): Promise<{ id: string; username: string }> {
  const res = await fetch(
    `${THREADS_GRAPH_API}/me?fields=id,username&access_token=${token}`
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Threads profile fetch failed: ${err}`);
  }
  const data = await res.json();
  return { id: data.id, username: data.username || "" };
}

// ===== Threads Comment Reply =====

export async function replyToThreadsComment(
  mediaId: string,
  replyToId: string,
  text: string,
  token: string
): Promise<string> {
  // Step 1: Create reply container
  const containerRes = await fetch(`${THREADS_GRAPH_API}/me/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "TEXT",
      text,
      reply_to_id: replyToId,
      access_token: token,
    }),
  });

  if (!containerRes.ok) {
    const err = await containerRes.text();
    throw new Error(`Threads reply container failed: ${err}`);
  }
  const container = await containerRes.json();

  // Step 2: Publish the reply
  const publishRes = await fetch(`${THREADS_GRAPH_API}/me/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: container.id,
      access_token: token,
    }),
  });

  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Threads reply publish failed: ${err}`);
  }
  const published = await publishRes.json();
  return published.id;
}
