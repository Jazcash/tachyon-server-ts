import Fastify from "fastify";

import { config } from "@/config.js";

export const fastify = Fastify({
    logger: false,
});

fastify.get("/", async function handler(request, reply) {
    return { hello: "world" };
});

export async function startHttpServer() {
    try {
        await fastify.listen({ port: config.port });
        console.log(`Tachyon HTTP API listening on port ${config.port}!`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

export async function stopHttpServer() {
    await fastify.close();
}
