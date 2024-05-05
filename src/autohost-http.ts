import fastifyWebsocket from "@fastify/websocket";
import chalk from "chalk";
import Fastify from "fastify";
import { tachyonMeta } from "tachyon-protocol";

import { config } from "@/config.js";

export const autohostFastify = Fastify({
    trustProxy: true,
    logger: {
        level: "warn",
        file: "logs/fastify.autohost.log",
    },
});

autohostFastify.setErrorHandler((err, req, reply) => {
    console.error(err);
    reply.send(err);
});

await autohostFastify.register(fastifyWebsocket, {
    options: {
        handleProtocols: (protocols, request) => {
            return `tachyon-${tachyonMeta.version}`;
        },
    },
});

export async function startAutohostHttpServer() {
    try {
        await autohostFastify.listen({ port: config.autohostPort ?? 3006 });
        console.log(chalk.green(`Tachyon Autohost Server listening on ${autohostFastify.listeningOrigin}, serving Tachyon v${tachyonMeta.version}`));
    } catch (err) {
        autohostFastify.log.error(err);
        process.exit(1);
    }
}

export async function stopAutohostHttpServer() {
    await autohostFastify.close();
}
