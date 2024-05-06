import { randomUUID } from "crypto";

import { database } from "@/database.js";
import { AutohostRow, InsertableAutohostRow, UpdateableAutohostRow } from "@/model/db/autohost.js";

export class AutohostService {
    public async createAutohost(data: Omit<InsertableAutohostRow, "autohostId">) {
        const autohostId = randomUUID();

        return await database
            .insertInto("autohost")
            .values({
                autohostId: autohostId,
                ...data,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
    }

    public async getAutohostById(autohostId: string) {
        return database.selectFrom("autohost").where("autohostId", "=", autohostId).selectAll().executeTakeFirst();
    }

    public async updateAutohost(autohostId: string, values: UpdateableAutohostRow) {
        await database
            .updateTable("autohost")
            .where("autohostId", "=", autohostId)
            .set({ ...values, updatedAt: new Date() })
            .executeTakeFirstOrThrow();
    }

    public async updateAutohostProperty<K extends keyof UpdateableAutohostRow & string>(autohostId: string, property: K, value: AutohostRow[K]) {
        try {
            await database
                .updateTable("autohost")
                .where("autohostId", "=", autohostId)
                .set({ [property]: value, updatedAt: new Date() })
                .executeTakeFirstOrThrow();
        } catch (err) {
            console.error(`Error updating autohost row with autohostId ${autohostId}: ${property} = ${value}`);
            console.error(err);
        }
    }
}

export const autohostService = new AutohostService();
