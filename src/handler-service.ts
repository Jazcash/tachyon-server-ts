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

type Handler = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    responseHandler: (args: HandlerArgs<any, any>) => Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    postResponseHandler?: (args: HandlerArgs<any, any>) => Promise<void>;
};

export class HandlerService {
    public static defineHandler<
        S extends ServiceId,
        E extends EndpointId<S>,
        CB extends (args: HandlerArgs<S, E>) => Promise<ResponseData<S, E>>,
        PostCB extends (args: HandlerArgs<S, E>) => Promise<void>,
    >(serviceId: S, endpointId: E, callback: CB, postResponseCallback?: PostCB) {
        return { serviceId, endpointId, callback, postResponseCallback };
    }

    protected handlers: Map<string, Handler> = new Map();

    public async getHandler<S extends ServiceId, E extends EndpointId<S>>(serviceId: S, endpointId: E & string) {
        let handler = this.handlers.get(`${serviceId}/${endpointId}`);

        if (!handler || config.hotLoadHandlers) {
            const handlerModuleExists = fs.existsSync(`./src/handlers/${serviceId}/${endpointId}.ts`);
            if (handlerModuleExists) {
                const hotReloadQueryStr = config.hotLoadHandlers ? `?${Date.now()}` : "";

                const tempHandler: {
                    serviceId: S;
                    endpointId: E;
                    responseHandler: (args: HandlerArgs<S, E>) => Promise<ResponseData<S, E>>;
                    postResponseCallback?: (args: HandlerArgs<S, E>) => Promise<void>;
                } = (await import(`./handlers/${serviceId}/${endpointId}.ts${hotReloadQueryStr}`)).default;

                handler = {
                    responseHandler: tempHandler.responseHandler,
                    postResponseHandler: tempHandler.postResponseCallback,
                };

                this.handlers.set(`${serviceId}/${endpointId}`, handler);
            } else {
                console.error(chalk.red(`Received request for unimplemented command handler: ${serviceId}/${endpointId}`));
            }
        }

        return handler;
    }
}

export const handlerService = new HandlerService();
