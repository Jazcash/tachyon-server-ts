import { Selectable } from "kysely";

export type SessionTable = {
    sessionId: string;
    userId?: number;
};

export type SessionRow = Selectable<SessionTable>;
