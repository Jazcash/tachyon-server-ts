import { DateInterval, generateRandomToken, OAuthClient, OAuthScope, OAuthToken, OAuthTokenRepository, OAuthUser } from "@jmondi/oauth2-server";

import { oauthClientRepository } from "@/auth/client-repository.js";
import { database } from "@/database.js";
import { InsertableTokenRow } from "@/model/db/token.js";

export const oauthTokenRepository: OAuthTokenRepository = {
    async issueToken(client: OAuthClient, scopes: OAuthScope[], user?: OAuthUser | null | undefined): Promise<OAuthToken> {
        return {
            accessToken: generateRandomToken(),
            accessTokenExpiresAt: new DateInterval("10m").getEndDate(),
            refreshToken: null,
            refreshTokenExpiresAt: null,
            client,
            scopes,
            user,
        };
    },
    async issueRefreshToken(token: OAuthToken, client: OAuthClient): Promise<OAuthToken> {
        token.refreshToken = generateRandomToken();
        token.refreshTokenExpiresAt = new DateInterval("100y").getEndDate();
        await database
            .updateTable("token")
            .where("accessToken", "=", token.accessToken)
            .set({
                refreshToken: token.refreshToken,
                refreshTokenExpiresAt: token.refreshTokenExpiresAt,
                updatedAt: new Date(),
            })
            .execute();
        return token;
    },
    async persist(token: OAuthToken): Promise<void> {
        if (!token.user?.id || typeof token.user?.id === "string") {
            // don't need this if the arg type is changed to custom?
            throw new Error("UserId must be of type number | null | undefined, received string");
        }

        const values: InsertableTokenRow = {
            accessToken: token.accessToken,
            accessTokenExpiresAt: token.accessTokenExpiresAt,
            clientId: token.client.id,
            scopes: token.scopes.map((scope) => scope.name),
            refreshToken: token.refreshToken,
            refreshTokenExpiresAt: token.refreshTokenExpiresAt,
            userId: token.user?.id,
            updatedAt: new Date(),
        };

        await database
            .insertInto("token")
            .values(values)
            .onConflict((oc) => oc.doUpdateSet(values))
            .execute();
    },
    async revoke(token: OAuthToken): Promise<void> {
        token.accessTokenExpiresAt = new Date(0);
        token.refreshTokenExpiresAt = new Date(0);
    },
    async revokeDescendantsOf(authCodeId: string): Promise<void> {
        throw new Error("Method not implemented.");
    },
    async isRefreshTokenRevoked(token: OAuthToken): Promise<boolean> {
        if (!token.refreshTokenExpiresAt) {
            return true;
        }
        return new Date() > token.refreshTokenExpiresAt;
    },
    async getByRefreshToken(refreshTokenToken: string): Promise<OAuthToken> {
        const token = await database.selectFrom("token").where("refreshToken", "=", refreshTokenToken).selectAll().executeTakeFirstOrThrow();
        const client = await oauthClientRepository.getByIdentifier(token.clientId);
        return {
            accessToken: token.accessToken,
            accessTokenExpiresAt: token.accessTokenExpiresAt,
            client,
            scopes: token.scopes.map((scope) => ({ name: scope })),
            refreshToken: token.refreshToken,
            refreshTokenExpiresAt: token.refreshTokenExpiresAt,
            user: token.userId ? { id: token.userId } : null,
        };
    },
};
