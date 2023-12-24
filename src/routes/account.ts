import { FastifyPluginAsync } from "fastify";
import fetch from "node-fetch";
import { AuthorizationParameters, ClientMetadata, generators, Issuer } from "openid-client";

import { config } from "@/config.js";
import { SteamSessionTicketResponse } from "@/model/steam-session-ticket.js";

export const accountRoutes: FastifyPluginAsync = async function (fastify) {
    fastify.get("/auth/login/google", async (req, reply) => {
        const authUrl = await getOpenIdConnectAuthUrl({
            client_id: config.googleClientId,
            client_secret: config.googleClientSecret,
            redirect_uri: "http://127.0.0.1:3006/oauth2callback", // TODO: config this
        });

        reply.redirect(authUrl);
    });

    fastify.post("/auth/token/google", async (req, reply) => {
        //
    });

    // fastify.post("/auth/login/google", async (req, reply) => {
    //     if (req.headers.authorization) {
    //         // const stuff = await fetch("https://www.googleapis.com/userinfo/v2/me", {
    //         //     method: "get",
    //         //     headers: {
    //         //         authorization: req.headers.authorization,
    //         //     },
    //         // });
    //         // const googleUser = await stuff.json();
    //         // reply.send({ thing: googleUser });
    //     } else {
    //         reply.send(400);
    //     }
    // });

    fastify.post("/auth/login/steam", async (req, reply) => {
        if (req.headers.authorization) {
            // const stuff = await fetch("https://www.googleapis.com/userinfo/v2/me", {
            //     method: "get",
            //     headers: {
            //         authorization: req.headers.authorization,
            //     },
            // });
            // const googleUser = await stuff.json();
            // reply.send({ thing: googleUser });
            console.log(req.headers.authorization);
        } else {
            reply.send(400);
        }
    });

    fastify.get<{ Querystring: { ticket: string } }>("/steamauth", async (req, reply) => {
        const { ticket } = req.query;

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

            reply.send(data);
        } catch (err) {
            console.log("error validating steam session token", err);
        }
    });
};

export type getOpenIdConnectAuthUrlOptions = {
    clientId: string;
    clientSecret?: string;
};

async function getOpenIdConnectAuthUrl(
    clientOptions: ClientMetadata,
    authUrlOptions: Partial<AuthorizationParameters> = {}
) {
    const issuer = await Issuer.discover("https://accounts.google.com");

    const client = new issuer.Client({
        response_types: ["code"],
        ...clientOptions,
    });

    const code_verifier = generators.codeVerifier();
    const url = client.authorizationUrl({
        scope: "openid",
        code_challenge: generators.codeChallenge(code_verifier),
        code_challenge_method: "S256",
        ...authUrlOptions,
    });

    return url;
}
