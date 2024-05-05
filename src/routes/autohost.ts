import { FastifyPluginAsync } from "fastify";

import { authorizeAutohostSession } from "@/auth/authorize-session.js";

export const autohostRoute: FastifyPluginAsync = async function (fastify, options) {
    fastify.route({
        url: "/autohost",
        method: "get",
        preValidation: authorizeAutohostSession,
        websocket: true,
        handler: async (ws, req) => {
            console.log("autohost connection");
        },
    });
};
