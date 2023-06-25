import fs from "fs";
import path, { dirname } from "path";
import { replaceTscAliasPaths } from "tsc-alias";
import { fileURLToPath, pathToFileURL } from "url";

import { TachyonServer } from "@/server.js";

replaceTscAliasPaths();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceHandlersDir = path.join(__dirname, "handlers");
const serviceHandlerDirs = await fs.promises.readdir(serviceHandlersDir);
for (const serviceHandlerDir of serviceHandlerDirs) {
    const endpointDir = path.join(serviceHandlersDir, serviceHandlerDir);
    const endpointHandlers = await fs.promises.readdir(endpointDir, {
        withFileTypes: false,
    });
    for (const endpointHandler of endpointHandlers) {
        if (endpointHandler.endsWith(".js")) {
            const endpointHandlerPath = pathToFileURL(path.join(endpointDir, endpointHandler));
            await import(endpointHandlerPath.href);
        }
    }
}

const server = new TachyonServer({
    host: "localhost",
    port: 3005,
});
