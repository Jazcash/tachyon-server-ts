import fs from "fs";
import { Signal } from "jaz-ts-utils";
import path, { dirname } from "path";
import { replaceTscAliasPaths } from "tsc-alias";
import { fileURLToPath, pathToFileURL } from "url";
import { ServerOptions, WebSocketServer } from "ws";

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

export type TachyonServerConfig = ServerOptions & {
    //
};

export class TachyonServer {
    protected wss: WebSocketServer;
    protected clients: Client[] = [];
    protected isReady = false;
    protected onReady = new Signal();

    constructor(config: TachyonServerConfig) {
        this.wss = new WebSocketServer(config);

        this.wss.on("listening", () => {
            this.isReady = true;
            this.onReady.dispatch();

            console.log(`Tachyon server started on port ${this.wss.options.port}!`);
        });

        this.wss.addListener("connection", (socket) => {
            const client = new Client(socket);
            this.clients.push(client);

            socket.on("close", () => {
                this.clients.splice(this.clients.indexOf(client), 1);
            });
        });
    }

    public ready() {
        return new Promise<void>((resolve) => {
            if (this.isReady) {
                resolve();
            } else {
                this.onReady.addOnce(() => {
                    resolve();
                });
            }
        });
    }

    public destroy() {
        return new Promise<void>((resolve, reject) => {
            this.wss.close((err) => {
                if (err) {
                    reject();
                } else {
                    resolve();
                }
            });
        });
    }
}
