import { type EndpointId, type GenericResponseCommand, type ResponseType, type ServiceId, tachyonMeta } from "tachyon-protocol";
import * as validators from "tachyon-protocol/validators";
import { Data, WebSocket } from "ws";

import { database } from "@/database.js";
import { handlerService } from "@/handler-service.js";
import { UserRow } from "@/model/db/user.js";
import { userService } from "@/user-service.js";

export type UserClientData = UserRow & {
    ipAddress: string;
};

export class UserClient implements UserRow {
    public socket: WebSocket;
    protected data: UserClientData;

    constructor(socket: WebSocket, data: UserClientData) {
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

    public get ipAddress() {
        return this.data.ipAddress;
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
        const [serviceId, endpointId, commandType] = responseCommand.commandId.split("/");

        const validatorId = `${serviceId}_${endpointId}_${commandType}`;
        const validator = validators[validatorId as keyof typeof validators];

        if (!validator) {
            console.error(`No response schema or validator found for ${serviceId}/${endpointId}`);
            return;
        }

        const isValid = validator(responseCommand);
        if (!isValid) {
            console.error("Response validation failed");
            console.error(validator.errors);
            throw new Error(`Response validation failed for ${serviceId}/${endpointId}`);
        }

        this.socket.send(JSON.stringify(responseCommand));
    }

    protected async handleRequest(message: Data): Promise<void> {
        const jsonStr = message.toString();

        try {
            const request = JSON.parse(jsonStr) as { commandId: `${string}/${string}/request`; messageId: string; data?: object };
            const [serviceId, endpointId] = request.commandId.split("/", 2);

            if (!this.isValidServiceId(serviceId)) {
                throw new Error(`Invalid ServiceId: ${serviceId}`);
            }

            if (!this.isValidEndpointId(serviceId, endpointId)) {
                throw new Error(`Invalid EndpointId: ${endpointId}`);
            }

            const response: any = {
                commandId: `${serviceId}/${endpointId}/response`,
                messageId: request.messageId,
            };

            const handler = await handlerService.getHandler(serviceId, endpointId as EndpointId<typeof serviceId>);

            if (!handler) {
                response.status = "failed";
                response.reason = "command_unimplemented";

                this.sendResponse(response);
                return;
            }

            const validator = validators[`${serviceId}_${endpointId}_request` as keyof typeof validators];

            if (!validator) {
                throw new Error(`No request validator found for command: ${request.commandId}`);
            }

            const isValid = validator(request);
            if (!isValid) {
                console.error(`Request command validation failed for ${serviceId}/${endpointId}:`);
                console.error(validator.errors);

                response.status = "failed";
                response.reason = "invalid_request";

                this.sendResponse(response);
                return;
            }

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

            this.sendResponse(response);

            if (handler.postResponseHandler) {
                await handler.postResponseHandler({ client: this, database }, request.data);
            }
        } catch (err) {
            console.error(`received message:`, jsonStr);
            console.error(`Error parsing request`, err);
        }
    }

    protected isValidServiceId(serviceId: string): serviceId is ServiceId {
        return serviceId in tachyonMeta.ids;
    }

    protected isValidEndpointId(serviceId: ServiceId, endpointId: string): boolean {
        return endpointId in tachyonMeta.ids[serviceId];
    }
}
