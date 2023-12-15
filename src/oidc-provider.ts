import Keygrip from "keygrip";
import nodeJose from "node-jose";
import Provider, { AccountClaims, Configuration, JWKS } from "oidc-provider";

import { config } from "@/config.js";
import { database } from "@/database.js";
import { KyselyAdapter } from "@/kysely-adapter.js";

const cookieKeylist = ["verysecretkey1", "verysecretkey2"];
const cookieKeys = Keygrip(cookieKeylist);

const keyStore = nodeJose.JWK.createKeyStore();
await keyStore.generate("RSA", 2048, { alg: "RS256", use: "sig" });

const jwks = keyStore.toJSON(true) as JWKS;

const configuration: Configuration = {
    // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#cookieskeys
    cookies: {
        keys: cookieKeylist,
    },
    // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#jwks
    // https://github.com/destenson/panva--node-oidc-provider/blob/master/docs/keystores.md
    jwks,
    adapter: KyselyAdapter,
    ttl: {
        AccessToken: (ctx, token, client) => token.resourceServer?.accessTokenTTL || 60 * 60, // 1 hour
        IdToken: 3600, // 1 hour
        Interaction: 3600, // 1 hour
        Grant: 1209600, // 14 days
        Session: 1209600, // 14 days
    },
    features: {
        devInteractions: { enabled: false },
        introspection: { enabled: true },
        revocation: { enabled: true },
        clientCredentials: {
            enabled: true,
        },
        resourceIndicators: {},
    },
    clients: [
        {
            client_id: "BAR Lobby",
            client_secret: "fish",
            redirect_uris: ["http://127.0.0.1:3006/cb"],
            grant_types: ["authorization_code"],
            response_types: ["code"],
            scope: "openid email lobby",
        },
    ],
    claims: {
        email: ["email", "email_verified"],
        lobby: ["lobby"],
    },
    async findAccount(context, id) {
        const user = await database.selectFrom("user").where("userId", "=", id).selectAll().executeTakeFirstOrThrow();

        return {
            accountId: user.userId,
            async claims(use, scope) {
                const accountInfo: AccountClaims = {
                    sub: id,
                };

                if (scope) {
                    if (scope.includes("email")) {
                        Object.assign(accountInfo, { email: user.email, email_verified: user.verified });
                    }
                }

                return accountInfo;
            },
        };
    },
    pkce: { required: () => false, methods: ["S256"] },
};

export const oidc = new Provider(`http://localhost:${config.port}`, configuration);
