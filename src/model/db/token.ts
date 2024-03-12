import { Generated, Insertable, Selectable, Updateable } from "kysely";

export type TokenTable = {
    accessToken: string;
    accessTokenExpiresAt: Date;
    refreshToken?: string | null;
    refreshTokenExpiresAt?: Date | null;
    clientId: string;
    userId: string;
    scopes: string[];
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
};

export type TokenRow = Selectable<TokenTable>;
export type InsertableTokenRow = Insertable<TokenTable>;
export type UpdateableTokenRow = Updateable<TokenTable>;
