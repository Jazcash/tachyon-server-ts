import * as bcryptjs from "bcryptjs";

import { config } from "@/config.js";
import { database } from "@/database.js";
import { defineHandler } from "@/handlers.js";

const hash = bcryptjs.hash;

export default defineHandler("account", "register", async (options, data) => {
    try {
        const hashedPassword = await hash(data.hashedPassword, 10); // second hash

        await database
            .insertInto("user")
            .values({
                email: data.email,
                username: data.username,
                hashedPassword,
                verified: !config.accountVerification,
                roles: [],
                icons: {},
                friends: [],
                friendRequests: [],
                ignores: [],
            })
            .executeTakeFirstOrThrow();

        // TODO: send verification email

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
