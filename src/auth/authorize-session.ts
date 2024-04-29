import { OAuthException } from "@jmondi/oauth2-server";
import { FastifyRequest } from "fastify";

import { jwtService } from "@/auth/oauth.js";
import { database } from "@/database.js";
import { TokenRow } from "@/model/db/token.js";
import { userService } from "@/user-service.js";

type JWTToken = {
    client_id?: string;
    user_id?: string;
    expires_at?: number;
    scope?: string;
    access_token_id?: string;
    refresh_token_id?: string;
    iat?: number;
    jti?: string;
};

export async function authorizeSession(req: FastifyRequest) {
    try {
        if (!req.headers.authorization) {
            throw new Error("authorization_header_missing");
        }

        const [authKey, authValue] = req.headers.authorization.split(" ");

        if (authKey === "Bearer" && authValue) {
            const token = await getAccessToken(authValue);

            const user = await userService.getUserById(token.userId);
            if (!user) {
                throw new Error("user_not_found");
            }

            req.session.user = user;
        } else {
            throw new Error("invalid_authorization_header");
        }
    } catch (err) {
        req.session.user = undefined;
        throw err;
    }
}

export async function getAccessToken(encodedToken: string): Promise<TokenRow> {
    if (!encodedToken) {
        throw OAuthException.badRequest("missing_token");
    }

    let decodedToken: JWTToken;

    try {
        decodedToken = jwtService.decode(encodedToken) as JWTToken;
    } catch (err) {
        console.error(err);
        throw OAuthException.badRequest("error_decoding_token");
    }

    if (decodedToken.refresh_token_id) {
        const token = await database.selectFrom("token").where("refreshToken", "=", decodedToken.refresh_token_id).selectAll().executeTakeFirst();
        if (!token) {
            throw OAuthException.badRequest("invalid_refresh_token");
        }
        if (token.refreshTokenExpiresAt && token.refreshTokenExpiresAt < new Date()) {
            throw OAuthException.badRequest("refresh_token_expired");
        }
        return token;
    } else if (decodedToken.access_token_id || decodedToken.jti) {
        const token = await database
            .selectFrom("token")
            .where("accessToken", "=", decodedToken.access_token_id || decodedToken.jti!)
            .selectAll()
            .executeTakeFirst();
        if (!token) {
            throw OAuthException.badRequest("invalid_access_token");
        }
        if (token.accessTokenExpiresAt && token.accessTokenExpiresAt < new Date()) {
            throw OAuthException.badRequest("access_token_expired");
        }
        return token;
    }

    throw OAuthException.internalServerError("unknown_server_token_error");
}
