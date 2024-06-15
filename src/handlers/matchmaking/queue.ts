import { HandlerService } from "@/handler-service.js";
import { matchmakingService } from "@/matchmaking-service.js";

export default HandlerService.defineHandler("matchmaking/queue", async ({ client, data }) => {
    matchmakingService.addUserToQueues(client, data.queues);

    return {
        status: "success",
    };
});
