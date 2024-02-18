import { database } from "@/database.js";
import { InsertableUserRow, UpdateableUserRow, UserRow } from "@/model/db/user.js";

export class UserService {
    public async createUser(data: InsertableUserRow): Promise<UserRow> {
        return await database.insertInto("user").values(data).returningAll().executeTakeFirstOrThrow();
    }

    public async getUserById(userId: number): Promise<UserRow> {
        return database.selectFrom("user").where("userId", "=", userId).selectAll().executeTakeFirstOrThrow();
    }

    public async getUserBySteamId(steamId: string): Promise<UserRow | undefined> {
        return database.selectFrom("user").where("steamId", "=", steamId).selectAll().executeTakeFirst();
    }

    public async getUserByGoogleId(googleId: string): Promise<UserRow | undefined> {
        return database.selectFrom("user").where("googleId", "=", googleId).selectAll().executeTakeFirst();
    }

    public async updateUser(userId: number, values: UpdateableUserRow) {
        await database
            .updateTable("user")
            .where("userId", "=", userId)
            .set({ ...values, updatedAt: new Date() })
            .executeTakeFirstOrThrow();
    }

    public async updateUserProperty<K extends keyof UpdateableUserRow & string>(userId: number, property: K, value: UserRow[K]) {
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
