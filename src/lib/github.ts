import { GitHub } from "oslo/oauth2/providers";

export const githubAuth = new GitHub({
    clientId: import.meta.env.GITHUB_CLIENT_ID ?? "",
    clientSecret: import.meta.env.GITHUB_CLIENT_SECRET ?? "",
})