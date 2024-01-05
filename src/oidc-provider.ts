import Keygrip from "keygrip";
import nodeJose from "node-jose";
import Provider, { AccountClaims, Configuration, JWKS } from "oidc-provider";
import { generators, Issuer } from "openid-client";

import { config } from "@/config.js";
import { database } from "@/database.js";
import { KyselyAdapter } from "@/kysely-adapter.js";

/**
 * https://dev.to/ebrahimmfadae/develop-an-openid-server-with-nodejs-typescript-9n1
 * https://www.scottbrady91.com/openid-connect/getting-started-with-oidc-provider
 */

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
        resourceIndicators: {
            enabled: true,
            async getResourceServerInfo(ctx, resourceIndicator) {
                if (resourceIndicator === "urn:api") {
                    return {
                        scope: "read",
                        audience: "urn:api",
                        accessTokenTTL: 1 * 60 * 60, // 1 hour
                        accessTokenFormat: "jwt",
                    };
                }

                throw new Error("Invalid target?");
            },
        },
    },
    clients: [
        {
            client_id: "BAR Lobby",
            client_secret: "fish",
            redirect_uris: ["http://127.0.0.1:3006/oauth2callback"],
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
        const user = await database
            .selectFrom("user")
            .where("userId", "=", parseInt(id))
            .selectAll()
            .executeTakeFirstOrThrow();

        return {
            accountId: user.userId.toString(),
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

export const oidc = new Provider(`http://127.0.0.1:${config.port}`, configuration);

oidc.proxy = true;

// Google stuff
// https://console.cloud.google.com/apis/credentials/oauthclient/1047182426627-sb707ggfiq4bukf7vr69e44el4lmql47.apps.googleusercontent.com?project=bar-lobby

export const googleRedirectUrl = `http://127.0.0.1:${config.port}/interaction/callback/google`;

const google = await Issuer.discover("https://accounts.google.com/.well-known/openid-configuration");
export const googleClient = new google.Client({
    client_id: config.googleClientId,
    //client_secret: config.googleClientSecret,
    response_types: ["id_token"],
    redirect_uris: [googleRedirectUrl],
});

export const codeVerifier = generators.codeVerifier();
