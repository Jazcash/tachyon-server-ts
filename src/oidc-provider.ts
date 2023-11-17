import Provider, { Configuration } from "oidc-provider";

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
            client_id: "foo",
            client_secret: "bar",
            redirect_uris: ["https://oidcdebugger.com/debug"],
            grant_types: ["authorization_code"],
            //grant_types: ["authorization_code"],
            response_types: ["code"],
            scope: "openid",
            //grant_types: ["client_credentials"],
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

export const oidc = new Provider("http://localhost:3005", configuration);
