import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import { Kysely, SqliteDialect } from "kysely";
import { SerializePlugin } from "kysely-plugin-serialize";

import { DatabaseModel } from "@/model/database.js";
import { hashPassword } from "@/utils/hash-password.js";

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
    .addColumn("email", "text", (col) => col.unique().defaultTo(null))
    .addColumn("hashedPassword", "text", (col) => col.defaultTo(null))
    .addColumn("steamId", "text", (col) => col.unique().defaultTo(null))
    .addColumn("googleId", "text", (col) => col.unique().defaultTo(null))
    .addColumn("displayName", "text", (col) => col.notNull())
    .addColumn("verified", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("clanId", "integer", (col) => col.defaultTo(null))
    .addColumn("icons", "json", (col) => col.notNull().defaultTo("{}"))
    .addColumn("roles", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("friends", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("friendRequests", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("ignores", "json", (col) => col.notNull().defaultTo("[]"))
    .execute();

await database.schema
    .createTable("oauthTokens")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("userId", "integer", (col) => col.notNull())
    .addColumn("clientId", "text", (col) => col.notNull())
    .addColumn("accessToken", "text", (col) => col.notNull())
    .addColumn("accessTokenExpiry", "datetime", (col) => col.notNull())
    .addColumn("refreshToken", "text", (col) => col.notNull())
    .addColumn("refreshTokenExpiry", "datetime", (col) => col.notNull())
    .execute();

await database
    .insertInto("user")
    .values({
        email: "test@tachyontest.com",
        hashedPassword: await hashPassword("fish"),
        displayName: "Player",
        verified: true,
    })
    .onConflict((oc) => oc.doNothing())
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
