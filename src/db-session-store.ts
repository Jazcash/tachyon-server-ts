import { SessionStore } from "@fastify/session";
import { Session } from "fastify";

import { database } from "@/database.js";

export const dbSessionStore: SessionStore = {
    async set(sessionId: string, session: Session, callback: (err?: any) => void): Promise<void> {
        try {
            if (session.user) {
                await database
                    .insertInto("session")
                    .values({ sessionId, userId: session.user.userId })
                    .onConflict((oc) => oc.doUpdateSet({ userId: session.user?.userId }))
                    .executeTakeFirstOrThrow();
            }

            callback();
        } catch (err) {
            callback(err);
        }
    },
    async get(sessionId: string, callback: (err: any, result?: Session | null | undefined) => void): Promise<void> {
        try {
            const storedSessionData = await database.selectFrom("session").where("sessionId", "=", sessionId).selectAll().executeTakeFirstOrThrow();

            const session: Session = {
                cookie: {
                    originalMaxAge: null,
                },
            };

            if (storedSessionData.userId) {
                const user = await database.selectFrom("user").where("userId", "=", storedSessionData.userId).selectAll().executeTakeFirstOrThrow();
                session.user = user;
            }

            callback(null, session);
        } catch (err) {
            callback(err);
        }
    },
    async destroy(sessionId: string, callback: (err?: any) => void): Promise<void> {
        try {
            await database.deleteFrom("session").where("sessionId", "=", sessionId).executeTakeFirstOrThrow();

            callback();
        } catch (err) {
            callback(err);
        }
    },
};
