import WebSocket from "ws";

import { Autohost } from "@/model/autohost.js";
import { AutohostClient, AutohostClientData } from "@/model/autohost-client.js";

type AutohostId = Autohost["id"];

export class AutohostClientService {
    protected autohostClients = new Map<AutohostId, AutohostClient>();
    protected slavePool = new Set<AutohostClient>();

    public addAutohostClient(socket: WebSocket, data: AutohostClientData): AutohostClient {
        const existingAutohost = this.autohostClients.get(data.autohostId);
        if (existingAutohost) {
            throw new Error(`Autohost already connected: ${data.autohostId}`);
        }

        const autohostClient = new AutohostClient(socket, data);

        this.autohostClients.set(autohostClient.autohostId, autohostClient);

        socket.addEventListener("close", () => {
            this.autohostClients.delete(data.autohostId);
            this.unslaveAutohostClient(autohostClient);
        });

        return autohostClient;
    }

    public slaveAutohostClient(autohost: AutohostClient) {
        this.slavePool.add(autohost);
    }

    public unslaveAutohostClient(autohost: AutohostClient) {
        this.slavePool.delete(autohost);
    }
}

export const autohostClientService = new AutohostClientService();
