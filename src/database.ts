import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import { SerializePlugin } from "jaz-ts-utils";
import { Kysely, SqliteDialect } from "kysely";

import { DatabaseModel } from "@/model/database.js";

const serializePlugin = new SerializePlugin();

export const database = new Kysely<DatabaseModel>({
    dialect: new SqliteDialect({
        database: new Database("./database.db"),
    }),
    plugins: [serializePlugin],
});

await serializePlugin.setSchema(database as any);

await database.schema
    .createTable("settings")
    .ifNotExists()
    .addColumn("key", "varchar", (col) => col.primaryKey())
    .addColumn("value", "blob", (col) => col.notNull().unique())
    .execute();

await database.schema
    .createTable("user")
    .ifNotExists()
    .addColumn("userId", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("email", "varchar", (col) => col.notNull().unique())
    .addColumn("username", "varchar", (col) => col.notNull().unique())
    .addColumn("hashedPassword", "varchar", (col) => col.notNull())
    .addColumn("verified", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("clanId", "integer")
    .addColumn("icons", "json", (col) => col.notNull().defaultTo("{}"))
    .addColumn("roles", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("friends", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("friendRequests", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("ignores", "json", (col) => col.notNull().defaultTo("[]"))
    .execute();

let signSecret = "";
export async function getSignSecret() {
    if (signSecret) {
        return signSecret;
    }

    const storedSecret = await database
        .selectFrom("settings")
        .where("key", "=", "signSecret")
        .select("value")
        .executeTakeFirst();
    if (storedSecret) {
        signSecret = String(storedSecret.value);
    } else {
        signSecret = randomBytes(48).toString("hex");

        await database
            .insertInto("settings")
            .values({
                key: "signSecret",
                value: signSecret,
            })
            .execute();
    }

    return signSecret;
}
