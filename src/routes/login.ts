import { FastifyPluginAsync } from "fastify";

import { database } from "@/database.js";
import { loggedOutOnly } from "@/utils/fastify-login-prevalidation.js";
import { comparePassword } from "@/utils/hash-password.js";

export const loginRoutes: FastifyPluginAsync = async function (fastify, options) {
    fastify.route({
        method: "GET",
        url: "/login",
        preValidation: loggedOutOnly,
        handler: async (req, reply) => {
            return reply.view("login", {
                csrfToken: reply.generateCsrf(),
            });
        },
    });

    fastify.route<{ Body: { email: string; password: string } }>({
        method: "POST",
        url: "/login",
        preValidation: loggedOutOnly,
        handler: async (req, reply) => {
            const { email, password } = req.body;

            const user = await database.selectFrom("user").where("email", "=", email).selectAll().executeTakeFirstOrThrow();
            if (!user.email || !user.hashedPassword) {
                throw new Error("invalid_login");
            }
            const passwordValid = await comparePassword(password, user.hashedPassword);
            if (!passwordValid) {
                throw new Error("invalid_login");
            }

            req.session.user = user;

            if (!req.session.auth) {
                return reply.redirect(`/`);
            }

            req.session.auth.user = { id: user.userId };

            reply.redirect(`/authorize`);
        },
    });

    // fastify.route<{ Params: { uid: string } }>({
    //     method: "GET",
    //     url: "/login/google",
    //     handler: async (req, reply) => {
    //         // const nonce = randomBytes(32).toString("hex");
    //         // const state = `${req.params.uid}|${nonce}`;
    //         // //const path = `/interaction/${req.params.uid}/google`;
    //         // const authUrl = googleClient.authorizationUrl({
    //         //     state,
    //         //     nonce,
    //         //     scope: "openid",
    //         // });
    //         // return (
    //         //     reply
    //         //         //.setCookie("google.state", state, { path, sameSite: "strict" })
    //         //         //.setCookie("google.nonce", nonce, { path, sameSite: "strict" })
    //         //         .redirect(303, authUrl)
    //         // );
    //     },
    // });

    fastify.route<{ Params: { uid: string } }>({
        method: "GET",
        url: "/login/google/callback",
        handler: async (req, reply) => {
            const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

            console.log(token.access_token);

            // if later you need to refresh the token you can use
            // const { token: newToken } = await this.getNewAccessTokenUsingRefreshToken(token)

            reply.send({ access_token: token.access_token });
        },
    });
};
