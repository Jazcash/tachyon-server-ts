import { Generated, Insertable, Selectable, Updateable } from "kysely";

export type AutohostTable = {
    autohostId: string;
    clientId: string;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
};

export type AutohostRow = Selectable<AutohostTable>;
export type InsertableAutohostRow = Insertable<AutohostTable>;
export type UpdateableAutohostRow = Updateable<AutohostTable>;
