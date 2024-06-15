import { Generated, Insertable, Selectable, Updateable } from "kysely";

export type UserId = string;

export type UserTable = {
    userId: UserId;
    username: string;
    email?: string;
    hashedPassword?: string;
    steamId?: string;
    googleId?: string;
    displayName: string;
    //avatarUrl: string;
    friendIds: Generated<string[]>;
    outgoingFriendRequestIds: Generated<string[]>;
    incomingFriendRequestIds: Generated<string[]>;
    ignoreIds: Generated<string[]>;
    scopes: Generated<string[]>;
    clanId?: string;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
};

export type UserRow = Selectable<UserTable>;
export type InsertableUserRow = Insertable<UserTable>;
export type UpdateableUserRow = Updateable<UserTable>;
