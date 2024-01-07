import { database } from "@/database.js";
import { AccountRow, InsertableAccountRow } from "@/model/account.js";

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
}

export const accountService = new AccountService();
