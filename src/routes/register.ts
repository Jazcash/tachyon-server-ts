import { SqliteError } from "better-sqlite3";
import { FastifyPluginAsync } from "fastify";

import { database } from "@/database.js";
import { UserRow } from "@/model/db/user.js";
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
                    user = await database
                        .insertInto("user")
                        .values({
                            googleId: req.session.googleId,
                            username: req.body.username,
                            displayName: req.body.username,
                        })
                        .returningAll()
                        .executeTakeFirstOrThrow();
                } else if (req.session.steamId) {
                    user = await database
                        .insertInto("user")
                        .values({
                            steamId: req.session.steamId,
                            username: req.body.username,
                            displayName: req.body.username,
                        })
                        .returningAll()
                        .executeTakeFirstOrThrow();
                } else if (req.body.email && req.body.password) {
                    const hashedPassword = await hashPassword(req.body.password);

                    user = await database
                        .insertInto("user")
                        .values({
                            username: req.body.username,
                            email: req.body.email,
                            hashedPassword,
                            displayName: req.body.username,
                        })
                        .returningAll()
                        .executeTakeFirstOrThrow();

                    // TODO: do basic email account verification here if email service is configured and config.accountVerification is true
                } else {
                    throw new Error("Unhandled login strategy");
                }

                req.session.user = user;

                if (!req.session.auth) {
                    return reply.redirect(`/`);
                } else {
                    req.session.auth.user = { id: user!.userId };
                    return reply.redirect(`/authorize`);
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
