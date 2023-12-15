import { fastifyFormbody } from "@fastify/formbody";
import fastifyMiddie from "@fastify/middie";
import { fastifyView } from "@fastify/view";
import chalk from "chalk";
import ejs from "ejs";
import Fastify from "fastify";

import { config } from "@/config.js";
import { oidc } from "@/oidc-provider.js";
import { accountRoutes } from "@/routes/account.js";
import { interactionRoutes } from "@/routes/interaction.js";

export const fastify = Fastify({
    logger: false,
});

oidc.proxy = true;

await fastify.register(fastifyMiddie);
await fastify.register(fastifyFormbody);
await fastify.register(fastifyView, { engine: { ejs } });

await fastify.use("/oidc", oidc.callback());

// routes
await fastify.register(accountRoutes);
await fastify.register(interactionRoutes);

fastify.get("/", async (request, reply) => {
    return reply.view("/src/views/index.ejs", { title: "Tachyon Server" });
});

export async function startHttpServer() {
    try {
        await fastify.listen({ port: config.port });
        console.log(chalk.green(`Tachyon HTTP API listening on http://localhost:${config.port}`));
        console.log(
            chalk.green(`OpenID Connect config: http://localhost:${config.port}/oidc/.well-known/openid-configuration`)
        );
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

export async function stopHttpServer() {
    await fastify.close();
}
