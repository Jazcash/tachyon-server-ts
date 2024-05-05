import { WebSocket } from "ws";

import { matchmakingService } from "@/matchmaking-service.js";
import { UserClient, UserClientData } from "@/model/user-client.js";

export class UserClientService {
    protected userClients: Map<string, UserClient> = new Map();

    public addUserClient(socket: WebSocket, userData: UserClientData): UserClient {
        const existingUser = this.userClients.get(userData.userId);
        if (existingUser) {
            return existingUser;
        }

        const userClient = new UserClient(socket, userData);

        this.userClients.set(userClient.userId, userClient);

        socket.addEventListener("close", () => {
            matchmakingService.removeUsersFromAllQueues(userClient.userId);
            this.userClients.delete(userClient.userId);
        });

        return userClient;
    }

    public getUserClientById(userId: string): UserClient | undefined {
        return this.userClients.get(userId);
    }

    public getUserClientByIdOrThrow(userId: string): UserClient | never {
        const userClient = this.getUserClientById(userId);
        if (!userClient) {
            throw new Error(`UserClient not found: ${userId}`);
        }
        return userClient;
    }
}

export const userClientService = new UserClientService();
