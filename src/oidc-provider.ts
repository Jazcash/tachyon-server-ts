import Provider, { Configuration } from "oidc-provider";

import { config } from "@/config.js";

const configuration: Configuration = {
    features: {
        devInteractions: { enabled: true },
        introspection: { enabled: true },
        revocation: { enabled: true },
        clientCredentials: {
            enabled: true,
        },
    },
    clients: [
        {
            client_id: "lobby",
            //client_secret: "",
            redirect_uris: ["https://oidcdebugger.com/debug"],
            grant_types: ["authorization_code"],
            //grant_types: ["client_credentials"],
            response_types: ["code"],
            scope: "openid lobby",
        },
    ],
    async findAccount(context, id) {
        return {
            accountId: id,
            async claims(use, scope) {
                return {
                    sub: id,
                };
            },
        };
    },
    pkce: { required: () => false, methods: ["S256"] },
};

export const oidc = new Provider(`http://localhost:${config.port}`, configuration);
