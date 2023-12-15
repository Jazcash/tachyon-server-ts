import { Generated, Insertable, Selectable, Updateable } from "kysely";

export type OidcTable = {
    id: string;
    type: number;
    payload?: object;
    grantId?: string | undefined;
    userCode?: string | undefined;
    uid?: string | undefined;
    expiresAt?: Date | undefined;
    consumedAt?: Date | undefined;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
};

export type OidcRow = Selectable<OidcTable>;
export type InsertableOidcRowRow = Insertable<OidcTable>;
export type UpdateableOidcRowRow = Updateable<OidcTable>;
