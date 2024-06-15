import chalk from "chalk";
import fs from "fs";
import { Kysely } from "kysely";
import { GetCommandData, GetCommandIds, GetCommands, TachyonActor, tachyonMeta } from "tachyon-protocol";

import { config } from "@/config.js";
import { AutohostClient } from "@/model/autohost-client.js";
import { DatabaseModel } from "@/model/db/database.js";
import { UserClient } from "@/model/user-client.js";

type HandlerArgs<C extends GetCommandIds<"autohost" | "user", "server", "request">> = {
    client: C extends GetCommandIds<"autohost", "server", "request"> ? AutohostClient : UserClient;
    database: Kysely<DatabaseModel>;
    data: GetCommandData<GetCommands<"autohost" | "user", "server", "request", C>>;
};

type Handler<C extends GetCommandIds<"autohost" | "user", "server", "request">> = {
    requestHandler: (args: HandlerArgs<C>) => Promise<Omit<GetCommands<TachyonActor, TachyonActor, "response", C>, "commandId" | "messageId" | "type">>;
    postHandler?: (args: HandlerArgs<C>) => Promise<void>;
};

export class HandlerService {
    constructor() {
        this.preloadHandlers();
    }

    public static defineHandler<
        C extends GetCommandIds<"autohost" | "user", "server", "request">,
        CB extends Handler<C>["requestHandler"],
        PostCB extends Handler<C>["postHandler"],
    >(commandId: C, requestHandler: CB, postHandler?: PostCB) {
        return { requestHandler, postHandler };
    }

    protected handlers: Map<GetCommandIds, Handler<GetCommandIds<"autohost" | "user", "server", "request">>> = new Map();

    public async getHandler<C extends GetCommandIds>(commandId: C) {
        let handler = this.handlers.get(commandId);

        const [serviceId, endpointId] = (commandId as string).split("/");

        if (!handler || config.hotLoadHandlers) {
            const handlerModuleExists = fs.existsSync(`./src/handlers/${serviceId}/${endpointId}.ts`);
            if (handlerModuleExists) {
                const hotReloadQueryStr = config.hotLoadHandlers ? `?${Date.now()}` : "";
                const { default: importedHandler } = await import(`./handlers/${serviceId}/${endpointId}.ts${hotReloadQueryStr}`);
                handler = importedHandler as Handler<GetCommandIds<"autohost" | "user", "server", "request">>;

                this.handlers.set(commandId, handler);
            } else {
                console.error(chalk.red(`Received request for unimplemented command handler: ${serviceId}/${endpointId}`));
            }
        }

        return handler;
    }

    protected async preloadHandlers() {
        tachyonMeta.schema.actors.server.response.send.forEach(async (commandId) => {
            const handlerModuleExists = fs.existsSync(`./src/handlers/${commandId}.ts`);
            if (handlerModuleExists) {
                const { default: importedHandler } = await import(`./handlers/${commandId}.ts`);
                const handler = importedHandler as Handler<GetCommandIds<"autohost" | "user", "server", "request">>;
                this.handlers.set(commandId, handler);
            } else {
                console.error(chalk.red(`Unimplemented request command handler: ${commandId}`));
            }
        });
    }
}

export const handlerService = new HandlerService();
