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
        if (typeof identifier === "string") {
            // don't need this if the arg type is changed to custom?
            throw new Error("UserId must be of type number, received string");
        }

        const user = await database.selectFrom("user").where("userId", "=", identifier).selectAll().executeTakeFirst();

        if (!user) {
            return;
        }

        if (password && user.hashedPassword) {
            await comparePassword(password, user.hashedPassword);
        }

        return {
            id: user.userId,
        };
    },
};
