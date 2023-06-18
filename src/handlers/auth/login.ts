import jwt from "jsonwebtoken";

import { database, getSignSecret } from "@/database.js";
import { defineHandler } from "@/handlers.js";

export default defineHandler("auth", "login", async (options, data) => {
    try {
        const signSecret = await getSignSecret();
        const payload = jwt.verify(data.token, signSecret);

        if (typeof payload === "object" && "userId" in payload) {
            const { hashedPassword, ...user } = await database.selectFrom("user").where("userId", "=", payload.userId).selectAll().executeTakeFirstOrThrow();

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
