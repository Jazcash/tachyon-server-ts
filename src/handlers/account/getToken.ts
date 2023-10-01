import { compare } from "bcrypt";
import jwt from "jsonwebtoken";

import { database, getSignSecret } from "@/database.js";
import { defineHandler } from "@/handlers.js";
import { User } from "@/model/user.js";

export default defineHandler("account", "getToken", async (options, data) => {
    let user: User;

    if ("username" in data) {
        user = await database
            .selectFrom("user")
            .where("username", "=", data.username)
            .selectAll()
            .executeTakeFirstOrThrow();
    } else {
        user = await database.selectFrom("user").where("email", "=", data.email).selectAll().executeTakeFirstOrThrow();
    }

    const passwordValid = await compare(data.hashedPassword, user.hashedPassword);

    if (!passwordValid) {
        return {
            status: "failed",
            reason: "invalid_password",
        };
    }

    const signSecret = await getSignSecret();

    const token = jwt.sign(
        {
            userId: user.userId,
        },
        signSecret,
        {
            expiresIn: "1 minute",
        }
    );

    return {
        status: "success",
        data: {
            token,
        },
    };
});
