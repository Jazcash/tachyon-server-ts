import { Generated, GeneratedAlways, Insertable, Selectable, Updateable } from "kysely";

export type UserTable = {
    userId: GeneratedAlways<number>;
    steamId: string;
    displayName: string;
    avatarUrl: string;
    countryCode?: string;
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
