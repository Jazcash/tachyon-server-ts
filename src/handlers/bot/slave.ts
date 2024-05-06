import { randomUUID } from "crypto";

import { autohostClientService } from "@/autohost-client-service.js";
import { HandlerService } from "@/handler-service.js";

export default HandlerService.defineHandler("autohost", "slave", async ({ client }) => {
    autohostClientService.slaveAutohostClient({
        autohostId: randomUUID(),
        ip: client.ipAddress,
        region: "TODO",
        battles: [],
        lobbies: [],
    });

    return {
        status: "success",
    };
});
