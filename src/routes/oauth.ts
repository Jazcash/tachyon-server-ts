import { handleFastifyError, handleFastifyReply, requestFromFastify } from "@jmondi/oauth2-server/fastify";
import { FastifyPluginAsync } from "fastify";

import { oauth } from "@/auth/oauth.js";

// https://jasonraimondi.github.io/ts-oauth2-server/grants/authorization_code.html

export const oauthRoutes: FastifyPluginAsync = async function (fastify, options) {
    fastify.route({
        method: "GET",
        url: "/authorize",
        handler: async (req, reply) => {
            try {
                if (typeof req.query === "object" && req.query !== null && "client_id" in req.query) {
                    const genericRequest = requestFromFastify(req);
                    req.session.auth = await oauth.validateAuthorizationRequest(genericRequest);
                } else if (!req.session.auth) {
                    throw new Error("Missing auth params");
                }

                if (!req.session.auth.user) {
                    return reply.redirect(`/login`);
                }

                if (!req.session.auth.isAuthorizationApproved) {
                    reply.redirect("/consent");
                    return;
                }

                const oauthResponse = await oauth.completeAuthorizationRequest(req.session.auth);

                delete req.session.auth;

                return handleFastifyReply(reply, oauthResponse);
            } catch (e) {
                handleFastifyError(e, reply);
            }
        },
    });

    fastify.route({
        method: "GET",
        url: "/consent",
        handler: async (req, reply) => {
            if (!req.session.auth) {
                throw new Error("Missing auth params");
            }

            return reply.view("consent", {
                csrfToken: reply.generateCsrf(),
                user: req.session.auth.user,
                client: req.session.auth.client,
                scopes: req.session.auth.scopes,
            });
        },
    });

    fastify.route<{ Body: { action: "yes" | "no" } }>({
        method: "POST",
        url: "/consent",
        handler: async (req, reply) => {
            if (!req.session.auth) {
                throw new Error("Missing auth params");
            }

            req.session.auth.isAuthorizationApproved = req.body.action === "yes";

            if (!req.session.auth.isAuthorizationApproved) {
                delete req.session.auth;
                return reply.send("Auth abandoned");
            }

            return reply.redirect("/authorize");
        },
    });

    fastify.route({
        method: "POST",
        url: "/token",
        handler: async (req, reply) => {
            try {
                const request = requestFromFastify(req);
                const oauthResponse = await oauth.respondToAccessTokenRequest(request);
                return handleFastifyReply(reply, oauthResponse);
            } catch (e) {
                return handleFastifyError(e, reply);
            }
        },
    });
};
