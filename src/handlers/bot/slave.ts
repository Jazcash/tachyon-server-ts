import { addAutohost } from "@/autohosts.js";
import { HandlerService } from "@/handler-service.js";

export default HandlerService.defineHandler("autohost", "slave", async ({ client }) => {
    addAutohost({
        ip: client.ipAddress,
        region: "TODO",
        battles: [],
        lobbies: [],
    });

    return {
        status: "success",
    };
});
