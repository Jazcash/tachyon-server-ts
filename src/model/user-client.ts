import { WebSocket } from "ws";

import { AbstractClient } from "@/model/abstract-client.js";
import { UserRow } from "@/model/db/user.js";
import { userService } from "@/user-service.js";

export type UserClientData = UserRow & {
    ipAddress: string;
};

export class UserClient extends AbstractClient implements UserRow {
    protected data: UserClientData;

    constructor(socket: WebSocket, data: UserClientData) {
        super(socket);

        this.data = data;

        this.sendEvent({
            commandId: "user/updated",
            data: {
                users: [
                    {
                        userId: this.data.userId,
                        username: this.data.username,
                        displayName: this.data.displayName,
                        friendIds: this.data.friendIds,
                        ignoreIds: this.data.ignoreIds,
                        clanId: this.data.clanId ?? null,
                        scopes: this.data.scopes,
                        battleStatus: null,
                        incomingFriendRequestIds: this.data.incomingFriendRequestIds,
                        outgoingFriendRequestIds: this.data.outgoingFriendRequestIds,
                        partyId: null,
                        status: "lobby",
                    },
                ],
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

    public get scopes() {
        return this.data.scopes;
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
}
