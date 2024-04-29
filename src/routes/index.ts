import { FastifyPluginAsync } from "fastify";

import { userClientService } from "@/user-client-service.js";
import { loggedInOnly } from "@/utils/fastify-login-prevalidation.js";

export const indexRoute: FastifyPluginAsync = async function (fastify, options) {
    fastify.route({
        url: "/",
        method: "get",
        preValidation: loggedInOnly,
        wsHandler: async (ws, req) => {
            if (req.session.user) {
                userClientService.addUserClient(ws, {
                    ...req.session.user,
                    ipAddress: req.ip,
                });
            } else {
                throw new Error("no user");
            }
        },
        handler: async (req, reply) => {
            return reply.view("home", {
                user: req.session.user,
            });
        },
    });
};
