import { defineHandler } from "@/handlers.js";

export default defineHandler("system", "disconnect", async (options, data) => {
    options.client.sendResponse("system", "disconnected", {
        status: "success",
    });

    options.client.ws.close();
});
