import { Generated, Insertable, Selectable, Updateable } from "kysely";

export type UserTable = {
    userId: string;
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
    roles: Generated<string[]>;
    clanId?: string;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
};

export type UserRow = Selectable<UserTable>;
export type InsertableUserRow = Insertable<UserTable>;
export type UpdateableUserRow = Updateable<UserTable>;
