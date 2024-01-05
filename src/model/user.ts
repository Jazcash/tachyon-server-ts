import { Generated, GeneratedAlways, Insertable, Selectable, Updateable } from "kysely";

export type UserTable = {
    userId: GeneratedAlways<number>;
    email: string | null;
    hashedPassword: string | null;
    steamId: string | null;
    googleId: string | null;
    verified: boolean;
    displayName: string;
    friends: Generated<number[]>;
    friendRequests: Generated<number[]>;
    ignores: Generated<number[]>;
    roles: Generated<string[]>;
    clanId: number | null;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
};

export type UserRow = Selectable<UserTable>;
export type InsertableUserRow = Insertable<UserTable>;
export type UpdateableUserRow = Updateable<UserTable>;
