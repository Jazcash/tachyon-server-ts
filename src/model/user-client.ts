import { RemoveField } from "jaz-ts-utils";
import type { ResponseEndpointId, ResponseType, ServiceId } from "tachyon-protocol";
import { Data, WebSocket } from "ws";

import { database } from "@/database.js";
import { handlers } from "@/handlers.js";
import { UserRow } from "@/model/db/user.js";
import { userService } from "@/user-service.js";
import { validators } from "@/validators.js";

export class UserClient implements UserRow {
    protected socket: WebSocket;
    protected data: UserRow;

    constructor(socket: WebSocket, data: UserRow) {
        this.socket = socket;
        this.data = data;

        this.socket.on("message", (data) => this.handleRequest(data));
    }

    public get userId() {
        return this.data.userId;
    }

    public get steamId() {
        return this.data.steamId;
    }

    public get displayName() {
        return this.data.displayName;
    }

    public get avatarUrl() {
        return this.data.avatarUrl;
    }

    public get countryCode() {
        return this.data.countryCode;
    }

    public get friendIds() {
        return this.data.friendIds;
    }
    public get outgoingFriendRequestIds() {
        return this.data.outgoingFriendRequestIds;
    }

    public get incomingFriendRequestIds() {
        return this.data.incomingFriendRequestIds;
    }

    public get ignoreIds() {
        return this.data.ignoreIds;
    }

    public get clanId() {
        return this.data.clanId;
    }

    public get roles() {
        return this.data.roles;
    }

    public get createdAt() {
        return this.data.createdAt;
    }

    public get updatedAt() {
        return this.data.updatedAt;
    }

    public async addFriend(userId: number) {
        if (!this.data.friendIds.includes(userId)) {
            this.data.friendIds.push(userId);
            await userService.updateUserProperty(this.data.userId, "friendIds", this.data.friendIds);
        }
    }

    public async removeFriend(userId: number) {
        const index = this.data.friendIds.indexOf(userId);
        if (index > -1) {
            this.data.friendIds.splice(index, 1);
            await userService.updateUserProperty(this.data.userId, "friendIds", this.data.friendIds);
        }
    }

    public async addOutgoingFriendRequest(userId: number) {
        //
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

        this.socket.send(JSON.stringify(response));
    }

    protected async handleRequest(message: Data) {
        const jsonStr = message.toString();

        try {
            const request = JSON.parse(jsonStr) as { command: `${string}/${string}/request`; data?: object };

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
