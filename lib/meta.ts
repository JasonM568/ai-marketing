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
  imageUrls?: string[]
): Promise<string> {
  // No images — text-only post
  if (!imageUrls || imageUrls.length === 0) {
    const res = await fetch(`${META_GRAPH_API}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, access_token: pageToken }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`FB post failed: ${err}`);
    }
    const data = await res.json();
    return data.id || data.post_id;
  }

  // Single image — simple photo post
  if (imageUrls.length === 1) {
    const res = await fetch(`${META_GRAPH_API}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, url: imageUrls[0], access_token: pageToken }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`FB post failed: ${err}`);
    }
    const data = await res.json();
    return data.id || data.post_id;
  }

  // Multiple images — upload as unpublished photos, then create feed post with attached_media
  const photoIds: string[] = [];
  for (const url of imageUrls) {
    const res = await fetch(`${META_GRAPH_API}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, published: false, access_token: pageToken }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`FB unpublished photo upload failed: ${err}`);
    }
    const data = await res.json();
    photoIds.push(data.id);
  }

  // Create feed post with attached_media
  const feedBody: Record<string, any> = {
    message: content,
    access_token: pageToken,
  };
  photoIds.forEach((id, i) => {
    feedBody[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
  });

  const res = await fetch(`${META_GRAPH_API}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedBody),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`FB multi-photo post failed: ${err}`);
  }
  const data = await res.json();
  return data.id || data.post_id;
}

export async function postToInstagram(
  igUserId: string,
  token: string,
  content: string,
  imageUrls?: string[]
): Promise<string> {
  if (!imageUrls || imageUrls.length === 0) {
    throw new Error("Instagram posts require at least one image URL");
  }

  // Single image — standard image post
  if (imageUrls.length === 1) {
    const containerRes = await fetch(`${META_GRAPH_API}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrls[0],
        caption: content,
        access_token: token,
      }),
    });
    if (!containerRes.ok) {
      const err = await containerRes.text();
      throw new Error(`IG container creation failed: ${err}`);
    }
    const container = await containerRes.json();

    const publishRes = await fetch(`${META_GRAPH_API}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: container.id, access_token: token }),
    });
    if (!publishRes.ok) {
      const err = await publishRes.text();
      throw new Error(`IG publish failed: ${err}`);
    }
    const published = await publishRes.json();
    return published.id;
  }

  // Multiple images — carousel post (2-10 images)
  if (imageUrls.length > 10) {
    throw new Error("Instagram carousel supports up to 10 images");
  }

  // Step 1: Create individual image containers (no caption on children)
  const childIds: string[] = [];
  for (const url of imageUrls) {
    const res = await fetch(`${META_GRAPH_API}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: url,
        is_carousel_item: true,
        access_token: token,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`IG carousel item creation failed: ${err}`);
    }
    const data = await res.json();
    childIds.push(data.id);
  }

  // Step 2: Create carousel container
  const carouselRes = await fetch(`${META_GRAPH_API}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "CAROUSEL",
      caption: content,
      children: childIds,
      access_token: token,
    }),
  });
  if (!carouselRes.ok) {
    const err = await carouselRes.text();
    throw new Error(`IG carousel container creation failed: ${err}`);
  }
  const carousel = await carouselRes.json();

  // Step 3: Publish carousel
  const publishRes = await fetch(`${META_GRAPH_API}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: carousel.id, access_token: token }),
  });
  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`IG carousel publish failed: ${err}`);
  }
  const published = await publishRes.json();
  return published.id;
}

export async function postToThreads(
  threadsUserId: string,
  token: string,
  content: string,
  imageUrls?: string[]
): Promise<string> {
  // Threads uses graph.threads.net, NOT graph.facebook.com
  const THREADS_API = "https://graph.threads.net/v1.0";

  // No images or single image — standard post
  if (!imageUrls || imageUrls.length <= 1) {
    const containerParams = new URLSearchParams({
      text: content,
      media_type: imageUrls && imageUrls.length === 1 ? "IMAGE" : "TEXT",
      access_token: token,
    });
    if (imageUrls && imageUrls.length === 1) {
      containerParams.set("image_url", imageUrls[0]);
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

  // Multiple images — carousel post
  if (imageUrls.length > 10) {
    throw new Error("Threads carousel supports up to 10 images");
  }

  // Step 1: Create individual image containers
  const childIds: string[] = [];
  for (const url of imageUrls) {
    const params = new URLSearchParams({
      media_type: "IMAGE",
      image_url: url,
      is_carousel_item: "true",
      access_token: token,
    });
    const res = await fetch(`${THREADS_API}/${threadsUserId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Threads carousel item creation failed: ${err}`);
    }
    const data = await res.json();
    childIds.push(data.id);
  }

  // Step 2: Create carousel container
  const carouselParams = new URLSearchParams({
    media_type: "CAROUSEL",
    text: content,
    children: childIds.join(","),
    access_token: token,
  });
  const carouselRes = await fetch(`${THREADS_API}/${threadsUserId}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: carouselParams.toString(),
  });
  if (!carouselRes.ok) {
    const err = await carouselRes.text();
    throw new Error(`Threads carousel container creation failed: ${err}`);
  }
  const carousel = await carouselRes.json();

  // Step 3: Publish
  const publishParams = new URLSearchParams({
    creation_id: carousel.id,
    access_token: token,
  });
  const publishRes = await fetch(`${THREADS_API}/${threadsUserId}/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: publishParams.toString(),
  });
  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Threads carousel publish failed: ${err}`);
  }
  const published = await publishRes.json();
  return published.id;
}

