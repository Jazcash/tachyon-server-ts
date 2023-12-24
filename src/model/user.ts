import { GeneratedAlways } from "kysely";
import { Generated, Insertable, Selectable, Updateable } from "kysely";

export type UserTable = {
    userId: GeneratedAlways<number>;
    steamId: string | null;
    googleId: string | null;
    displayName: string;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
};

export type UserRow = Selectable<UserTable>;
export type InsertableUserRow = Insertable<UserTable>;
export type UpdateableUserRow = Updateable<UserTable>;
