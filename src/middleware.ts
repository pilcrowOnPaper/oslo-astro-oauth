import { defineMiddleware } from "astro:middleware";
import { validateSession } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const session = await validateSession(context);
  context.locals.session = session;
  return next();
});
