import { OAuthException } from "@jmondi/oauth2-server";
import { RouteShorthandOptions } from "fastify";

import { jwtService } from "@/auth/oauth.js";
import { autohostService } from "@/autohost-service.js";
import { database } from "@/database.js";
import { TokenRow } from "@/model/db/token.js";
import { JWTToken } from "@/model/jwt-token.js";
import { userService } from "@/user-service.js";

export const authorizedRoute: RouteShorthandOptions["preValidation"] = async (req, reply) => {
    console.log("cooL");

    try {
        if (req.session.user) {
            return;
        }

        if (!req.headers.authorization) {
            reply.redirect("/login");
            return;
        }

        const [authKey, authValue] = req.headers.authorization.split(" ");
        if (authKey !== "Bearer" || !authValue) {
            throw new Error("invalid_authorization_header");
        }

        const token = await getAccessToken(authValue);

        if (token.scopes.includes("tachyon.autohost")) {
            const autohost = await autohostService.getAutohostById(token.autohostId);
            return;
        }

        if (!token.scopes.includes("tachyon.lobby")) {
            reply.code(401);
            throw new Error("missing_scope: tachyon.lobby");
        }

        if (!token.userId) {
            reply.code(401);
            throw new Error("missing_user_id");
        }

        const user = await userService.getUserById(token.userId);
        req.session.user = user;
    } catch (err) {
        req.session.user = undefined;
        throw err;
    }
};

export async function getAccessToken(encodedToken: string): Promise<TokenRow> {
    if (!encodedToken) {
        throw OAuthException.badRequest("missing_token");
    }

    let decodedToken: JWTToken;

    try {
        decodedToken = jwtService.decode(encodedToken) as JWTToken;
        if (!decodedToken || typeof decodedToken !== "object") {
            throw new Error(`couldn't decode token: ${encodedToken}`);
        }
    } catch (err) {
        console.error(err);
        throw OAuthException.badRequest("invalid_token");
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
