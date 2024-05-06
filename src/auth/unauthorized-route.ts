import { RouteShorthandOptions } from "fastify";

export const unauthorizedRoute: RouteShorthandOptions["preValidation"] = async (req, reply) => {
    if (req.session.user) {
        reply.redirect("/");
    }
};
