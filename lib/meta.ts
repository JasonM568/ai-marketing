const META_GRAPH_API = "https://graph.facebook.com/v21.0";
const META_OAUTH_URL = "https://www.facebook.com/v21.0/dialog/oauth";

interface PageInfo {
  id: string;
  name: string;
  accessToken: string;
  category: string;
}

interface TokenResult {
  token: string;
  expiresIn: number;
}

// ===== OAuth =====

export function getMetaOAuthUrl(state: string): string {
  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;
  if (!appId || !redirectUri) throw new Error("META_APP_ID and META_REDIRECT_URI must be set");

  const scopes = [
    "pages_show_list",
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_manage_engagement",
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_comments",
  ].join(",");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: "code",
    state,
  });

  return `${META_OAUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;
  if (!appId || !appSecret || !redirectUri) throw new Error("Meta env vars missing");

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(`${META_GRAPH_API}/oauth/access_token?${params.toString()}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to exchange code: ${err}`);
  }
  const data = await res.json();
  return data.access_token;
}

export async function getLongLivedToken(shortToken: string): Promise<TokenResult> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Meta env vars missing");

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  });

  const res = await fetch(`${META_GRAPH_API}/oauth/access_token?${params.toString()}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get long-lived token: ${err}`);
  }
  const data = await res.json();
  return {
    token: data.access_token,
    expiresIn: data.expires_in || 5184000, // default 60 days
  };
}

export async function refreshToken(token: string): Promise<TokenResult> {
  // Long-lived user tokens can be refreshed using the same exchange endpoint
  return getLongLivedToken(token);
}

// ===== Pages & Accounts =====

export async function getPageTokens(userToken: string): Promise<PageInfo[]> {
  const res = await fetch(
    `${META_GRAPH_API}/me/accounts?fields=id,name,access_token,category&access_token=${userToken}`
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get pages: ${err}`);
  }
  const data = await res.json();
  return (data.data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    accessToken: p.access_token,
    category: p.category,
  }));
}

export async function getInstagramAccountId(
  pageId: string,
  pageToken: string
): Promise<{ igUserId: string; igUsername: string } | null> {
  const res = await fetch(
    `${META_GRAPH_API}/${pageId}?fields=instagram_business_account{id,username}&access_token=${pageToken}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.instagram_business_account) return null;
  return {
    igUserId: data.instagram_business_account.id,
    igUsername: data.instagram_business_account.username || "",
  };
}

export async function getThreadsUserId(userToken: string): Promise<{ threadsId: string; threadsUsername: string } | null> {
  const res = await fetch(
    `${META_GRAPH_API}/me/threads?fields=id,username&access_token=${userToken}`
  );
  if (!res.ok) {
    // Try direct user endpoint for Threads
    const res2 = await fetch(
      `${META_GRAPH_API}/me?fields=id,name&access_token=${userToken}`
    );
    if (!res2.ok) return null;
    const data2 = await res2.json();
    return { threadsId: data2.id, threadsUsername: data2.name || "" };
  }
  const data = await res.json();
  if (!data.data || data.data.length === 0) return null;
  return {
    threadsId: data.data[0].id,
    threadsUsername: data.data[0].username || "",
  };
}

// ===== Posting =====

export async function postToFacebook(
  pageId: string,
  pageToken: string,
  content: string,
  imageUrl?: string
): Promise<string> {
  let url: string;
  let body: Record<string, string>;

  if (imageUrl) {
    url = `${META_GRAPH_API}/${pageId}/photos`;
    body = { message: content, url: imageUrl, access_token: pageToken };
  } else {
    url = `${META_GRAPH_API}/${pageId}/feed`;
    body = { message: content, access_token: pageToken };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`FB post failed: ${err}`);
  }
  const data = await res.json();
  return data.id || data.post_id;
}

export async function postToInstagram(
  igUserId: string,
  token: string,
  content: string,
  imageUrl?: string
): Promise<string> {
  if (!imageUrl) {
    throw new Error("Instagram posts require an image URL");
  }

  // Step 1: Create media container
  const containerRes = await fetch(`${META_GRAPH_API}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption: content,
      access_token: token,
    }),
  });

  if (!containerRes.ok) {
    const err = await containerRes.text();
    throw new Error(`IG container creation failed: ${err}`);
  }
  const container = await containerRes.json();

  // Step 2: Publish
  const publishRes = await fetch(`${META_GRAPH_API}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: container.id,
      access_token: token,
    }),
  });

  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`IG publish failed: ${err}`);
  }
  const published = await publishRes.json();
  return published.id;
}

export async function postToThreads(
  threadsUserId: string,
  token: string,
  content: string,
  imageUrl?: string
): Promise<string> {
  // Threads uses graph.threads.net, NOT graph.facebook.com
  // Threads API requires form-encoded params (not JSON body) for access_token
  const THREADS_API = "https://graph.threads.net/v1.0";

  // Step 1: Create threads media container
  const containerParams = new URLSearchParams({
    text: content,
    media_type: imageUrl ? "IMAGE" : "TEXT",
    access_token: token,
  });
  if (imageUrl) {
    containerParams.set("image_url", imageUrl);
  }

  const containerRes = await fetch(`${THREADS_API}/${threadsUserId}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: containerParams.toString(),
  });

  if (!containerRes.ok) {
    const err = await containerRes.text();
    throw new Error(`Threads container creation failed: ${err}`);
  }
  const container = await containerRes.json();

  // Step 2: Publish
  const publishParams = new URLSearchParams({
    creation_id: container.id,
    access_token: token,
  });

  const publishRes = await fetch(`${THREADS_API}/${threadsUserId}/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: publishParams.toString(),
  });

  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Threads publish failed: ${err}`);
  }
  const published = await publishRes.json();
  return published.id;
}

// ===== Comment Replies =====

export async function replyToFacebookComment(
  commentId: string,
  pageToken: string,
  message: string
): Promise<string> {
  const res = await fetch(`${META_GRAPH_API}/${commentId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: pageToken }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`FB comment reply failed: ${err}`);
  }
  const data = await res.json();
  return data.id;
}

export async function replyToInstagramComment(
  commentId: string,
  token: string,
  message: string
): Promise<string> {
  const res = await fetch(`${META_GRAPH_API}/${commentId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: token }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`IG comment reply failed: ${err}`);
  }
  const data = await res.json();
  return data.id;
}
