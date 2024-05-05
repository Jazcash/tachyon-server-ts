import { randomUUID } from "crypto";

import { autohostService } from "@/autohost-service.js";
import { HandlerService } from "@/handler-service.js";

export default HandlerService.defineHandler("autohost", "slave", async ({ client }) => {
    autohostService.slaveAutohost({
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
