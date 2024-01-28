import { FastifyPluginAsync } from "fastify";

export const logoutRoute: FastifyPluginAsync = async function (fastify, options) {
    fastify.route({
        url: "/logout",
        method: "get",
        handler: async (req, reply) => {
            if (req.session.user) {
                req.session.destroy((err) => {
                    if (err) {
                        reply.status(500);
                        return "Internal Server Error";
                    } else {
                        reply.redirect("/");
                    }
                });
            } else {
                reply.redirect("/");
            }
        },
    });
};
