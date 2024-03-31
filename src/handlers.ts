import { Kysely } from "kysely";
import type { EndpointId, RequestData, ResponseData, ServiceId } from "tachyon-protocol";

import { DatabaseModel } from "@/model/db/database.js";
import { UserClient } from "@/model/user-client.js";

type HandlerArgs = {
    client: UserClient;
    database: Kysely<DatabaseModel>;
};

export const handlers: Map<
    string,
    {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseHandler: (args: HandlerArgs, data?: any) => Promise<any>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        postResponseHandler?: (args: HandlerArgs, data?: any) => Promise<void>;
    }
> = new Map();

export function defineHandler<
    S extends ServiceId,
    E extends EndpointId<S>,
    CB extends (args: HandlerArgs, data: RequestData<S, E>) => Promise<ResponseData<S, E>>,
    PostCB extends (args: HandlerArgs, data: RequestData<S, E>) => Promise<void>,
>(serviceId: S, endpointId: E, callback: CB, postResponseCallback?: PostCB) {
    handlers.set(`${serviceId}/${endpointId.toString()}`, {
        responseHandler: callback,
        postResponseHandler: postResponseCallback,
    });
}
