import { database } from "@/database.js";
import { InsertableUserRow, UpdateableUserRow, UserRow } from "@/model/db/user.js";

export class UserService {
    public async createUser(data: InsertableUserRow): Promise<UserRow> {
        return await database.insertInto("user").values(data).returningAll().executeTakeFirstOrThrow();
    }

    public async getUserById(userId: number) {
        return database.selectFrom("user").where("userId", "=", userId).selectAll().executeTakeFirst();
    }

    public async getUserBySteamId(steamId: string) {
        return database.selectFrom("user").where("steamId", "=", steamId).selectAll().executeTakeFirst();
    }

    public async updateUser(userId: number, values: UpdateableUserRow) {
        await database
            .updateTable("user")
            .where("userId", "=", userId)
            .set({ ...values, updatedAt: new Date() })
            .execute();
    }

    public async updateUserProperty<K extends keyof UpdateableUserRow & string>(
        userId: number,
        property: K,
        value: UserRow[K]
    ) {
        try {
            await database
                .updateTable("user")
                .where("userId", "=", userId)
                .set({ [property]: value, updatedAt: new Date() })
                .execute();
        } catch (err) {
            console.error(`Error updating user row with userId ${userId}: ${property} = ${value}`);
            console.error(err);
        }
    }
}

export const userService = new UserService();
