import WebSocket from "ws";

import { Autohost } from "@/model/autohost.js";
import { AutohostClient, AutohostClientData } from "@/model/autohost-client.js";

type AutohostId = Autohost["id"];

export class AutohostService {
    protected autohosts = new Map<AutohostId, AutohostClient>();

    public addAutohost(socket: WebSocket, data: AutohostClientData): AutohostClient {
        const autohostClient = new AutohostClient(socket, data);
        this.autohosts.set(autohostClient.autohostId, autohostClient);
        return autohostClient;
    }

    public slaveAutohost(autohost: AutohostClient) {
        if (!this.autohosts.has(autohost.autohostId)) {
            this.autohosts.set(autohost.autohostId, autohost);
        } else {
            console.warn(`Autohost has already been added: ${autohost.autohostId}`);
        }
    }

    public unslaveAutohost(autohost: AutohostClient) {
        if (this.autohosts.has(autohost.autohostId)) {
            this.autohosts.delete(autohost.autohostId);
        } else {
            console.warn(`Autohost has already been removed: ${autohost.autohostId}`);
        }
    }
}

export const autohostService = new AutohostService();
