import { HandlerService } from "@/handler-service.js";

export default HandlerService.defineHandler("matchmaking", "queue", async ({ client }) => {
    const userId = client.userId;

    return {
        status: "success",
    };
});
