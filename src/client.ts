import fs from "fs";
import { IncomingMessage } from "http";
import { RemoveField } from "jaz-ts-utils";
import { Socket } from "net";
import type { ResponseEndpointId, ResponseType, ServiceId, SystemVersionResponse } from "tachyon-protocol";
import { Data, WebSocket } from "ws";

import { database } from "@/database.js";
import { handlers } from "@/handlers.js";
import { User } from "@/model/user.js";
import { validators } from "@/validators.js";

const tachyonPackageStr = fs.readFileSync("./node_modules/tachyon-protocol/package.json", { encoding: "utf-8" });
const tachyonPackageJson = JSON.parse(tachyonPackageStr);
const serverTachyonVersion = tachyonPackageJson.version;

export class Client {
    public user?: User;
    public ws: WebSocket;
    public socket: Socket;

    constructor(ws: WebSocket, connectionMessage: IncomingMessage) {
        this.ws = ws;
        this.socket = connectionMessage.socket;

        const url = new URL(connectionMessage.url!, `http://${connectionMessage.headers.host}`);
        const clientTachyonVersion = url.searchParams.get("tachyonVersion");

        if (clientTachyonVersion !== serverTachyonVersion) {
            let versionParity: (SystemVersionResponse & { status: "success" })["data"]["versionParity"] = "unknown"; // TODO: make type helper for this sort of thing
            if (clientTachyonVersion) {
                const [clientMajor, clientMinor, clientPatch] = clientTachyonVersion.split(".");
                const [serverMajor, serverMinor, serverPatch] = serverTachyonVersion.split(".");

                if (clientMajor !== serverMajor) {
                    versionParity = "major_mismatch";
                } else if (clientMinor !== serverMinor) {
                    versionParity = "minor_mismatch";
                } else if (clientPatch !== serverPatch) {
                    versionParity = "patch_mismatch";
                }
            }

            this.sendResponse("system", "version", {
                status: "success",
                data: {
                    tachyonVersion: serverTachyonVersion,
                    versionParity,
                },
            });
        } else {
            this.sendResponse("system", "version", {
                status: "success",
                data: {
                    tachyonVersion: serverTachyonVersion,
                    versionParity: "match",
                },
            });
        }

        this.ws.on("message", (data) => this.handleRequest(data));
    }

    public sendResponse<S extends ServiceId, E extends ResponseEndpointId<S>>(
        service: S,
        endpoint: E,
        data: RemoveField<ResponseType<S, E>, "command">
    ): void {
        const validator = validators.get(`${service}/${endpoint.toString()}/response`);

        if (!validator) {
            console.error(`No schema or validator found for response: ${service}/${endpoint.toString()}`);
            return;
        }

        const commandId = `${service}/${endpoint.toString()}/response`;

        const response = {
            command: commandId,
            ...data,
        } as ResponseType<S, E>;

        const isValid = validator(response);
        if (!isValid) {
            console.error(`Error validating response: ${commandId}:`);
            console.error(response);
            console.error(validator.errors);
            return;
        }

        this.ws.send(JSON.stringify(response));
    }

    protected async handleRequest(message: Data) {
        const jsonStr = message.toString();

        try {
            const request = JSON.parse(jsonStr) as { command: `${string}/${string}/request`; data?: object }; // TODO: parse this against an AJV validator

            const validator = validators.get(request.command);

            if (!validator) {
                throw new Error(`No validator found for command: ${request.command}`);
            }

            const isValid = validator(request);
            if (!isValid) {
                console.error(validator.errors);
                throw new Error("Request validation failed");
            }

            const [serviceId, endpointId] = request.command.split("/", 2);

            const handler = handlers.get(`${serviceId}/${endpointId}`);

            if (!handler) {
                throw new Error(`No request handler for ${request.command}`);
            }

            let response: any;

            try {
                response = await handler({ client: this, database }, request.data);
            } catch (err) {
                console.log("err", err);

                response = {
                    status: "failed",
                    reason: "internal_error",
                };
            }

            this.sendResponse(serviceId as any, endpointId as any, response as never); // hacky
        } catch (err) {
            console.error(`received message:`, jsonStr);
            console.error(`Error parsing request`, err);
        }
    }
}
