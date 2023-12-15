import { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { PrivateUserClient } from "tachyon-protocol";

export type UserTable = Omit<PrivateUserClient, "userId" | "battleStatus"> & {
    userId: Generated<string>;
    steamId: number | null;
    hashedPassword: string;
    email: string;
    displayName: string;
    verified: boolean;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
};

export type UserRow = Selectable<UserTable>;
export type InsertableUserRow = Insertable<UserTable>;
export type UpdateableUserRow = Updateable<UserTable>;
