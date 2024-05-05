import chalk from "chalk";
import fs from "fs";
import { Kysely } from "kysely";
import type { EndpointId, RequestData, ResponseData, ServiceId } from "tachyon-protocol";

import { config } from "@/config.js";
import { DatabaseModel } from "@/model/db/database.js";
import { UserClient } from "@/model/user-client.js";

type HandlerArgs<S extends ServiceId, E extends EndpointId<S>> = {
    client: UserClient;
    database: Kysely<DatabaseModel>;
    data: RequestData<S, E>;
};

type Handler<S extends ServiceId, E extends EndpointId<S>> = {
    requestHandler: (args: HandlerArgs<S, E>) => Promise<ResponseData<S, E>>;
    postHandler?: (args: HandlerArgs<S, E>) => Promise<void>;
};

export class HandlerService {
    public static defineHandler<
        S extends ServiceId,
        E extends EndpointId<S>,
        CB extends Handler<S, E>["requestHandler"],
        PostCB extends Handler<S, E>["postHandler"],
    >(serviceId: S, endpointId: E, requestHandler: CB, postHandler?: PostCB) {
        return { requestHandler, postHandler };
    }

    protected handlers: Map<string, Handler<ServiceId, EndpointId<ServiceId>>> = new Map();

    public async getHandler<S extends ServiceId, E extends EndpointId<S>>(serviceId: S, endpointId: E & string) {
        let handler = this.handlers.get(`${serviceId}/${endpointId}`);

        if (!handler || config.hotLoadHandlers) {
            const handlerModuleExists = fs.existsSync(`./src/handlers/${serviceId}/${endpointId}.ts`);
            if (handlerModuleExists) {
                const hotReloadQueryStr = config.hotLoadHandlers ? `?${Date.now()}` : "";
                const { default: importedHandler } = await import(`./handlers/${serviceId}/${endpointId}.ts${hotReloadQueryStr}`);
                handler = importedHandler as Handler<S, E>;

                this.handlers.set(`${serviceId}/${endpointId}`, handler);
            } else {
                console.error(chalk.red(`Received request for unimplemented command handler: ${serviceId}/${endpointId}`));
            }
        }

        return handler;
    }
}

export const handlerService = new HandlerService();
