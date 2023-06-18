import dotenv from "dotenv";

dotenv.config();

import fs from "fs";
import path, { dirname } from "path";
import { replaceTscAliasPaths } from "tsc-alias";
import { fileURLToPath, pathToFileURL } from "url";
import { WebSocketServer } from "ws";

import { Client } from "@/client.js";

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

const clients: Client[] = [];
const server = new WebSocketServer({ host: "localhost", port: 3005 });

console.log(`Server started on port ${server.options.port}!`);

server.addListener("connection", (socket) => {
    const client = new Client(socket);
    clients.push(client);

    socket.on("close", () => {
        clients.splice(clients.indexOf(client), 1);
    });
});
