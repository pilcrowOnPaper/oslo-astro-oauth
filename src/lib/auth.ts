import { SessionController } from "oslo/session";
import { TimeSpan } from "oslo";
import { db } from "./db";

import type { Session as OsloSession } from "oslo/session";
import type { APIContext } from "astro";

export interface User {
  userId: string;
  githubUserId: number;
  username: string;
}

export interface Session extends OsloSession {
  user: User;
}

export const sessionController = new SessionController(new TimeSpan(30, "d"));
export const sessionCookieController = sessionController.sessionCookie({
  name: "session",
  secure: import.meta.env.PROD,
});

export async function validateSession(
  context: APIContext
): Promise<Session | null> {
  const sessionId =
    context.cookies.get(sessionCookieController.cookieName)?.value ?? null;
  if (!sessionId) return null;
  const databaseSessionAndUser = await db
    .selectFrom("session")
    .innerJoin("user", "user.id", "session.user_id")
    .where("session.id", "=", sessionId)
    .select([
      "session.id as session_id",
      "session.expires as session_expires",
      "user.id as user_id",
      "user.username",
      "user.github_id",
    ])
    .executeTakeFirst();
  if (!databaseSessionAndUser) {
    const cookie = sessionCookieController.createBlankSessionCookie();
    context.cookies.set(cookie.name, cookie.value, cookie.attributes);
    return null;
  }
  const session = sessionController.validateSessionState(
    databaseSessionAndUser.session_id,
    new Date(databaseSessionAndUser.session_expires)
  );
  if (!session) {
    const cookie = sessionCookieController.createBlankSessionCookie();
    context.cookies.set(cookie.name, cookie.value, cookie.attributes);
    return null;
  }
  if (session.fresh) {
    await db
      .updateTable("session")
      .set({
        expires: session.expiresAt.toISOString(),
      })
      .where("session.id", "=", session.sessionId)
      .execute();
    const cookie = sessionCookieController.createSessionCookie(
      session.sessionId
    );
    context.cookies.set(cookie.name, cookie.value, cookie.attributes);
  }
  const user = {
    userId: databaseSessionAndUser.user_id,
    githubUserId: databaseSessionAndUser.github_id,
    username: databaseSessionAndUser.username,
  };
  return {
    ...session,
    user,
  };
}
