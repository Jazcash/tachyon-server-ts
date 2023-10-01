import { defineHandler } from "@/handlers.js";
export default defineHandler("lobby", "create", async (options, data) => {
    // if (slaves.length === 0) {
    //     return {
    //         status: "failed",
    //         reason: "no_hosts_available",
    //     };
    // }

    return {
        status: "success",
    };
});
