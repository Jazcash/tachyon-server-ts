import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { SerializePlugin } from "kysely-plugin-serialize";

import { DatabaseModel } from "@/model/database.js";

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
    .createTable("setting")
    .ifNotExists()
    .addColumn("key", "text", (col) => col.primaryKey())
    .addColumn("value", "text", (col) => col.notNull())
    .execute();

await database.schema
    .createTable("account")
    .ifNotExists()
    .addColumn("accountId", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("steamId", "text", (col) => col.notNull().unique())
    .addColumn("clanId", "integer", (col) => col.defaultTo(null))
    .addColumn("icons", "json", (col) => col.notNull().defaultTo("{}"))
    .addColumn("roles", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("friends", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("friendRequests", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("ignores", "json", (col) => col.notNull().defaultTo("[]"))
    .execute();
