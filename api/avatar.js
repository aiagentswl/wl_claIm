/**
 * GET /api/avatar?username=someuser
 *
 * Resolves a real X profile picture and returns { profile_image_url }.
 *
 * ROOT CAUSE OF THE "picture never loads" BUG (found this round):
 * The previous version asked unavatar.io for the image directly with a
 * `?fallback=<generated-avatar-url>` parameter. When unavatar can't
 * resolve a real photo for an account (X blocks a lot of fresh/lesser-known
 * lookups), it doesn't error out — it silently serves the *fallback* image
 * bytes back with a normal 200 OK. To a browser (or our old Image() probe)
 * that looks exactly like a successful real-photo load, so the generated
 * initials avatar kept showing even though the code was "working".
 *
 * THE FIX: ask unavatar for JSON first (`?json&fallback=false`), which
 * reports `status: "success"` only when it actually found a real photo,
 * and a clean failure otherwise instead of silently substituting anything.
 * Only on a confirmed "success" do we hand back the real image URL — so
 * the frontend can no longer mistake a fallback for a real photo.
 */
export default async function handler(req, res) {
  const raw = (req.query.username || "").toString().replace("@", "").trim();

  if (!raw || !/^[A-Za-z0-9_]{1,15}$/.test(raw)) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }

  // 1) Official X API, if you've configured a bearer token — most reliable
  //    source, and not subject to a public proxy's resolution limits.
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
          res.status(200).json({ profile_image_url: rawUrl.replace("_normal", ""), source: "x-api" });
          return;
        }
      }
    } catch (err) {
      console.error("X API resolution error:", err);
      // fall through
    }
  }

  // 2) Public resolver (unavatar.io) — verify via JSON before trusting it.
  try {
    const checkRes = await fetch(`https://unavatar.io/x/${encodeURIComponent(raw)}?json&fallback=false`);
    const checkJson = await checkRes.json().catch(() => null);

    if (checkRes.ok && checkJson && checkJson.status === "success") {
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.status(200).json({
        profile_image_url: `https://unavatar.io/x/${encodeURIComponent(raw)}?fallback=false`,
        source: "unavatar"
      });
      return;
    }
  } catch (err) {
    console.error("unavatar resolution check error:", err);
    // fall through
  }

  // 3) Neither source could confirm a real photo — return a generated
  //    avatar explicitly, so the frontend knows this is a placeholder
  //    (not a broken image, and not mistaken for a real photo).
  res.setHeader("Cache-Control", "public, max-age=1800");
  res.status(200).json({
    profile_image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(raw)}&background=0D1119&color=00FF22&bold=true`,
    source: "generated"
  });
}
