import fastifyCookie from "@fastify/cookie";
import { fastifyFormbody } from "@fastify/formbody";
import fastifyMiddie from "@fastify/middie";
import fastifySession from "@fastify/session";
import { fastifyView } from "@fastify/view";
import chalk from "chalk";
import ejs from "ejs";
import Fastify from "fastify";

import { config } from "@/config.js";
import { accountRoutes } from "@/routes/account.js";

export const fastify = Fastify({
    logger: false,
});

await fastify.register(fastifyMiddie);
await fastify.register(fastifyFormbody);
await fastify.register(fastifyView, { engine: { ejs } });
await fastify.register(fastifyCookie);
await fastify.register(fastifySession, { secret: "a secret with minimum length of 32 characters" }); // TODO: generate secret

// await setupPassport();

// routes
await fastify.register(accountRoutes);

fastify.get("/", async (request, reply) => {
    return reply.view("/src/views/index.ejs", { title: "Tachyon Server" });
});

export async function startHttpServer() {
    try {
        await fastify.listen({ port: config.port });
        console.log(chalk.green(`Tachyon HTTP API listening on http://127.0.0.1:${config.port}`));
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

export async function stopHttpServer() {
    await fastify.close();
}
