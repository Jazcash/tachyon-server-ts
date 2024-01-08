import { WebSocket } from "ws";

import { Client } from "@/client.js";
import { AccountRow } from "@/model/db/account.js";
import { User } from "@/model/user.js";

export class UserService {
    protected users: Map<number, User> = new Map();

    public addUser(socket: WebSocket, account: AccountRow): User {
        const existingUser = this.users.get(account.accountId);
        if (existingUser) {
            return existingUser;
        }

        const user: User = {
            client: new Client(socket),
            account,
        };

        this.users.set(user.account.accountId, user);

        socket.addEventListener("close", () => {
            this.users.delete(user.account.accountId);
        });

        return user;
    }

    public getUser(accountId: number): User | undefined {
        return this.users.get(accountId);
    }
}

export const userService = new UserService();
