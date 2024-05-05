import { HandlerService } from "@/handler-service.js";
import { matchmakingService } from "@/matchmaking-service.js";

export default HandlerService.defineHandler("matchmaking", "cancel", async ({ client }) => {
    matchmakingService.removeUsersFromAllQueues(client.userId);

    return {
        status: "success",
    };
});
