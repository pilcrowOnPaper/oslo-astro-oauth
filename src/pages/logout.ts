import { sessionCookieController } from "../lib/auth";
import { db } from "../lib/db";

import type { APIContext } from "astro";

export async function POST(context: APIContext): Promise<Response> {
  if (!context.locals.session) {
    return new Response(null, {
      status: 401,
    });
  }
  await db
    .deleteFrom("session")
    .where("id", "=", context.locals.session.sessionId)
    .execute();
  const cookie = sessionCookieController.createBlankSessionCookie();
  context.cookies.set(cookie.name, cookie.value, cookie.attributes);
  return context.redirect("/login");
}
