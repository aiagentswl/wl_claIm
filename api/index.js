/**
 * GET /?ref=username  — but ONLY reached by link-preview crawlers
 * (Twitterbot, Discordbot, Slackbot, etc.) via the vercel.json rewrite;
 * real visitors always get the actual static index.html, unchanged.
 *
 * X (and Discord/Slack/etc.) read OG tags from the raw HTML without
 * running JavaScript, so this is what makes a shared referral link
 * unfurl as "@username invited you..." instead of the generic site
 * card. It's the same URL a real person would click (mrstonk.work/?ref=
 * username) — this function is a decoration layer only for crawlers,
 * not a separate page real users ever see.
 */
const SITE_URL = "https://www.mrstonk.work";
const OG_IMAGE = "https://raw.githubusercontent.com/aiagentswl/aiagentswl.github.io/main/asset/icon.png"; // swap for a proper 1200x630 banner image if you have one

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

export default function handler(req, res) {
  const ref = (req.query.ref || "").toString().replace("@", "").trim();

  const title = ref
    ? `@${ref} invited you to the Mr.Stonk Early Access allowlist`
    : "Mr.Stonk // Early Access Allowlist";
  const description = "Join the official Mr.Stonk early access allowlist — verify your X account and register your wallet.";
  const pageUrl = ref ? `${SITE_URL}/?ref=${encodeURIComponent(ref)}` : `${SITE_URL}/`;

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
<meta property="og:url" content="${pageUrl}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
<meta name="twitter:image" content="${OG_IMAGE}" />
</head>
<body></body>
</html>`);
}
