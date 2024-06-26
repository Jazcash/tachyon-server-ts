import { FastifyPluginAsync } from "fastify";
import SteamAuth from "node-steam-openid";

import { unauthorizedRoute } from "@/auth/unauthorized-route.js";
import { config } from "@/config.js";
import { database } from "@/database.js";
import { UserRow } from "@/model/db/user.js";
import { userService } from "@/user-service.js";
import { comparePassword } from "@/utils/hash-password.js";

export const loginRoutes: FastifyPluginAsync = async function (fastify, options) {
    fastify.route({
        method: "GET",
        url: "/login",
        preValidation: unauthorizedRoute,
        handler: async (req, reply) => {
            return reply.view("login", {
                csrfToken: reply.generateCsrf(),
            });
        },
    });

    fastify.route<{ Body: { usernameOrEmail: string; password: string } }>({
        method: "POST",
        url: "/login",
        preValidation: unauthorizedRoute,
        handler: async (req, reply) => {
            try {
                const { usernameOrEmail, password } = req.body;

                let user: UserRow;
                if (usernameOrEmail.includes("@")) {
                    user = await database.selectFrom("user").where("email", "=", usernameOrEmail).selectAll().executeTakeFirstOrThrow();
                } else {
                    user = await database.selectFrom("user").where("username", "=", usernameOrEmail).selectAll().executeTakeFirstOrThrow();
                }

                if (!user.hashedPassword) {
                    reply.status(401);
                    console.log("no password");
                    return "invalid_login";
                }

                const passwordValid = await comparePassword(password, user.hashedPassword);
                if (!passwordValid) {
                    reply.status(401);
                    console.log("bad password");
                    return "invalid_login";
                }

                req.session.user = user;

                if (!req.session.auth) {
                    reply.redirect(`/`);
                    return reply;
                }

                req.session.auth.user = { id: user.userId };

                reply.redirect(`/authorize`);
                return reply;
            } catch (err) {
                reply.status(401);
                console.error(err);
                return "invalid_login";
            }
        },
    });

    fastify.route({
        method: "GET",
        url: "/login/google/callback",
        handler: async (req, reply) => {
            const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

            const userInfo = (await fastify.googleOAuth2.userinfo(token)) as { sub: string; picture: string };

            req.session.googleId = userInfo.sub;

            const user = await userService.getUserByGoogleId(userInfo.sub);

            if (!user) {
                reply.redirect("/register?strategy=google");
                return reply;
            } else {
                req.session.user = user;

                if (!req.session.auth) {
                    reply.redirect(`/`);
                    return reply;
                }

                req.session.auth.user = { id: user.userId };

                reply.redirect(`/authorize`);
                return reply;
            }
        },
    });

    const steam = new SteamAuth({
        apiKey: config.steamWebApiKey,
        realm: `http://${config.host}:${config.port}/`,
        returnUrl: `http://${config.host}:${config.port}/login/steam/callback`,
    });

    fastify.route({
        method: "GET",
        url: "/login/steam",
        handler: async (req, reply) => {
            const redirectUrl = await steam.getRedirectUrl();
            reply.redirect(redirectUrl);
            return reply;
        },
    });

    fastify.route({
        method: "GET",
        url: "/login/steam/callback",
        handler: async (req, reply) => {
            const userInfo = await steam.authenticate(req);

            req.session.steamId = userInfo.steamid;

            const user = await userService.getUserBySteamId(userInfo.steamid);

            if (!user) {
                reply.redirect("/register?strategy=steam");
                return reply;
            } else {
                req.session.user = user;

                if (!req.session.auth) {
                    reply.redirect(`/`);
                    return reply;
                }

                req.session.auth.user = { id: user.userId };

                reply.redirect(`/authorize`);
                return reply;
            }
        },
    });
};
