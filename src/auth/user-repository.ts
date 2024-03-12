import { GrantIdentifier, OAuthClient, OAuthUser, OAuthUserIdentifier, OAuthUserRepository } from "@jmondi/oauth2-server";

import { database } from "@/database.js";
import { comparePassword } from "@/utils/hash-password.js";

export const oauthUserRepository: OAuthUserRepository = {
    async getUserByCredentials(
        identifier: OAuthUserIdentifier,
        password?: string | undefined,
        grantType?: GrantIdentifier | undefined,
        client?: OAuthClient | undefined
    ): Promise<OAuthUser | undefined> {
        if (typeof identifier !== "string") {
            throw new Error(`userId must be of type string, got ${typeof identifier}`);
        }

        const user = await database.selectFrom("user").where("userId", "=", identifier).selectAll().executeTakeFirst();

        if (!user) {
            return;
        }

        if (password && user.hashedPassword) {
            const validPassword = await comparePassword(password, user.hashedPassword);
            if (!validPassword) {
                throw new Error("invalid_authentication_credentials");
            }
        }

        return {
            id: user.userId,
        };
    },
};
