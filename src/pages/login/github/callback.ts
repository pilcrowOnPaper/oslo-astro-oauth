import { verifyOAuth2State } from "oslo/oauth2";
import { githubAuth } from "../../../lib/github";

import type { APIContext } from "astro";
import { db } from "../../../lib/db";
import { alphabet, generateRandomString } from "oslo/random";
import { sessionController, sessionCookieController } from "../../../lib/auth";

export async function GET(context: APIContext): Promise<Response> {
  const storedState = context.cookies.get("github_state")?.value ?? null;
  const state = context.url.searchParams.get("state");
  const code = context.url.searchParams.get("code");
  context.cookies.set("github_state", "", {
    maxAge: 0,
    httpOnly: true,
    secure: import.meta.env.PROD,
    path: "/",
  });
  if (!verifyOAuth2State(storedState, state) || !code) {
    return new Response(null, {
      status: 400,
    });
  }
  try {
    const tokens = await githubAuth.validateCallback(code);
    const githubUser = await getAuthenticatedGithubUser(tokens.accessToken);
    const existingDatabaseUser = await db
      .selectFrom("user")
      .where("github_id", "=", githubUser.id)
      .select("id")
      .executeTakeFirst();
    let userId: string;
    if (existingDatabaseUser) {
      userId = existingDatabaseUser.id;
    } else {
      userId = generateRandomString(15, alphabet("0-9", "a-z"));
      await db
        .insertInto("user")
        .values({
          id: userId,
          github_id: githubUser.id,
          username: githubUser.login,
        })
        .execute();
    }
    const sessionId = generateRandomString(63, alphabet("0-9", "a-z"));
    const session = sessionController.createSession(sessionId);
    await db
      .insertInto("session")
      .values({
        id: session.sessionId,
        user_id: userId,
        expires: session.expiresAt.toISOString(),
      })
      .execute();
    const cookie = sessionCookieController.createSessionCookie(
      session.sessionId
    );
    context.cookies.set(cookie.name, cookie.value, cookie.attributes);
    return context.redirect("/");
  } catch (e) {
    return new Response(null, {
      status: 400,
    });
  }
}

async function getAuthenticatedGithubUser(
  accessToken: string
): Promise<GithubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return await response.json();
}

interface GithubUser {
  login: string;
  id: number;
}
