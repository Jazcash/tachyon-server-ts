import { SqliteError } from "better-sqlite3";
import { FastifyPluginAsync } from "fastify";

import { UserRow } from "@/model/db/user.js";
import { userService } from "@/user-service.js";
import { loggedOutOnly } from "@/utils/fastify-login-prevalidation.js";
import { hashPassword } from "@/utils/hash-password.js";

export const registerRoutes: FastifyPluginAsync = async function (fastify, options) {
    fastify.route<{ Querystring: { strategy: "basic" | "google" | "steam" } }>({
        method: "GET",
        url: "/register",
        preValidation: loggedOutOnly,
        handler: async (req, reply) => {
            const collectEmail = !req.query.strategy || req.query.strategy === "basic";
            const collectPassword = !req.query.strategy || req.query.strategy === "basic";

            return reply.view("register", {
                csrfToken: reply.generateCsrf(),
                nonce: reply.cspNonce,
                collectEmail,
                collectPassword,
            });
        },
    });

    fastify.route<{
        Body: {
            username: string;
            email?: string;
            password?: string;
        };
    }>({
        method: "POST",
        url: "/register",
        preValidation: loggedOutOnly,
        handler: async (req, reply) => {
            try {
                let user: UserRow | undefined;

                if (req.session.googleId) {
                    user = await userService.createUser({
                        googleId: req.session.googleId,
                        username: req.body.username,
                        displayName: req.body.username,
                    });
                } else if (req.session.steamId) {
                    user = await userService.createUser({
                        steamId: req.session.steamId,
                        username: req.body.username,
                        displayName: req.body.username,
                    });
                } else if (req.body.email && req.body.password) {
                    const hashedPassword = await hashPassword(req.body.password);

                    user = await userService.createUser({
                        username: req.body.username,
                        email: req.body.email,
                        hashedPassword,
                        displayName: req.body.username,
                    });

                    // TODO: do basic email account verification here if email service is configured and config.accountVerification is true
                } else {
                    throw new Error("Unhandled login strategy");
                }

                req.session.user = user;

                if (!req.session.auth) {
                    reply.redirect(`/`);
                    return reply;
                } else {
                    req.session.auth.user = { id: user!.userId };
                    reply.redirect(`/authorize`);
                    return reply;
                }
            } catch (err) {
                if (err instanceof SqliteError) {
                    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
                        if (err.message.includes("username")) {
                            reply.status(409);
                            return "username_taken";
                        } else if (err.message.includes("email")) {
                            reply.status(409);
                            return "email_taken";
                        }
                    }
                }

                console.error(err);
                reply.status(500);
                return "internal_error";
            }
        },
    });
};
