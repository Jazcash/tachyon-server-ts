import { GrantIdentifier, OAuthClient, OAuthClientRepository } from "@jmondi/oauth2-server";

export const oauthClients: OAuthClient[] = [
    {
        id: "tachyon_client",
        secret: null,
        name: "Tachyon Client",
        allowedGrants: ["authorization_code", "refresh_token"],
        redirectUris: ["http://127.0.0.1:3006/oauth2callback"],
        scopes: [{ name: "tachyon.lobby" }],
    },
];

export const oauthClientRepository: OAuthClientRepository = {
    async getByIdentifier(clientId: string): Promise<OAuthClient> {
        const client = oauthClients.find((client) => client.id === clientId);
        if (!client) {
            throw new Error(`Could not find valid client with client_id ${clientId}`);
        }
        return client;
    },
    async isClientValid(grantType: GrantIdentifier, client: OAuthClient, clientSecret?: string | undefined): Promise<boolean> {
        if (client.secret && client.secret !== clientSecret) {
            return false;
        }
        return client.allowedGrants.includes(grantType);
    },
};
