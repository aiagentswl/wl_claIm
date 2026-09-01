/**
 * GET /api/config
 *
 * Returns the Firebase client config, built from Vercel Environment
 * Variables instead of a plain committed env.js file.
 *
 * IMPORTANT — read this before assuming this "hides" the key:
 * Firebase's apiKey/authDomain/projectId etc. are CLIENT config, not
 * secrets. The browser has to have them to talk to Firebase, so they
 * will always be visible in the Network tab of anyone who opens dev
 * tools on the live site — that's true no matter how they're deployed,
 * and it's expected/normal for Firebase web apps.
 *
 * What actually changes by moving this here:
 *   - The real values no longer sit in a file inside your Git repo
 *     (useful if the repo is public, or you want different Firebase
 *     projects for staging/production without editing code).
 *   - They're not visible just from "view page source" — someone has
 *     to actually inspect the network requests to find them.
 *
 * What this does NOT do:
 *   - It does not stop anyone from reading these values if they want to.
 *   - It is not a substitute for Firestore Security Rules. The real
 *     access control for your "allowlist" and "meta" collections must
 *     live in Firebase Console → Firestore → Rules (e.g. allow public
 *     reads only where needed, restrict writes to validated shapes,
 *     disallow arbitrary deletes, etc). Lock those down regardless of
 *     where this config file lives.
 */
export default function handler(req, res) {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json({
    apiKey: process.env.FIREBASE_API_KEY || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.FIREBASE_APP_ID || ""
  });
}
