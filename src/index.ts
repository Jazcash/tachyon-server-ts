import chalk from "chalk";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

import { startHttpServer } from "@/http.js";

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
        if (endpointHandler.endsWith(".ts")) {
            const endpointHandlerPath = pathToFileURL(path.join(endpointDir, endpointHandler));
            await import(endpointHandlerPath.href);
            registeredHandlers[serviceHandlerDir].push(path.parse(endpointHandler).name);
        }
    }
}

const schemaDirs = await fs.promises.readdir("./node_modules/tachyon-protocol/dist", { withFileTypes: true });
const serviceDirs = schemaDirs.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
for (const serviceDir of serviceDirs) {
    const endpointDirs = await fs.promises.readdir(`./node_modules/tachyon-protocol/dist/${serviceDir}`);
    for (const endpointDir of endpointDirs) {
        const hasRequestSchema = fs.existsSync(`./node_modules/tachyon-protocol/dist/${serviceDir}/${endpointDir}/request.json`);
        if (hasRequestSchema && (!registeredHandlers[serviceDir] || !registeredHandlers[serviceDir].includes(endpointDir))) {
            console.warn(chalk.red(`No handler defined for ${serviceDir}/${endpointDir}`));
        }
    }
}

await startHttpServer();
