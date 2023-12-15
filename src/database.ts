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
    .addColumn("userId", "varchar", (col) => col.primaryKey())
    .addColumn("email", "varchar", (col) => col.notNull().unique())
    .addColumn("steamId", "varchar", (col) => col.unique())
    .addColumn("displayName", "varchar", (col) => col.notNull())
    .addColumn("hashedPassword", "varchar", (col) => col.notNull())
    .addColumn("verified", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("clanId", "integer")
    .addColumn("icons", "json", (col) => col.notNull().defaultTo("{}"))
    .addColumn("roles", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("friends", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("friendRequests", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("ignores", "json", (col) => col.notNull().defaultTo("[]"))
    .execute();

await database.schema
    .createTable("oidc")
    .ifNotExists()
    .addColumn("id", "varchar", (col) => col.primaryKey())
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("payload", "json")
    .addColumn("grantId", "text")
    .addColumn("userCode", "text", (col) => col.unique())
    .addColumn("uid", "text", (col) => col.unique())
    .addColumn("expiresAt", "datetime")
    .addColumn("consumedAt", "datetime")
    .addColumn("createdAt", "datetime", (col) => col.notNull().defaultTo(new Date()))
    .addColumn("updatedAt", "datetime", (col) => col.notNull().defaultTo(new Date()))
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
