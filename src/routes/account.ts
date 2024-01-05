import { FastifyPluginAsync } from "fastify";
import fetch from "node-fetch";

import { config } from "@/config.js";
import { SteamSessionTicketResponse } from "@/model/steam-session-ticket.js";
import { UserRow } from "@/model/user.js";
import { oidc } from "@/oidc-provider.js";

export const accountRoutes: FastifyPluginAsync = async function (fastify) {
    // fastify.post<{ Body: { email: string; password: string; displayName: string } }>(
    //     "/register",
    //     async (request, reply) => {
    //         try {
    //             const { email, password, displayName } = request.body;

    //             const hashedPassword = await hashPassword(password);

    //             const user = await database
    //                 .insertInto("user")
    //                 .values({
    //                     userId: randomUUID(),
    //                     email,
    //                     displayName,
    //                     hashedPassword,
    //                     verified: !config.accountVerification,
    //                     roles: [],
    //                     icons: {},
    //                     friends: [],
    //                     friendRequests: [],
    //                     ignores: [],
    //                 })
    //                 .returningAll()
    //                 .executeTakeFirstOrThrow();

    //             if (config.accountVerification) {
    //                 //await sendVerificationLink(user);
    //             }

    //             reply.code(200).send({ message: "User registered successfully." });
    //         } catch (err: any) {
    //             if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
    //                 const conflictColumn = err.message.split(": ")[1].split(".")[1];
    //                 if (conflictColumn === "email") {
    //                     return reply.code(400).send({ message: "An account with this email already exists." });
    //                 }
    //             }

    //             console.error(err);
    //             return reply.code(400).send({ message: "An unknown server error occurred." });
    //         }
    //     }
    // );

    fastify.get("/fish", async (req, reply) => {
        const accessToken = req.headers.authorization?.replace(/^Bearer /, "") ?? "";

        console.log(accessToken);

        if (accessToken) {
            // const test = await oidc.ClientCredentials.find(accessToken, { ignoreExpiration: true });

            // console.log(test);

            const test2 = await oidc.AccessToken.find(accessToken);

            console.log(test2);

            if (test2) {
                reply.send("yep");
            } else {
                reply.status(401);
            }
        } else {
            reply.status(401);
        }
    });

    fastify.get<{ Querystring: { ticket: string } }>("/steamauth", async (request, reply) => {
        const { ticket } = request.query;

        try {
            const query = new URLSearchParams({
                appid: config.steamAppId,
                key: config.steamWebApiKey,
                ticket,
            }).toString();

            const res = await fetch(`https://api.steampowered.com/ISteamUserAuth/AuthenticateUserTicket/v1?${query}`, {
                method: "GET",
            });

            const data = (await res.json()) as SteamSessionTicketResponse;

            reply.send(data);
        } catch (err) {
            console.log("error validating steam session token", err);
        }
    });
};

async function sendVerificationLink(user: UserRow, mailConfig: Exclude<typeof config.mail, undefined>) {
    // const mailOptions: MailOptions = {
    //     from: mailConfig.from,
    //     to: user.email,
    //     subject: `Beyond All Reason account verification`,
    //     text: `Click the following link to verify your account: http://your-website.com/verify/${verificationToken}`,
    // };
    // mail.sendMail();
    // fastify.get("/");
}
