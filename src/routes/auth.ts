import OAuth2Server from "@node-oauth/oauth2-server";
import { FastifyPluginAsync } from "fastify";
import fetch from "node-fetch";
import { generators, Issuer } from "openid-client";

import { config } from "@/config.js";
import { SteamSessionTicketResponse } from "@/model/steam-session-ticket.js";
import { oauth } from "@/oauth.js";

// https://console.cloud.google.com/apis/credentials/oauthclient/1047182426627-sb707ggfiq4bukf7vr69e44el4lmql47.apps.googleusercontent.com?project=bar-lobby
const google = await Issuer.discover("https://accounts.google.com");
export const googleClient = new google.Client({
    client_id: config.googleClientId,
    response_types: ["id_token"],
    redirect_uris: [`http://127.0.0.1:${config.port}/interaction/callback/google`],
});

export const codeVerifier = generators.codeVerifier();

export const authRoutes: FastifyPluginAsync = async function (fastify) {
    fastify.get<{ Querystring: { client_id: string; redirect_uri: string } }>(
        "/oauth/authorize",
        async (req, reply) => {
            if (!req.user) {
                return reply.redirect(
                    `/login?redirect=${req.url}&client_id=${req.query.client_id}&redirect_uri=${req.query.redirect_uri}`
                );
            }

            return reply.view("authorize", {
                client_id: req.query.client_id,
                redirect_uri: req.query.redirect_uri,
            });
        }
    );

    fastify.post<{ Querystring: { client_id: string; redirect_uri: string } }>(
        "/oauth/authorize",
        async (req, reply) => {
            if (!req.user) {
                return reply.redirect(
                    `/login?redirect=${req.url}&client_id=${req.query.client_id}&redirect_uri=${req.query.redirect_uri}`
                );
            }

            const oauthReq = new OAuth2Server.Request(req);
            const oauthRes = new OAuth2Server.Response(reply);
            return oauth.authorize(oauthReq, oauthRes);
        }
    );

    fastify.get<{ Querystring: { client_id: string; redirect_uri: string; redirect: string } }>(
        "/login",
        async (req, reply) => {
            return reply.view("login", {
                redirect: req.query.redirect,
                client_id: req.query.client_id,
                redirect_uri: req.query.redirect_uri,
            });
        }
    );

    fastify.post<{
        Querystring: { client_id: string; redirect_uri: string; redirect: string };
        Body: { email: string; client_id: string; redirect_uri: string; redirect: string };
    }>("/login", function (req, reply) {
        // @TODO: Insert your own login mechanism.
        if (req.body.email !== "test@tachyontest.com") {
            return reply.view("login", {
                redirect: req.body.redirect,
                client_id: req.body.client_id,
                redirect_uri: req.body.redirect_uri,
            });
        }

        // Successful logins should send the user back to /oauth/authorize.
        const path = req.body.redirect || "/";

        return reply.redirect(`/${path}?client_id=${req.query.client_id}&redirect_uri=${req.query.redirect_uri}`);
    });

    fastify.post("/oauth/token", (req, reply) => {
        const oauthReq = new OAuth2Server.Request(req);
        const oauthRes = new OAuth2Server.Response(reply);

        oauth.token(oauthReq, oauthRes);
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

            reply.send(data);
        } catch (err) {
            console.log("error validating steam session token", err);
        }
    });
};
