import { DateInterval, generateRandomToken, OAuthAuthCode, OAuthAuthCodeRepository, OAuthClient, OAuthScope, OAuthUser } from "@jmondi/oauth2-server";

import { oauthClientRepository } from "@/auth/client-repository.js";
import { database } from "@/database.js";

export const oauthAuthCodeRepository: OAuthAuthCodeRepository = {
    async getByIdentifier(authCodeCode: string): Promise<OAuthAuthCode> {
        const authCodeRow = await database.selectFrom("authCode").where("code", "=", authCodeCode).selectAll().executeTakeFirstOrThrow();
        const client = await oauthClientRepository.getByIdentifier(authCodeRow.clientId);
        return {
            ...authCodeRow,
            client,
            scopes: authCodeRow.scopes.map((scope) => ({ name: scope })),
        };
    },
    async issueAuthCode(client: OAuthClient, user: OAuthUser | undefined | null, scopes: OAuthScope[]): Promise<OAuthAuthCode> {
        return {
            redirectUri: null,
            code: generateRandomToken(),
            codeChallenge: null,
            codeChallengeMethod: "S256",
            expiresAt: new DateInterval("10m").getEndDate(),
            client,
            user,
            scopes,
        };
    },
    async persist(authCode: OAuthAuthCode): Promise<void> {
        if (typeof authCode.user?.id === "string") {
            // don't need this if the arg type is changed to custom?
            throw new Error("UserId must be of type number | null | undefined, received string");
        }

        await database
            .insertInto("authCode")
            .values({
                clientId: authCode.client.id,
                code: authCode.code,
                expiresAt: authCode.expiresAt,
                scopes: authCode.scopes.map((scope) => scope.name),
                userId: authCode.user?.id,
                codeChallenge: authCode.codeChallenge,
                codeChallengeMethod: authCode.codeChallengeMethod,
                redirectUri: authCode.redirectUri,
            })
            .onConflict((oc) =>
                oc.doUpdateSet({
                    updatedAt: new Date(),
                })
            )
            .execute();
    },
    async isRevoked(authCodeCode: string): Promise<boolean> {
        const authCode = await this.getByIdentifier(authCodeCode);
        return new Date() > authCode.expiresAt;
    },
    async revoke(authCodeCode: string): Promise<void> {
        await database
            .updateTable("authCode")
            .where("code", "=", authCodeCode)
            .set({
                expiresAt: new Date(0),
                updatedAt: new Date(),
            })
            .execute();
    },
};
