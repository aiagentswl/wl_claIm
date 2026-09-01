/**
 * GET /api/avatar?username=someuser
 *
 * Resolves a real X profile picture and returns { profile_image_url }.
 * The frontend already knows how to call this (window.AVATAR_API_ENDPOINT
 * is set to "/api/avatar" in index.html) — no other frontend change needed.
 *
 * Resolution order:
 *   1. If X_BEARER_TOKEN is set (Vercel env var), use the official X API.
 *      This is the most reliable source, but X's API is pay-per-use —
 *      see the deploy guide for current pricing before enabling this.
 *   2. Otherwise, fall back to the free public resolver (unavatar.io),
 *      done server-side so it isn't limited per-visitor.
 * Either way, a generated fallback avatar URL is always returned as a
 * last resort inside the unavatar call, so the frontend never has to
 * show a broken image.
 */
export default async function handler(req, res) {
  const raw = (req.query.username || "").toString().replace("@", "").trim();

  if (!raw || !/^[A-Za-z0-9_]{1,15}$/.test(raw)) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }

  if (process.env.X_BEARER_TOKEN) {
    try {
      const apiRes = await fetch(
        `https://api.x.com/2/users/by/username/${encodeURIComponent(raw)}?user.fields=profile_image_url`,
        { headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` } }
      );
      if (apiRes.ok) {
        const json = await apiRes.json();
        const rawUrl = json && json.data && json.data.profile_image_url;
        if (rawUrl) {
          res.setHeader("Cache-Control", "public, max-age=3600");
          res.status(200).json({ profile_image_url: rawUrl.replace("_normal", "") });
          return;
        }
      }
    } catch (err) {
      console.error("X API resolution error:", err);
      // fall through to the public resolver below
    }
  }

  const fallback = encodeURIComponent(
    `https://ui-avatars.com/api/?name=${encodeURIComponent(raw)}&background=0D1119&color=00FF22&bold=true`
  );
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).json({
    profile_image_url: `https://unavatar.io/x/${raw}?fallback=${fallback}`
  });
}