// ===== Fetch Comments (Graph API polling) =====

export interface FetchedComment {
  id: string;
  message: string;
  from?: { id: string; name: string };
  created_time?: string;
  parent?: { id: string };
}

/**
 * Fetch comments on a Facebook Page post
 * GET /{post-id}/comments?fields=id,message,from,created_time,parent
 */
export async function getFacebookPostComments(
  postId: string,
  pageToken: string,
  limit: number = 50
): Promise<FetchedComment[]> {
  const params = new URLSearchParams({
    fields: "id,message,from,created_time,parent",
    limit: String(limit),
    access_token: pageToken,
  });

  const res = await fetch(`${META_GRAPH_API}/${postId}/comments?${params.toString()}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`FB fetch comments failed: ${err}`);
  }
  const data = await res.json();
  return data.data || [];
}

/**
 * Fetch all recent posts from a Facebook Page (for "all" monitor mode)
 * GET /{page-id}/feed?fields=id,message,created_time
 */
export async function getFacebookPagePosts(
  pageId: string,
  pageToken: string,
  limit: number = 10
): Promise<{ id: string; message?: string; created_time?: string }[]> {
  const params = new URLSearchParams({
    fields: "id,message,created_time",
    limit: String(limit),
    access_token: pageToken,
  });

  const res = await fetch(`${META_GRAPH_API}/${pageId}/feed?${params.toString()}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`FB fetch page posts failed: ${err}`);
  }
  const data = await res.json();
  return data.data || [];
}

export interface IGFetchedComment {
  id: string;
  text: string;
  username?: string;
  from?: { id: string };
  timestamp?: string;
  parent_id?: string;
}

/**
 * Fetch comments on an Instagram media
 * GET /{media-id}/comments?fields=id,text,username,from,timestamp
 */
export async function getInstagramMediaComments(
  mediaId: string,
  token: string,
  limit: number = 50
): Promise<IGFetchedComment[]> {
  const params = new URLSearchParams({
    fields: "id,text,username,from,timestamp",
    limit: String(limit),
    access_token: token,
  });

  const res = await fetch(`${META_GRAPH_API}/${mediaId}/comments?${params.toString()}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`IG fetch comments failed: ${err}`);
  }
  const data = await res.json();
  return data.data || [];
}

/**
 * Fetch recent media from an Instagram business account (for "all" monitor mode)
 * GET /{ig-user-id}/media?fields=id,caption,timestamp
 */
export async function getInstagramUserMedia(
  igUserId: string,
  token: string,
  limit: number = 10
): Promise<{ id: string; caption?: string; timestamp?: string }[]> {
  const params = new URLSearchParams({
    fields: "id,caption,timestamp",
    limit: String(limit),
    access_token: token,
  });

  const res = await fetch(`${META_GRAPH_API}/${igUserId}/media?${params.toString()}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`IG fetch media failed: ${err}`);
  }
  const data = await res.json();
  return data.data || [];
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
