import { database } from "@/database.js";
import { hashPassword } from "@/utils/hash-password.js";

export async function generateDummyData() {
    // TODO: return if env is prod

    await database
        .insertInto("user")
        .values({
            userId: "1",
            email: "test@tachyontest.com",
            username: "dummy",
            hashedPassword: await hashPassword("fish"),
            displayName: "Dummy User",
        })
        .onConflict((oc) => oc.doNothing())
        .execute();

    await database
        .insertInto("user")
        .values({
            userId: "2",
            email: "test2@tachyontest.com",
            username: "dummy2",
            hashedPassword: await hashPassword("fish"),
            displayName: "Dummy User 2",
        })
        .onConflict((oc) => oc.doNothing())
        .execute();
}
