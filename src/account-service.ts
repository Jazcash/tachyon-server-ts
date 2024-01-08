import { database } from "@/database.js";
import { AccountRow, InsertableAccountRow } from "@/model/db/account.js";

export class AccountService {
    public async createOrGetAccount(data: InsertableAccountRow): Promise<AccountRow> {
        const existingUser = await database
            .selectFrom("account")
            .where("steamId", "=", data.steamId)
            .selectAll()
            .executeTakeFirst();

        if (existingUser) {
            return existingUser;
        }

        return await database.insertInto("account").values(data).returningAll().executeTakeFirstOrThrow();
    }

    public async getAccountById(userId: number) {
        return database.selectFrom("account").where("accountId", "=", userId).selectAll().executeTakeFirst();
    }

    public async getAccountBySteamId(steamId: string) {
        return database.selectFrom("account").where("steamId", "=", steamId).selectAll().executeTakeFirst();
    }

    public async updateRow<K extends keyof AccountRow & string, V extends AccountRow[K]>(
        accountId: number,
        key: K,
        value: V
    ) {
        try {
            return await database
                .updateTable("account")
                .where("accountId", "=", accountId)
                .set({
                    [key]: value,
                })
                .executeTakeFirstOrThrow();
        } catch (err) {
            console.error(`Error updating account row with accountId ${accountId}: ${key} = ${value}`);
            console.error(err);
        }
    }
}

export const accountService = new AccountService();
