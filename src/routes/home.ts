import { FastifyPluginAsync } from "fastify";

import { loggedInOnly } from "@/utils/fastify-login-prevalidation.js";

export const homeRoute: FastifyPluginAsync = async function (fastify, options) {
    fastify.route({
        url: "/",
        method: "get",
        preValidation: loggedInOnly,
        handler: async (req, reply) => {
            return reply.view("home", {
                user: req.session.user,
            });
        },
    });
};
