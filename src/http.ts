import fastifyMiddie from "@fastify/middie";
import chalk from "chalk";
import Fastify from "fastify";

import { config } from "@/config.js";
import { oidc } from "@/oidc-provider.js";
import { accountRoutes } from "@/routes/account.js";

export const fastify = Fastify({
    logger: false,
});

await fastify.register(fastifyMiddie);

await fastify.use("/oidc", oidc.callback());

fastify.get("/", async function handler(request, reply) {
    return { hello: "world" };
});

fastify.register(accountRoutes);

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
