import { AuthorizationServer, DateInterval, JwtService } from "@jmondi/oauth2-server";

import { oauthAuthCodeRepository } from "@/auth/auth-code-repository.js";
import { oauthClientRepository } from "@/auth/client-repository.js";
import { oauthScopeRepository } from "@/auth/scope-repository.js";
import { oauthTokenRepository } from "@/auth/token-repository.js";
import { oauthUserRepository } from "@/auth/user-repository.js";

// https://jasonraimondi.github.io/ts-oauth2-server/repositories/

export const oauth = new AuthorizationServer(
    oauthClientRepository,
    oauthTokenRepository,
    oauthScopeRepository,
    new JwtService("secret-key"), // TODO,
    {
        requiresPKCE: true,
        requiresS256: true,
    }
);

oauth.enableGrantTypes(
    [
        {
            grant: "authorization_code",
            authCodeRepository: oauthAuthCodeRepository,
            userRepository: oauthUserRepository,
        },
        new DateInterval("1h"),
    ],
    ["refresh_token", new DateInterval("1h")]
);
