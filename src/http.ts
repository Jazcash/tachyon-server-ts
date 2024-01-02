import fastifyCookie from "@fastify/cookie";
import { fastifyFormbody } from "@fastify/formbody";
import fastifyHelmet from "@fastify/helmet";
import fastifyMiddie from "@fastify/middie";
import fastifySession from "@fastify/session";
import { fastifyView } from "@fastify/view";
import chalk from "chalk";
import ejs from "ejs";
import Fastify from "fastify";

import { config } from "@/config.js";
import { oidc } from "@/oidc-provider.js";
import { accountRoutes } from "@/routes/account.js";
import { interactionRoutes } from "@/routes/interaction.js";
import { introspectionRoutes } from "@/routes/introspection.js";
import { testRoutes } from "@/routes/test.js";

export const fastify = Fastify({
    trustProxy: true,
});

fastify.setErrorHandler((err, req, reply) => {
    console.error(err);
    reply.send(err);
});

await fastify.register(fastifyMiddie);
await fastify.register(fastifyFormbody);
await fastify.register(fastifyView, { engine: { ejs } });
await fastify.register(fastifyCookie);
await fastify.register(fastifySession, { secret: "a secret with minimum length of 32 characters" }); // TODO: generate secret
await fastify.register(fastifyHelmet, { enableCSPNonces: true });

await fastify.use("/oidc", oidc.callback());

// routes
await fastify.register(accountRoutes);
await fastify.register(interactionRoutes);
await fastify.register(introspectionRoutes);
await fastify.register(testRoutes);

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
