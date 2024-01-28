import { FastifyPluginAsync } from "fastify";

import { loggedOutOnly } from "@/utils/fastify-login-prevalidation.js";

export const registerRoutes: FastifyPluginAsync = async function (fastify, options) {
    fastify.route<{ Querystring: { strategy: "basic" | "google" | "steam" } }>({
        method: "GET",
        url: "/register",
        preValidation: loggedOutOnly,
        handler: async (req, reply) => {
            const collectEmail = req.query.strategy === "basic";
            const collectPassword = req.query.strategy === "basic";

            return reply.view("register", {
                csrfToken: reply.generateCsrf(),
                collectEmail,
                collectPassword,
            });
        },
    });

    fastify.route({
        method: "POST",
        url: "/register",
        preValidation: loggedOutOnly,
        handler: async (req, reply) => {
            console.log(req.body);
            return "YEP";
        },
    });
};
