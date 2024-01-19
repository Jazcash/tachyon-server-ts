import { randomBytes } from "node:crypto";

import { database } from "@/database.js";
import { SettingRow } from "@/model/db/setting.js";

let signSecret: string | undefined;

export async function getSignSecret() {
    if (signSecret) {
        return signSecret;
    }

    let signSecretResult: SettingRow | undefined;

    signSecretResult = await database
        .selectFrom("setting")
        .where("key", "=", "signSecret")
        .selectAll()
        .executeTakeFirst();

    if (!signSecretResult) {
        signSecretResult = await database
            .insertInto("setting")
            .values({
                key: "signSecret",
                value: randomBytes(48).toString("hex"),
            })
            .returningAll()
            .executeTakeFirstOrThrow();
    }

    signSecret = signSecretResult.value;

    return signSecret;
}
