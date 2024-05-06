import { FastifyPluginAsync } from "fastify";

import { authorizedRoute } from "@/auth/authorized-route.js";

export const logoutRoute: FastifyPluginAsync = async function (fastify, options) {
    fastify.route({
        url: "/logout",
        method: "get",
        preValidation: authorizedRoute,
        handler: async (req, reply) => {
            await req.session.destroy();

            reply.redirect("/");
            return reply;
        },
    });
};
