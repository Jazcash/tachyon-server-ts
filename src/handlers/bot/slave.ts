import { addAutohost } from "@/autohosts.js";
import { defineHandler } from "@/handlers.js";

export default defineHandler("bot", "slave", async (options, data) => {
    const ip = options.client.socket.remoteAddress;
    if (!ip) {
        return {
            status: "failed",
            reason: "internal_error",
        };
    }

    addAutohost({
        ip,
        region: "TODO",
        battles: [],
        lobbies: [],
    });

    return {
        status: "success",
    };
});
