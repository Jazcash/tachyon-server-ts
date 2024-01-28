import { Issuer } from "openid-client";

import { config } from "@/config.js";

export const googleRedirectUrl = `http://127.0.0.1:${config.port}/interaction/callback/google`;

const googleAuth = await Issuer.discover("https://accounts.google.com");
export const googleClient = new googleAuth.Client({
    client_id: config.googleClientId,
    client_secret: config.googleClientSecret,
    response_types: ["code"],
    redirect_uris: [googleRedirectUrl],
});
