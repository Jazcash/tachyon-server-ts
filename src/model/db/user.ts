import { Generated, GeneratedAlways, Insertable, Selectable, Updateable } from "kysely";

export type UserTable = {
    userId: GeneratedAlways<number>;
    //username: string;
    email?: string;
    hashedPassword?: string;
    steamId?: string;
    googleId?: string;
    displayName: string;
    //avatarUrl: string;
    friendIds: Generated<number[]>;
    outgoingFriendRequestIds: Generated<number[]>;
    incomingFriendRequestIds: Generated<number[]>;
    ignoreIds: Generated<number[]>;
    roles: Generated<string[]>;
    clanId?: number;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
};

export type UserRow = Selectable<UserTable>;
export type InsertableUserRow = Insertable<UserTable>;
export type UpdateableUserRow = Updateable<UserTable>;
