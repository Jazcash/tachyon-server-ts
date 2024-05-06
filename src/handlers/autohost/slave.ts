import { autohostClientService } from "@/autohost-client-service.js";
import { HandlerService } from "@/handler-service.js";

export default HandlerService.defineHandler("autohost", "slave", async ({ client }) => {
    autohostClientService.slaveAutohostClient(client);

    return {
        status: "success",
    };
});
