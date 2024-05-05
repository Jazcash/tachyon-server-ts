import { RouteShorthandOptions } from "fastify";

import { authorizeUserSession } from "@/auth/authorize-session.js";

export const loggedInOnly: RouteShorthandOptions["preValidation"] = async (req, reply) => {
    if (!req.session.user) {
        if (req.headers.authorization) {
            await authorizeUserSession(req);
        } else {
            reply.redirect("/login");
        }
    }
};

export const loggedOutOnly: RouteShorthandOptions["preValidation"] = async (req, reply) => {
    if (req.session.user) {
        reply.redirect("/");
    }
};
