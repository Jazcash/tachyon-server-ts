import { SessionStore } from "@fastify/session";
import { Session } from "fastify";

import { database } from "@/database.js";
import { SessionInsertRow } from "@/model/db/session.js";

export const dbSessionStore: SessionStore = {
    async set(sessionId: string, session: Session, callback: (err?: any) => void): Promise<void> {
        try {
            const values: SessionInsertRow = {
                sessionId,
                steamId: session.steamId,
                googleId: session.googleId,
                userId: session.user?.userId,
                auth: session.auth,
            };

            await database
                .insertInto("session")
                .values(values)
                .onConflict((oc) => oc.doUpdateSet(values))
                .executeTakeFirstOrThrow();

            callback();
        } catch (err) {
            callback(err);
        }
    },
    async get(sessionId: string, callback: (err: any, result?: Session | null | undefined) => void): Promise<void> {
        try {
            const storedSessionData = await database.selectFrom("session").where("sessionId", "=", sessionId).selectAll().executeTakeFirst();

            if (!storedSessionData) {
                return callback(null, null);
            }

            const session: Session = {
                cookie: {
                    originalMaxAge: null,
                },
                auth: storedSessionData.auth,
                googleId: storedSessionData.googleId,
                steamId: storedSessionData.steamId,
                user: storedSessionData.userId
                    ? await database.selectFrom("user").where("userId", "=", storedSessionData.userId).selectAll().executeTakeFirst()
                    : undefined,
            };

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
