import { WebSocket } from "ws";

import { AbstractClient } from "@/model/abstract-client.js";

export type AutohostClientData = {
    autohostId: string;
    ipAddress: string;
};

export class AutohostClient extends AbstractClient implements AutohostClientData {
    protected data: AutohostClientData;

    constructor(socket: WebSocket, data: AutohostClientData) {
        super(socket);

        this.data = data;
    }

    public get autohostId() {
        return this.data.autohostId;
    }

    public get ipAddress() {
        return this.data.ipAddress;
    }
}
