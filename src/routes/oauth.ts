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

                if (!req.session.auth.user && !req.session.user) {
                    reply.redirect(`/login`);
                    return reply;
                } else if (!req.session.auth.user && req.session.user) {
                    req.session.auth.user = { id: req.session.user.userId };
                }

                if (!req.session.auth.isAuthorizationApproved) {
                    reply.redirect("/consent");
                    return reply;
                }

                const oauthResponse = await oauth.completeAuthorizationRequest(req.session.auth);

                req.session.auth = undefined;

                handleFastifyReply(reply, oauthResponse);
                return reply;
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

            reply.view("consent", {
                csrfToken: reply.generateCsrf(),
                user: req.session.auth.user,
                client: req.session.auth.client,
                scopes: req.session.auth.scopes,
            });
            return reply;
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
                req.session.auth = undefined;
                return "Auth abandoned";
            }

            reply.redirect("/authorize");
            return reply;
        },
    });

    fastify.route({
        method: "POST",
        url: "/token",
        handler: async (req, reply) => {
            try {
                const request = requestFromFastify(req);
                const oauthResponse = await oauth.respondToAccessTokenRequest(request);
                handleFastifyReply(reply, oauthResponse);
                return reply;
            } catch (err) {
                if (err instanceof Error && err.message === "user_not_found") {
                    reply.status(401);
                    // return {
                    //     statusCode: 401,
                    //     error: "complete_steam_registration",
                    //     message:
                    // }
                    // TODO: generate unique, unguessable url for user to complete steam registration?
                }

                handleFastifyError(err, reply);
            }
        },
    });
};
