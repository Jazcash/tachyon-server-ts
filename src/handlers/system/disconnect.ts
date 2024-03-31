import { defineHandler } from "@/handlers.js";

export default defineHandler(
    "system",
    "disconnect",
    async (options, data) => {
        return {
            status: "success",
        };
    },
    async (options, data) => {
        options.client.socket.close();
    }
);
