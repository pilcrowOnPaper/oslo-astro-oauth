import { githubAuth } from "../../../lib/github";

import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
  const [url, state] = await githubAuth.createAuthorizationURL();
  context.cookies.set("github_state", state, {
    httpOnly: true,
    maxAge: 60 * 60,
    secure: import.meta.env.PROD,
    path: "/",
  });
  return context.redirect(url.href);
}
