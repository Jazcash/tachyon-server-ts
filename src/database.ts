import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import { Kysely, SqliteDialect } from "kysely";
import { SerializePlugin } from "kysely-plugin-serialize";

import { DatabaseModel } from "@/model/database.js";

const serializePlugin = new SerializePlugin();

const dateRegex = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/;

export const database = new Kysely<DatabaseModel>({
    dialect: new SqliteDialect({
        database: new Database("./database.db"),
    }),
    plugins: [
        // https://github.com/subframe7536/kysely-sqlite-tools/blob/master/packages/plugin-serialize
        new SerializePlugin({
            deserializer: (parameter) => {
                if (skipTransform(parameter)) {
                    return parameter;
                }
                if (typeof parameter === "string") {
                    if (/^(true|false)$/.test(parameter)) {
                        return parameter === "true";
                    } else if (dateRegex.test(parameter)) {
                        return new Date(parameter);
                    } else if (parameter.match(/^[[{]/) != null) {
                        try {
                            return JSON.parse(parameter);
                        } catch (err) {
                            return parameter;
                        }
                    } else {
                        return parameter;
                    }
                }
            },
        }),
    ],
});

function skipTransform(parameter: unknown) {
    return (
        parameter === undefined ||
        parameter === null ||
        typeof parameter === "bigint" ||
        typeof parameter === "number" ||
        (typeof parameter === "object" && "buffer" in parameter)
    );
}

await database.schema
    .createTable("settings")
    .ifNotExists()
    .addColumn("key", "text", (col) => col.primaryKey())
    .addColumn("value", "blob", (col) => col.notNull().unique())
    .execute();

await database.schema
    .createTable("user")
    .ifNotExists()
    .addColumn("userId", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("email", "text", (col) => col.unique())
    .addColumn("hashedPassword", "text")
    .addColumn("steamId", "text", (col) => col.unique())
    .addColumn("googleId", "text", (col) => col.unique())
    .addColumn("displayName", "text", (col) => col.notNull())
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
    .addColumn("id", "text", (col) => col.primaryKey())
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
