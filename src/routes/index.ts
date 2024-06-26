import { randomUUID } from "crypto";
import { FastifyPluginAsync } from "fastify";

import { authorizedRoute } from "@/auth/authorized-route.js";
import { autohostClientService } from "@/autohost-client-service.js";
import { userClientService } from "@/user-client-service.js";

export const indexRoute: FastifyPluginAsync = async function (fastify, options) {
    fastify.route({
        url: "/",
        method: "get",
        preValidation: authorizedRoute,
        wsHandler: async (ws, req) => {
            try {
                if (req.session.user) {
                    userClientService.addUserClient(ws, {
                        ...req.session.user,
                        ipAddress: req.ip,
                    });
                } else {
                    autohostClientService.addAutohostClient(ws, {
                        autohostId: randomUUID(),
                        ipAddress: req.ip,
                    });
                }
            } catch (err) {
                if (err instanceof Error) {
                    ws.close(4000, err.message);
                }
            }
        },
        handler: async (req, reply) => {
            return reply.view("home", {
                user: req.session.user,
            });
        },
    });
};
