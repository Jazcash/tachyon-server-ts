import { RemoveField } from "jaz-ts-utils";
import { Kysely } from "kysely";
import type { GetCommands, RequestEndpointId, ServiceId } from "tachyon-protocol";

import { DatabaseModel } from "@/model/db/database.js";
import { UserClient } from "@/model/user-client.js";

type HandlerArgs = {
    client: UserClient;
    database: Kysely<DatabaseModel>;
};

export const handlers: Map<string, (args: HandlerArgs, data?: any) => Promise<any>> = new Map();

export function defineHandler<
    S extends ServiceId,
    E extends RequestEndpointId<S> & string,
    T extends GetCommands<S, E>,
    ReqData extends T extends { request: { data: infer Req } } ? Req : object,
    ResData extends T extends { response: infer Res } ? RemoveField<Res, "command"> : void,
    CB extends (args: HandlerArgs, data: ReqData) => Promise<ResData>,
>(serviceId: S, endpointId: E, callback: CB) {
    handlers.set(`${serviceId}/${endpointId}`, callback);
}
