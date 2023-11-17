import bcryptjs from "bcryptjs";
import { MailOptions } from "nodemailer/lib/json-transport/index.js";

import { config } from "@/config.js";
import { database } from "@/database.js";
import { defineHandler } from "@/handlers.js";
import { User } from "@/model/user.js";

const hash = bcryptjs.hash;

export default defineHandler("account", "register", async (options, data) => {
    try {
        const hashedPassword = await hash(data.hashedPassword, 10); // second hash

        const user = await database
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
            .returningAll()
            .executeTakeFirstOrThrow();

        if (config.accountVerification) {
            await sendVerificationLink(user);
        }

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

async function sendVerificationLink(user: User, mailConfig: Exclude<typeof config.mail, undefined>) {
    const mailOptions: MailOptions = {
        from: mailConfig.from,
        to: user.email,
        subject: `Beyond All Reason account verification`,
        text: `Click the following link to verify your account: http://your-website.com/verify/${verificationToken}`,
    };

    // mail.sendMail();

    // fastify.get("/");
}
