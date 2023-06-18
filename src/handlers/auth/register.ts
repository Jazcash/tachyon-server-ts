import { hash } from "bcrypt";

import { database } from "@/database.js";
import { defineHandler } from "@/handlers.js";

export default defineHandler("auth", "register", async (options, data) => {
    try {
        if (data.password.length < 6) {
            return {
                status: "failed",
                reason: "weak_password",
            };
        }

        const hashedPassword = await hash(data.password, 10);

        await database
            .insertInto("user")
            .values({
                email: data.email,
                username: data.username,
                hashedPassword,
                roles: [],
                isBot: false,
                icons: {},
                friends: [],
                friendRequests: [],
                ignores: [],
            })
            .executeTakeFirstOrThrow();

        return {
            status: "success",
        };
    } catch (err: any) {
        if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
            const conflictColumn = err.message.split(": ")[1].split(".")[1];
            if (conflictColumn === "username") {
                return {
                    status: "failed",
                    reason: "username_taken",
                };
            } else if (conflictColumn === "email") {
                return {
                    status: "failed",
                    reason: "email_taken",
                };
            }
        }

        throw err;
    }
});
