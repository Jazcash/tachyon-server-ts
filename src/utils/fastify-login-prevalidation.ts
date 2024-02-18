import { RouteShorthandOptions } from "fastify";

export const loggedInOnly: RouteShorthandOptions["preValidation"] = async (req, reply) => {
    if (!req.session.user) {
        reply.redirect("/login");
    }
};

export const loggedOutOnly: RouteShorthandOptions["preValidation"] = async (req, reply) => {
    if (req.session.user) {
        reply.redirect("/");
    }
};
