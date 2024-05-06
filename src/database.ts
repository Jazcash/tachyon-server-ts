import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { SerializePlugin } from "kysely-plugin-serialize";

import { DatabaseModel } from "@/model/db/database.js";
import { hashPassword } from "@/utils/hash-password.js";

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
                    } else if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/.test(parameter)) {
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
    .addColumn("key", "text", (col) => col.notNull().primaryKey())
    .addColumn("value", "text", (col) => col.notNull())
    .execute();

await database.schema
    .createTable("user")
    .ifNotExists()
    .addColumn("userId", "varchar", (col) => col.notNull().primaryKey())
    .addColumn("username", "text", (col) => col.unique().notNull())
    .addColumn("email", "text", (col) => col.unique())
    .addColumn("hashedPassword", "text")
    .addColumn("googleId", "text", (col) => col.unique())
    .addColumn("steamId", "text", (col) => col.unique())
    .addColumn("displayName", "text", (col) => col.notNull())
    // .addColumn("avatarUrl", "text", (col) => col.notNull())
    //.addColumn("countryCode", "text")
    .addColumn("clanId", "varchar", (col) => col.defaultTo(null))
    .addColumn("friendIds", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("outgoingFriendRequestIds", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("incomingFriendRequestIds", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("ignoreIds", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("roles", "json", (col) => col.notNull().defaultTo("[]"))
    .addColumn("createdAt", "datetime", (col) => col.notNull().defaultTo(new Date()))
    .addColumn("updatedAt", "datetime", (col) => col.notNull().defaultTo(new Date()))
    .execute();

await database.schema
    .createTable("client")
    .ifNotExists()
    .addColumn("clientId", "text", (col) => col.notNull().primaryKey())
    .addColumn("clientSecret", "text")
    .addColumn("redirectUris", "json", (col) => col.notNull())
    .addColumn("scopes", "json", (col) => col.notNull())
    .addColumn("allowedGrants", "json", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("createdAt", "datetime", (col) => col.notNull().defaultTo(new Date()))
    .addColumn("updatedAt", "datetime", (col) => col.notNull().defaultTo(new Date()))
    .execute();

await database.schema
    .createTable("authCode")
    .ifNotExists()
    .addColumn("code", "text", (col) => col.notNull().primaryKey())
    .addColumn("redirectUri", "text")
    .addColumn("codeChallenge", "text")
    .addColumn("codeChallengeMethod", "text", (col) => col.defaultTo("plain"))
    .addColumn("expiresAt", "datetime", (col) => col.notNull())
    .addColumn("userId", "varchar")
    .addColumn("clientId", "text", (col) => col.notNull())
    .addColumn("scopes", "json", (col) => col.notNull())
    .addColumn("createdAt", "datetime", (col) => col.notNull().defaultTo(new Date()))
    .addColumn("updatedAt", "datetime", (col) => col.notNull().defaultTo(new Date()))
    .execute();

await database.schema
    .createTable("token")
    .ifNotExists()
    .addColumn("accessToken", "text", (col) => col.notNull().primaryKey())
    .addColumn("accessTokenExpiresAt", "datetime", (col) => col.notNull())
    .addColumn("refreshToken", "text", (col) => col.unique())
    .addColumn("refreshTokenExpiresAt", "datetime")
    .addColumn("clientId", "text", (col) => col.notNull())
    .addColumn("userId", "varchar")
    .addColumn("scopes", "json", (col) => col.notNull())
    .addColumn("createdAt", "datetime", (col) => col.notNull().defaultTo(new Date()))
    .addColumn("updatedAt", "datetime", (col) => col.notNull().defaultTo(new Date()))
    .execute();

await database.schema
    .createTable("session")
    .ifNotExists()
    .addColumn("sessionId", "varchar", (col) => col.notNull().primaryKey())
    .addColumn("userId", "varchar")
    .addColumn("googleId", "varchar")
    .addColumn("steamId", "varchar")
    .addColumn("auth", "json")
    .execute();

await database
    .insertInto("user")
    .values({
        userId: "123",
        email: "test@tachyontest.com",
        username: "dummy",
        hashedPassword: await hashPassword("fish"),
        displayName: "Dummy User",
    })
    .onConflict((oc) => oc.doNothing())
    .execute();
