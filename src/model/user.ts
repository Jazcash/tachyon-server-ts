import { Generated, Selectable } from "kysely";
import type { PrivateUserClient } from "tachyon-protocol";

export type UserTable = Omit<PrivateUserClient, "userId" | "battleStatus"> & {
    userId: Generated<number>;
    steamId: number | null;
    hashedPassword: string;
    email: string;
    displayName: string;
    verified: boolean;
};

export type User = Selectable<UserTable>;
