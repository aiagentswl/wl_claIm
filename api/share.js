/**
 * GET /share/:username  (rewritten to /api/share?u=:username by vercel.json)
 * Optional query: ?e=entryNumber
 *
 * This is what makes a shared tweet show a personalized preview instead
 * of the plain homepage card. X's crawler reads the OG tags below without
 * running any JavaScript, so it sees the personalized title. A real human
 * who clicks the link gets redirected straight to the site (with ?ref=
 * preserved, so referral tracking still works).
 */
const SITE_URL = "https://www.mrstonk.work";
const OG_IMAGE = "https://raw.githubusercontent.com/aiagentswl/aiagentswl.github.io/main/asset/icon.png"; // swap for a proper 1200x630 banner image if you have one

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

export default function handler(req, res) {
  const username = (req.query.u || "").toString().replace("@", "").trim();
  const entry = (req.query.e || "").toString().trim();

  if (!username) {
    res.writeHead(302, { Location: SITE_URL });
    res.end();
    return;
  }

  const title = entry
    ? `@${username} just secured Mr.Stonk Early Access — Entry #${entry}`
    : `@${username} just joined the Mr.Stonk Early Access allowlist`;
  const description = "Join the official Mr.Stonk early access allowlist — verify your X account and register your wallet.";
  const redirectTo = `${SITE_URL}/?ref=${encodeURIComponent(username)}`;
  const canonical = `${SITE_URL}/share/${encodeURIComponent(username)}${entry ? `?e=${encodeURIComponent(entry)}` : ""}`;

  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${safeTitle}</title>
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Mr.Stonk" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:image" content="${OG_IMAGE}" />
<meta property="og:url" content="${canonical}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
<meta name="twitter:image" content="${OG_IMAGE}" />
<meta http-equiv="refresh" content="0;url=${redirectTo}" />
<script>window.location.replace(${JSON.stringify(redirectTo)});</script>
</head>
<body>
Redirecting to <a href="${redirectTo}">Mr.Stonk</a>&hellip;
</body>
</html>`);
}
