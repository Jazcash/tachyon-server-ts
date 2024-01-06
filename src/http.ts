import fastifyCookie from "@fastify/cookie";
import { fastifyFormbody } from "@fastify/formbody";
import fastifyHelmet from "@fastify/helmet";
import fastifyMiddie from "@fastify/middie";
import fastifySession from "@fastify/session";
import { fastifyView } from "@fastify/view";
import { User } from "@node-oauth/oauth2-server";
import chalk from "chalk";
import Fastify from "fastify";
import handlebars from "handlebars";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import { config } from "@/config.js";
import { authRoutes } from "@/routes/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const fastify = Fastify({
    trustProxy: true,
});

fastify.setErrorHandler((err, req, reply) => {
    console.error(err);
    reply.send(err);
});

await fastify.register(fastifyCookie);
await fastify.register(fastifySession, { secret: "a secret with minimum length of 32 characters" }); // TODO: generate secret
await fastify.register(fastifyMiddie);
await fastify.register(fastifyFormbody);
await fastify.register(fastifyView, {
    engine: { handlebars },
    root: path.join(__dirname, "./views2"),
    options: {
        partials: {
            layout: "layout.hbs",
        },
    },
});
await fastify.register(fastifyHelmet, { enableCSPNonces: true });

// routes
await fastify.register(authRoutes);

declare module "fastify" {
    export interface FastifyRequest {
        user: User;
    }
}

fastify.decorateRequest("user", null);

fastify.get("/", async (request, reply) => {
    reply.send("I am a Tachyon Server!");
});

export async function startHttpServer() {
    try {
        await fastify.listen({ port: config.port });
        console.log(chalk.green(`Tachyon HTTP API listening on http://127.0.0.1:${config.port}`));
        //console.log(chalk.green(`OAuth Discovery: http://127.0.0.1:${config.port}/.well-known/openid-configuration`));
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

export async function stopHttpServer() {
    await fastify.close();
}
