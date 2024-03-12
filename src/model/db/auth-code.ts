import { CodeChallengeMethod } from "@jmondi/oauth2-server";
import { Generated, Insertable, Selectable, Updateable } from "kysely";

export type AuthCodeTable = {
    code: string;
    redirectUri?: string | null;
    codeChallenge?: string | null;
    codeChallengeMethod?: CodeChallengeMethod | null;
    expiresAt: Date;
    userId?: string | null;
    clientId: string;
    scopes: string[];
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
};

export type AuthCodeRow = Selectable<AuthCodeTable>;
export type InsertableAuthCodeRow = Insertable<AuthCodeTable>;
export type UpdateableAuthCodeRow = Updateable<AuthCodeTable>;
