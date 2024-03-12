import { randomUUID } from "crypto";

import { database } from "@/database.js";
import { InsertableUserRow, UpdateableUserRow, UserRow } from "@/model/db/user.js";

export class UserService {
    public async createUser(data: Omit<InsertableUserRow, "userId">) {
        const userId = randomUUID();

        return await database
            .insertInto("user")
            .values({
                userId: userId,
                ...data,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
    }

    public async getUserById(userId: string) {
        return database.selectFrom("user").where("userId", "=", userId).selectAll().executeTakeFirst();
    }

    public async getUserBySteamId(steamId: string) {
        return database.selectFrom("user").where("steamId", "=", steamId).selectAll().executeTakeFirst();
    }

    public async getUserByGoogleId(googleId: string) {
        return database.selectFrom("user").where("googleId", "=", googleId).selectAll().executeTakeFirst();
    }

    public async updateUser(userId: string, values: UpdateableUserRow) {
        await database
            .updateTable("user")
            .where("userId", "=", userId)
            .set({ ...values, updatedAt: new Date() })
            .executeTakeFirstOrThrow();
    }

    public async updateUserProperty<K extends keyof UpdateableUserRow & string>(userId: string, property: K, value: UserRow[K]) {
        try {
            await database
                .updateTable("user")
                .where("userId", "=", userId)
                .set({ [property]: value, updatedAt: new Date() })
                .executeTakeFirstOrThrow();
        } catch (err) {
            console.error(`Error updating user row with userId ${userId}: ${property} = ${value}`);
            console.error(err);
        }
    }
}

export const userService = new UserService();
