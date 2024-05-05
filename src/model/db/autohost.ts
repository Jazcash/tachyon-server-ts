import { Generated, Insertable, Selectable, Updateable } from "kysely";

export type AutohostTable = {
    clientId: string;
    clientSecret: string;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
};

export type AutohostRow = Selectable<AutohostTable>;
export type InsertableAutohostRow = Insertable<AutohostTable>;
export type UpdateableAutohostRow = Updateable<AutohostTable>;
