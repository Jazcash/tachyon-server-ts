import jwt from "jsonwebtoken";

import { database, getSignSecret } from "@/database.js";
import { defineHandler } from "@/handlers.js";
import { addUserClient } from "@/userClients.js";

export default defineHandler("account", "login", async (options, data) => {
    try {
        const signSecret = await getSignSecret();
        const payload = jwt.verify(data.token, signSecret);

        if (typeof payload === "object" && "userId" in payload) {
            const user = await database
                .selectFrom("user")
                .where("userId", "=", payload.userId)
                .selectAll()
                .executeTakeFirstOrThrow();

            options.client.user = user;

            addUserClient(user);

            return {
                status: "success",
                data: {
                    user: {
                        ...user,
                        battleStatus: null,
                    },
                },
            };
        } else {
            throw new Error(`Invalid payload: ${payload}`);
        }
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return {
                status: "failed",
                reason: "expired_token",
            };
        } else if (err instanceof jwt.JsonWebTokenError) {
            return {
                status: "failed",
                reason: "invalid_token",
            };
        }

        throw err;
    }
});
