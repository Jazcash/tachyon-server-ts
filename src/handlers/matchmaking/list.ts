import { config } from "@/config.js";
import { HandlerService } from "@/handler-service.js";

export default HandlerService.defineHandler("matchmaking/list", async () => {
    return {
        status: "success",
        data: {
            playlists: config.matchmakingPlaylists,
        },
    };
});
