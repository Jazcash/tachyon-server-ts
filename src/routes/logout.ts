import { FastifyPluginAsync } from "fastify";

import { loggedInOnly } from "@/utils/fastify-login-prevalidation.js";

export const logoutRoute: FastifyPluginAsync = async function (fastify, options) {
    fastify.route({
        url: "/logout",
        method: "get",
        preValidation: loggedInOnly,
        handler: async (req, reply) => {
            await req.session.destroy();

            reply.redirect("/");
        },
    });
};
