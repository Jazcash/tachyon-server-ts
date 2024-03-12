import { WebSocket } from "ws";

import { UserRow } from "@/model/db/user.js";
import { UserClient } from "@/model/user-client.js";

export class UserClientService {
    protected userClients: Map<string, UserClient> = new Map();

    public addUserClient(socket: WebSocket, userData: UserRow): UserClient {
        const existingUser = this.userClients.get(userData.userId);
        if (existingUser) {
            return existingUser;
        }

        const userClient = new UserClient(socket, userData);

        this.userClients.set(userClient.userId, userClient);

        socket.addEventListener("close", () => {
            this.userClients.delete(userClient.userId);
        });

        return userClient;
    }

    public getUserClient(userId: string): UserClient | undefined {
        return this.userClients.get(userId);
    }
}

export const userClientService = new UserClientService();
