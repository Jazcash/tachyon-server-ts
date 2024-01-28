import { FastifyPluginAsync } from "fastify";

export const homeRoute: FastifyPluginAsync = async function (fastify, options) {
    fastify.route({
        url: "/",
        method: "get",
        handler: async (req, reply) => {
            return reply.view("home", {
                user: req.session.user,
            });
        },
    });
};
