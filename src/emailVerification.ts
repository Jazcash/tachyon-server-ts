import jwt from "jsonwebtoken";

import { database, getSignSecret } from "@/database.js";
import { fastify } from "@/http.js";

fastify.get<{
    Params: {
        token: string;
    };
}>("/verify/:token", async (request, reply) => {
    const token = request.params.token;

    const signSecret = await getSignSecret();
    const payload = jwt.verify(token, signSecret);

    try {
        if (typeof payload === "object" && "userId" in payload) {
            await database
                .updateTable("user")
                .set({
                    verified: true,
                })
                .where("userId", "=", payload.userId)
                .executeTakeFirstOrThrow();

            return "verified";
        }
    } catch (err) {
        console.error(err);
        return "error";
    }
});
