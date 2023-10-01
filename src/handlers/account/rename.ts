import { database } from "@/database.js";
import { defineHandler } from "@/handlers.js";

export default defineHandler("account", "rename", async (options, data) => {
    const user = options.client.user!;

    await database
        .updateTable("user")
        .set({
            username: data.newUsername,
        })
        .where("userId", "=", user.userId)
        .executeTakeFirstOrThrow();

    return {
        status: "success",
    };
});
