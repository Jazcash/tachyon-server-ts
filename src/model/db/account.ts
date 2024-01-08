import { Generated, GeneratedAlways, Insertable, Selectable, Updateable } from "kysely";

export type AccountTable = {
    accountId: GeneratedAlways<number>;
    steamId: string;
    displayName: string;
    avatarUrl: string;
    countryCode?: string;
    // friends: Generated<number[]>;
    // outgoingFriendRequestIds: Generated<number[]>;
    // incomiingFriendRequestIds: Generated<number[]>;
    // ignoreIds: Generated<number[]>;
    roles: Generated<string[]>;
    clanId: number | null;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
};

export type AccountRow = Selectable<AccountTable>;
export type InsertableAccountRow = Insertable<AccountTable>;
export type UpdateableAccountRow = Updateable<AccountTable>;
