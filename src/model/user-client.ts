import type { GenericResponseCommand, ResponseType } from "tachyon-protocol";
import { Data, WebSocket } from "ws";

import { database } from "@/database.js";
import { handlers } from "@/handlers.js";
import { UserRow } from "@/model/db/user.js";
import { userService } from "@/user-service.js";
import { validators } from "@/validators.js";

export class UserClient implements UserRow {
    public socket: WebSocket;
    protected data: UserRow;

    constructor(socket: WebSocket, data: UserRow) {
        this.socket = socket;
        this.data = data;

        this.socket.on("message", (data) => this.handleRequest(data));

        this.sendResponse({
            commandId: "system/connected/response",
            messageId: "0",
            status: "success",
            data: {
                userId: this.data.userId,
                username: this.data.username,
                displayName: this.data.displayName,
                friendIds: this.data.friendIds,
                ignoreIds: this.data.ignoreIds,
                clanId: this.data.clanId ?? null,
                roles: this.data.roles,
                avatarUrl: "",
                battleStatus: null,
                incomingFriendRequestIds: this.data.incomingFriendRequestIds,
                outgoingFriendRequestIds: this.data.outgoingFriendRequestIds,
                partyId: null,
                status: "lobby",
            },
        });
    }

    public get username() {
        return this.data.username;
    }

    public get email() {
        return this.data.email;
    }

    public get hashedPassword() {
        return this.data.hashedPassword;
    }

    public get googleId() {
        return this.data.googleId;
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

    // public get avatarUrl() {
    //     return this.data.avatarUrl;
    // }

    // public get countryCode() {
    //     return this.data.countryCode;
    // }

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

    public async addFriend(userId: string) {
        if (!this.data.friendIds.includes(userId)) {
            this.data.friendIds.push(userId);
            await userService.updateUserProperty(this.data.userId, "friendIds", this.data.friendIds);
        }
    }

    public async removeFriend(userId: string) {
        const index = this.data.friendIds.indexOf(userId);
        if (index > -1) {
            this.data.friendIds.splice(index, 1);
            await userService.updateUserProperty(this.data.userId, "friendIds", this.data.friendIds);
        }
    }

    public async addOutgoingFriendRequest(userId: string) {
        //
    }

    public sendResponse(responseCommand: ResponseType): void {
        const validator = validators.get(responseCommand.commandId);

        if (!validator) {
            console.error(`No schema or validator found for command: ${responseCommand.commandId}`);
            return;
        }

        const isValid = validator(responseCommand);
        if (!isValid) {
            console.error(validator.errors);
            throw new Error(`Response validation failed for command ${(responseCommand as any).commandId}`);
        }

        this.socket.send(JSON.stringify(responseCommand));
    }

    protected async handleRequest(message: Data) {
        const jsonStr = message.toString();

        try {
            const request = JSON.parse(jsonStr) as { commandId: `${string}/${string}/request`; messageId: string; data?: object };

            const validator = validators.get(request.commandId);

            if (!validator) {
                throw new Error(`No request validator found for command: ${request.commandId}`);
            }

            const isValid = validator(request);
            if (!isValid) {
                console.error(validator.errors);
                throw new Error(`Request validation failed for command ${(request as any).commandId}`);
            }

            const [serviceId, endpointId] = request.commandId.split("/", 2);

            const handler = handlers.get(`${serviceId}/${endpointId}`);

            if (!handler) {
                throw new Error(`No request handler for ${request.commandId}`);
            }

            const response: any = {
                commandId: `${serviceId}/${endpointId}`,
                messageId: request.messageId,
            };

            try {
                const responseData = (await handler.responseHandler({ client: this, database }, request.data)) as Omit<
                    GenericResponseCommand,
                    "commandId" | "messageId"
                >;

                if (responseData) {
                    Object.assign(response, responseData);
                }
            } catch (err) {
                console.log("err", err);

                Object.assign(response, {
                    status: "failed",
                    reason: "internal_error",
                });
            }

            console.log(response);

            this.sendResponse(response);

            if (handler.postResponseHandler) {
                await handler.postResponseHandler({ client: this, database }, request.data);
            }
        } catch (err) {
            console.error(`received message:`, jsonStr);
            console.error(`Error parsing request`, err);
        }
    }
}
