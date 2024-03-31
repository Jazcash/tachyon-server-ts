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
};

export async function authorizeSession(req: FastifyRequest) {
    try {
        if (!req.headers.authorization) {
            throw new Error("authorization_header_missing");
        }

        const [authKey, authValue] = req.headers.authorization.split(" ");

        if (authKey === "Bearer") {
            const token = await getAccessToken(authValue);
            if (!token) {
                throw new Error("access_token_not_found");
            }

            const user = await userService.getUserById(token.userId);
            if (!user) {
                throw new Error("user_not_found");
            }

            req.session.user = user;
        } else {
            throw new Error("invalid_authorization_header");
        }
    } catch (err) {
        console.error(err);
        req.session.user = undefined;
        throw new Error("unknown_server_error");
    }
}

export async function getAccessToken(encodedToken: string): Promise<TokenRow | undefined> {
    const decodedToken = jwtService.decode(encodedToken) as JWTToken;

    if (decodedToken.refresh_token_id) {
        return await database.selectFrom("token").where("refreshToken", "=", decodedToken.refresh_token_id).selectAll().executeTakeFirst();
    } else if (decodedToken.access_token_id) {
        return await database.selectFrom("token").where("accessToken", "=", decodedToken.access_token_id).selectAll().executeTakeFirst();
    }

    throw new Error("No token found");

    // if (token.expiresAt < new Date()) {
    //     throw new Error("Token expired");
    // }
}
