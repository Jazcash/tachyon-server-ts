import { GrantIdentifier, OAuthClient, OAuthClientRepository, OAuthException } from "@jmondi/oauth2-server";

import { database } from "@/database.js";

// TODO: new clients shouldn't be hardcoded here, provide web interface to manage them
await database
    .insertInto("client")
    .values([
        {
            clientId: "tachyon_client",
            name: "Tachyon Client",
            allowedGrants: ["authorization_code", "refresh_token", "urn:ietf:params:oauth:grant-type:token-exchange"],
            redirectUris: ["http://127.0.0.1/oauth2callback"],
            scopes: ["tachyon.lobby"],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            clientId: "tachyon_autohost_1",
            clientSecret: "123",
            name: "Tachyon Autohost 1",
            allowedGrants: ["client_credentials"],
            redirectUris: [],
            scopes: ["tachyon.autohost"],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ])
    .onConflict((oc) => oc.doNothing())
    .execute();

export const oauthClientRepository: OAuthClientRepository = {
    async getByIdentifier(clientId: string): Promise<OAuthClient> {
        const client = await database.selectFrom("client").where("clientId", "=", clientId).selectAll().executeTakeFirst();
        if (!client) {
            throw OAuthException.invalidClient("Invalid clientId");
        }
        return {
            id: client.clientId,
            secret: client.clientSecret,
            name: client.name,
            allowedGrants: client.allowedGrants,
            redirectUris: client.redirectUris,
            scopes: client.scopes.map((scope) => ({ name: scope })),
        };
    },
    async isClientValid(grantType: GrantIdentifier, client: OAuthClient, clientSecret?: string | undefined): Promise<boolean> {
        if (client.secret && client.secret !== clientSecret) {
            return false;
        }
        return client.allowedGrants.includes(grantType);
    },
};
