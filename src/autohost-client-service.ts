import WebSocket from "ws";

import { Autohost } from "@/model/autohost.js";
import { AutohostClient, AutohostClientData } from "@/model/autohost-client.js";

type AutohostId = Autohost["id"];

export class AutohostClientService {
    protected autohostClients = new Map<AutohostId, AutohostClient>();

    public addAutohostClient(socket: WebSocket, data: AutohostClientData): AutohostClient {
        const autohostClient = new AutohostClient(socket, data);
        this.autohostClients.set(autohostClient.autohostId, autohostClient);
        return autohostClient;
    }

    public slaveAutohostClient(autohost: AutohostClient) {
        if (!this.autohostClients.has(autohost.autohostId)) {
            this.autohostClients.set(autohost.autohostId, autohost);
        } else {
            console.warn(`Autohost has already been added: ${autohost.autohostId}`);
        }
    }

    public unslaveAutohostClient(autohost: AutohostClient) {
        if (this.autohostClients.has(autohost.autohostId)) {
            this.autohostClients.delete(autohost.autohostId);
        } else {
            console.warn(`Autohost has already been removed: ${autohost.autohostId}`);
        }
    }
}

export const autohostClientService = new AutohostClientService();
