import OAuth2Server from "@node-oauth/oauth2-server";

import { database } from "@/database.js";

export const oauth = new OAuth2Server({
    model: {
        async getAccessToken(accessToken) {
            const token = await database
                .selectFrom("oauthToken")
                .where("accessToken", "=", accessToken)
                .selectAll()
                .executeTakeFirst();

            if (!token) {
                return;
            }

            const user = await database
                .selectFrom("user")
                .where("userId", "=", token.userId)
                .selectAll()
                .executeTakeFirst();

            if (!user) {
                return;
            }

            return {
                accessToken: token.accessToken,
                accessTokenExpiresAt: token.accessTokenExpiry,
                refreshToken: token.refreshToken,
                refreshTokenExpiresAt: token.refreshTokenExpiry,
                client: {
                    id: token.clientId,
                    grants: ["authorization_code", "refresh_token"],
                    redirectUris: ["http://127.0.0.1:3006/oauth2callback"],
                },
                user: user,
            };
        },
        async getClient(clientId, clientSecret) {
            return {
                id: "BAR Lobby",
                grants: ["authorization_code", "refresh_token"],
                redirectUris: ["http://127.0.0.1:3006/oauth2callback"],
            };
        },
        async getRefreshToken(refreshToken) {
            const token = await database
                .selectFrom("oauthToken")
                .where("refreshToken", "=", refreshToken)
                .selectAll()
                .executeTakeFirst();

            if (!token) {
                return;
            }

            const user = await database
                .selectFrom("user")
                .where("userId", "=", token.userId)
                .selectAll()
                .executeTakeFirst();

            if (!user) {
                return;
            }

            return {
                refreshToken: token.refreshToken,
                refreshTokenExpiresAt: token.refreshTokenExpiry,
                client: {
                    id: token.clientId,
                    grants: ["authorization_code", "refresh_token"],
                    redirectUris: ["http://127.0.0.1:3006/oauth2callback"],
                },
                user: user,
            };
        },
        async getUser(username, password, client) {
            const user = await database.selectFrom("user").where("email", "=", username).selectAll().executeTakeFirst();

            // TODO: validate password??

            return user;
        },
        async saveToken(token, client, user) {
            await database
                .insertInto("oauthToken")
                .values({
                    accessToken: token.accessToken,
                    accessTokenExpiry: token.accessTokenExpiresAt!,
                    refreshToken: token.refreshToken!,
                    refreshTokenExpiry: token.refreshTokenExpiresAt!,
                    clientId: token.client.id,
                    userId: user.userId,
                })
                .executeTakeFirstOrThrow();

            return token;
        },
    },
});

// fastify.post("/oauth/token", (req, reply) => {
//     const oauthReq = new OAuth2Server.Request(req);
//     const oauthRes = new OAuth2Server.Response(reply);

//     oauth.token(oauthReq, oauthRes);
// });

// // fastify.get<{ Querystring: { client_id: string; redirect_uri: string } }>("/oauth/authorize", async (req, reply) => {
// //     if (!req.user) {
// //         return reply.redirect(
// //             `/login?redirect=${req.routerPath}&client_id=${req.query.client_id}&redirect_uri=${req.query.redirect_uri}`
// //         );
// //     }

// //     return reply.view("authorize", {
// //         client_id: req.query.client_id,
// //         redirect_uri: req.query.redirect_uri,
// //     });
// // });

// fastify.post("/oauth/authorize", async (req, reply) => {
//     //
// });

// fastify.get("/login", async (req, reply) => {
//     return reply.view("home", {});
// });

// fastify.get("/secret", async (req, reply) => {
//     const oauthReq = new OAuth2Server.Request(req);
//     const oauthRes = new OAuth2Server.Response(reply);
//     const auth = await oauth.authenticate(oauthReq, oauthRes);

//     if (auth) {
//         // Will require a valid access_token.
//         reply.send("Secret area");
//     } else {
//         reply.send("nope");
//     }
// });
