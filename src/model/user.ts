import { Generated, Selectable } from "kysely";
import { PrivateUserClient } from "tachyon/src/schema/types";

export type UserTable = Omit<PrivateUserClient, "userId" | "battleStatus"> & {
    userId: Generated<number>;
    hashedPassword: string;
    email: string;
    username: string;
};

export type User = Selectable<UserTable>;
