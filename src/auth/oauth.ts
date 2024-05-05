import { AuthorizationServer, DateInterval, JwtService, OAuthException, OAuthUser } from "@jmondi/oauth2-server";

import { oauthAuthCodeRepository } from "@/auth/auth-code-repository.js";
import { oauthClientRepository } from "@/auth/client-repository.js";
import { oauthScopeRepository } from "@/auth/scope-repository.js";
import { oauthTokenRepository } from "@/auth/token-repository.js";
import { oauthUserRepository } from "@/auth/user-repository.js";
import { authenticateSteamTicket } from "@/steam.js";
import { userService } from "@/user-service.js";
import { getSignSecret } from "@/utils/get-sign-secret.js";

// https://jasonraimondi.github.io/ts-oauth2-server/repositories/

const signSecret = await getSignSecret();
export const jwtService = new JwtService(signSecret);

export const oauth = new AuthorizationServer(oauthClientRepository, oauthTokenRepository, oauthScopeRepository, jwtService, {
    requiresPKCE: true,
    requiresS256: true,
});

oauth.enableGrantTypes(
    [
        {
            grant: "authorization_code",
            authCodeRepository: oauthAuthCodeRepository,
            userRepository: oauthUserRepository,
        },
        new DateInterval("1h"),
    ],
    ["refresh_token", new DateInterval("1h")],
    ["client_credentials", new DateInterval("1h")]
);

oauth.enableGrantType({
    grant: "urn:ietf:params:oauth:grant-type:token-exchange",
    processTokenExchange: async (args): Promise<OAuthUser | undefined> => {
        try {
            const { resource, audience, scopes, requestedTokenType, subjectToken, subjectTokenType, actorToken, actorTokenType } = args;

            const steamTicketValidationResponse = await authenticateSteamTicket(subjectToken);

            const user = await userService.getUserBySteamId(steamTicketValidationResponse.steamId);

            if (!user) {
                throw new Error("user_not_found");
            }

            return { id: user.userId };
        } catch (err) {
            if (err instanceof Error) {
                if (err.message === "steam:session_ticket_missing") {
                    throw OAuthException.invalidParameter("subject_token", err.message);
                } else if (err.message === "steam:invalid_parameter") {
                    throw OAuthException.badRequest(err.message);
                } else if (err.message === "steam:invalid_session_ticket") {
                    throw OAuthException.accessDenied(err.message);
                } else if (err.message === "steam:banned") {
                    throw OAuthException.accessDenied(err.message);
                } else {
                    throw OAuthException.internalServerError(err.message);
                }
            }

            throw OAuthException.internalServerError("Unhandled Steam authentication error");
        }
    },
});
