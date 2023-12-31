import { Generated, GeneratedAlways, Insertable, Selectable, Updateable } from "kysely";
import type { PrivateUserClient } from "tachyon-protocol";

export type UserTable = Omit<PrivateUserClient, "userId" | "battleStatus"> & {
    userId: GeneratedAlways<number>;
    email: string | null;
    hashedPassword: string | null;
    steamId: string | null;
    googleId: string | null;
    verified: boolean;
    displayName: string;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
};

export type UserRow = Selectable<UserTable>;
export type InsertableUserRow = Insertable<UserTable>;
export type UpdateableUserRow = Updateable<UserTable>;
