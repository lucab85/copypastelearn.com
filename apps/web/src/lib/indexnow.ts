import { serverLogger as logger } from "./logger";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Submit URLs to IndexNow for faster search-engine re-crawling.
 * Requires INDEXNOW_KEY env var to be set. Silently no-ops in dev
 * or when the key is not configured.
 *
 * @see https://www.indexnow.org/documentation
 */
export async function submitToIndexNow(urlPaths: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return; // not configured — skip silently

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";
  const host = new URL(siteUrl).host;

  const urlList = urlPaths.map((p) =>
    p.startsWith("http") ? p : `${siteUrl}${p}`
  );

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${siteUrl}/${key}.txt`,
        urlList,
      }),
    });

    if (res.ok || res.status === 202) {
      logger.info({ urls: urlList.length }, "IndexNow: submitted URLs");
    } else {
      logger.warn(
        { status: res.status, body: await res.text().catch(() => "") },
        "IndexNow: submission failed"
      );
    }
  } catch (error) {
    // Non-critical — don't break the admin action
    logger.warn({ error }, "IndexNow: network error");
  }
}
