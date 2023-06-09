import { Generated, Selectable } from "kysely";
import type { PrivateUserClient } from "tachyon";

export type UserTable = Omit<PrivateUserClient, "userId" | "battleStatus"> & {
    userId: Generated<number>;
    hashedPassword: string;
    email: string;
    username: string;
};

export type User = Selectable<UserTable>;
