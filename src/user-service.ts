import { WebSocket } from "ws";

import { Client } from "@/client.js";
import { User, UserConfig } from "@/user.js";

export class UserService {
    protected users: Map<number, User> = new Map();

    public addUser(socket: WebSocket, config: UserConfig): User {
        const client = new Client(socket);
        const user = new User(client, config);

        this.users.set(config.accountId, user);

        socket.addEventListener("close", () => {
            this.users.delete(config.accountId);
        });

        return user;
    }

    public getUser(accountId: number): User | undefined {
        return this.users.get(accountId);
    }
}

export const userService = new UserService();
