import {
    AbstractAuthorizedGrant,
    DateInterval,
    GrantIdentifier,
    OAuthClient,
    OAuthException,
    OAuthUser,
    RequestInterface,
    ResponseInterface,
} from "@jmondi/oauth2-server";
import fetch from "node-fetch";

import { oauthClientRepository } from "@/auth/client-repository.js";
import { jwtService } from "@/auth/oauth.js";
import { oauthScopeRepository } from "@/auth/scope-repository.js";
import { oauthTokenRepository } from "@/auth/token-repository.js";
import { config } from "@/config.js";
import { UserRow } from "@/model/db/user.js";
import { SteamSessionTicketResponse } from "@/model/steam.js";
import { getSteamPlayerSummaries } from "@/steam.js";
import { userService } from "@/user-service.js";

// steam token exchange using https://datatracker.ietf.org/doc/html/rfc8693
// https://github.com/jasonraimondi/ts-oauth2-server/issues/111

export class SteamGrant extends AbstractAuthorizedGrant {
    identifier: GrantIdentifier = "authorization_code";

    async respondToAccessTokenRequest(req: RequestInterface): Promise<ResponseInterface> {
        const client = await this.validateClient(req);

        const bodyScopes = this.getRequestParameter("scope", req, []);

        const validScopes = await this.validateScopes(bodyScopes);

        const steamTicketValidationResponse = await this.authenticateSteamTicket(this.getRequestParameter("subject_token", req));

        if (steamTicketValidationResponse === "steam_session_ticket_missing") {
            throw OAuthException.invalidParameter("subject_token", "Missing steam session ticket");
        } else if (steamTicketValidationResponse === "steam_auth_error") {
            throw OAuthException.accessDenied("Steam authentication error");
        } else if (steamTicketValidationResponse === "steam_banned") {
            throw OAuthException.accessDenied("Steam account banned");
        } else if (typeof steamTicketValidationResponse !== "object") {
            throw OAuthException.internalServerError("Steam authentication error");
        }

        let user: UserRow | undefined;
        user = await userService.getUserBySteamId(steamTicketValidationResponse.steamId);

        if (!user) {
            const steamInfo = await getSteamPlayerSummaries(steamTicketValidationResponse.steamId);

            user = await userService.createUser({
                steamId: steamTicketValidationResponse.steamId,
                username: steamInfo.personaname, // TODO: this should be required as part of the signup flow because it's not guaranteed to be unique
                displayName: steamInfo.personaname,
            });
        }

        const oauthUser: OAuthUser = { id: user.userId };

        const accessTokenTTL = new DateInterval("1h");

        const accessToken = await this.issueAccessToken(accessTokenTTL, client, oauthUser, validScopes);

        return await this.makeBearerTokenResponse(client, accessToken, validScopes);
    }

    protected async authenticateSteamTicket(
        ticket: string
    ): Promise<{ steamId: string } | "steam_banned" | "steam_session_ticket_missing" | "steam_auth_error"> {
        try {
            if (!ticket) {
                return "steam_session_ticket_missing";
            }

            const query = new URLSearchParams({
                appid: config.steamAppId.toString(),
                key: config.steamWebApiKey,
                ticket,
            }).toString();

            const res = await fetch(`https://api.steampowered.com/ISteamUserAuth/AuthenticateUserTicket/v1?${query}`, {
                method: "GET",
            });

            const data = (await res.json()) as SteamSessionTicketResponse;

            if ("error" in data.response) {
                console.error(data.response.error.errordesc);
                return "steam_auth_error";
            } else {
                if (data.response.params.vacbanned || data.response.params.publisherbanned) {
                    return "steam_banned";
                }

                return {
                    steamId: data.response.params.steamid,
                };
            }
        } catch (error) {
            console.error(error);
            return "steam_auth_error";
        }
    }

    protected async validateClient(request: RequestInterface): Promise<OAuthClient> {
        const [clientId, clientSecret] = this.getClientCredentials(request);

        const client = await this.clientRepository.getByIdentifier(clientId);

        const userValidationSuccess = await this.clientRepository.isClientValid("authorization_code", client, clientSecret);

        if (!userValidationSuccess) {
            throw OAuthException.invalidClient();
        }

        return client;
    }
}

// this is a hacky singleton export because the oauth server library doesn't support the token exchange grant and does not allow us to create custom grants
export const steamGrant = new SteamGrant(oauthClientRepository, oauthTokenRepository, oauthScopeRepository, jwtService, {
    requiresPKCE: false,
    requiresS256: false,
    notBeforeLeeway: 0,
    tokenCID: "id",
});
