import { AuthorizationRequest } from "@jmondi/oauth2-server";
import { Insertable } from "kysely";
import { Selectable } from "kysely";

export type SessionTable = {
    sessionId: string;
    userId?: string;
    googleId?: string;
    steamId?: string;
    auth?: AuthorizationRequest;
};

export type SessionRow = Selectable<SessionTable>;
export type SessionInsertRow = Insertable<SessionTable>;
