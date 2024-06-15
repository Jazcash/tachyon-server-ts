import { HandlerService } from "@/handler-service.js";
import { matchmakingService } from "@/matchmaking-service.js";

export default HandlerService.defineHandler("matchmaking/ready", async ({ client }) => {
    matchmakingService.setUserReady(client);

    return {
        status: "success",
    };
});
