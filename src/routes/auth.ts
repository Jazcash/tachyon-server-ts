import { FastifyPluginAsync } from "fastify";
import fetch from "node-fetch";
import { AuthorizationParameters, generators, Issuer } from "openid-client";

import { config } from "@/config.js";
import { database } from "@/database.js";
import { SteamSessionTicketResponse } from "@/model/steam-session-ticket.js";
import { oauth } from "@/oauth.js";
import { comparePassword } from "@/utils/hash-password.js";

// https://console.cloud.google.com/apis/credentials/oauthclient/1047182426627-sb707ggfiq4bukf7vr69e44el4lmql47.apps.googleusercontent.com?project=bar-lobby
const google = await Issuer.discover("https://accounts.google.com");
export const googleClient = new google.Client({
    client_id: config.googleClientId,
    response_types: ["id_token"],
    redirect_uris: [`http://127.0.0.1:${config.port}/interaction/callback/google`],
});

export const codeVerifier = generators.codeVerifier();

export const authRoutes: FastifyPluginAsync = async function (fastify) {
    // oauth routes based on https://github.com/node-oauth/express-oauth-server/blob/master/examples/postgresql/index.js

    fastify.post("/oauth/token", oauth.token());

    fastify.get<{ Querystring: AuthorizationParameters & { error?: string } }>(
        "/oauth/authorize",
        async (req, reply) => {
            if (!req.user) {
                const url = new URL(req.url, `http://${req.hostname}`);

                url.searchParams.delete("error");

                return reply.view("login", {
                    queryString: url.search,
                    error: req.query.error,
                });
            }

            console.log("User found!");

            //return oauth.authorize();
        }
    );

    fastify.post<{ Querystring: AuthorizationParameters; Body: { email: string; password: string } }>(
        "/oauth/authorize",
        async (req, reply) => {
            const user = await database
                .selectFrom("user")
                .where("email", "=", req.body.email)
                .selectAll()
                .executeTakeFirstOrThrow();

            if (!user.hashedPassword) {
                return reply.send("User exists but has an existing google/steam account");
            }

            const passwordCorrect = await comparePassword(req.body.password, user.hashedPassword);

            if (!passwordCorrect) {
                const url = new URL(req.url, `http://${req.hostname}`);

                return reply.redirect(`/oauth/authorize${url.search}&error=invalid_credentials`);
            }

            req.user = user;
        }
    );

    fastify.get("/login", async (req, reply) => {
        return reply.view("login");
    });

    fastify.post<{ Body: { email: string; password: string } }>("/login", async (req, reply) => {
        try {
            console.log(req.body);

            if (req.body.email && req.body.password) {
                const user = await database
                    .selectFrom("user")
                    .where("email", "=", req.body.email)
                    .selectAll()
                    .executeTakeFirstOrThrow();

                if (!user.hashedPassword) {
                    throw new Error("Hashed password is null");
                }

                const passwordCorrect = await comparePassword(req.body.password, user.hashedPassword);

                if (passwordCorrect) {
                    console.log(req.body);
                    return reply.send("todo");
                } else {
                    throw new Error("Invalid password (probably shouldn't show this kind of message)");
                }
            }
        } catch (err) {
            console.error(err);
            reply.send(err);
        }

        // // Successful logins should send the user back to /oauth/authorize.
        // const path = req.body.redirect || "/";

        // return reply.redirect(`/${path}?client_id=${req.query.client_id}&redirect_uri=${req.query.redirect_uri}`);
    });

    fastify.get("/secret", async (req, reply) => {
        await oauth.authenticate(req, reply);
    });

    fastify.get<{ Querystring: { ticket: string } }>("/steamauth", async (request, reply) => {
        const { ticket } = request.query;

        try {
            const query = new URLSearchParams({
                appid: config.steamAppId,
                key: config.steamWebApiKey,
                ticket,
            }).toString();

            const res = await fetch(`https://api.steampowered.com/ISteamUserAuth/AuthenticateUserTicket/v1?${query}`, {
                method: "GET",
            });

            const data = (await res.json()) as SteamSessionTicketResponse;

            console.log(data);

            reply.send(data);
        } catch (err) {
            console.log("error validating steam session token", err);
        }
    });
};
