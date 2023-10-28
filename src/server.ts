import chalk from "chalk";
import { Signal } from "jaz-ts-utils";
import { tachyonMeta } from "tachyon-protocol";
import { WebSocketServer } from "ws";

import { Client } from "@/client.js";
import { config } from "@/config.js";
import { fastify } from "@/http.js";

export class TachyonServer {
    protected wss: WebSocketServer;
    protected clients: Client[] = [];
    protected isReady = false;
    protected onReady = new Signal();

    constructor() {
        this.wss = new WebSocketServer({
            server: fastify.server,
        });

        this.wss.on("listening", () => {
            this.isReady = true;
            this.onReady.dispatch();

            console.log(
                chalk.green(`Tachyon ${tachyonMeta.version} WebSocket Server now listening on port ${config.port}`)
            );
        });

        this.wss.addListener("connection", (socket, request) => {
            const client = new Client(socket, request);
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
