import chalk from "chalk";
import fs from "fs";
import path, { dirname } from "path";
import { replaceTscAliasPaths } from "tsc-alias";
import { fileURLToPath, pathToFileURL } from "url";

import { setConfig } from "@/config.js";
import { startHttpServer, stopHttpServer } from "@/http.js";
import { Config } from "@/model/config.js";
import { TachyonServer } from "@/server.js";

replaceTscAliasPaths();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const registeredHandlers: Record<string, string[]> = {};

const serviceHandlersDir = path.join(__dirname, "handlers");
const serviceHandlerDirs = await fs.promises.readdir(serviceHandlersDir);
for (const serviceHandlerDir of serviceHandlerDirs) {
    const endpointDir = path.join(serviceHandlersDir, serviceHandlerDir);
    const endpointHandlers = await fs.promises.readdir(endpointDir, {
        withFileTypes: false,
    });
    registeredHandlers[serviceHandlerDir] = [];
    for (const endpointHandler of endpointHandlers) {
        if (endpointHandler.endsWith(".js")) {
            const endpointHandlerPath = pathToFileURL(path.join(endpointDir, endpointHandler));
            await import(endpointHandlerPath.href);
            registeredHandlers[serviceHandlerDir].push(path.parse(endpointHandler).name);
        }
    }
}

const schemaDirs = await fs.promises.readdir("tachyon/dist", { withFileTypes: true });
const serviceDirs = schemaDirs.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
for (const serviceDir of serviceDirs) {
    const endpointDirs = await fs.promises.readdir(`tachyon/dist/${serviceDir}`);
    for (const endpointDir of endpointDirs) {
        const hasRequestSchema = fs.existsSync(`tachyon/dist/${serviceDir}/${endpointDir}/request.json`);
        if (
            hasRequestSchema &&
            (!registeredHandlers[serviceDir] || !registeredHandlers[serviceDir].includes(endpointDir))
        ) {
            console.warn(chalk.yellow(`No endpoint handler defined for ${serviceDir}/${endpointDir}`));
        }
    }
}

let server: TachyonServer;

export async function startServer(configToSet?: Config) {
    if (configToSet) {
        await setConfig(configToSet);
    }

    server = new TachyonServer();

    await Promise.all([server.ready(), startHttpServer()]);

    return server;
}

export async function stopServer() {
    return Promise.all([server.destroy(), stopHttpServer()]);
}
