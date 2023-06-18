import { Kysely } from "kysely";
import type { EmptyObject, GetCommands, RemoveField, RequestEndpointId, ServiceId } from "tachyon/src/helpers";
import { Tachyon } from "tachyon/src/schema/index";

import { Client } from "@/client";
import { DatabaseModel } from "@/model/database";

type HandlerArgs = {
    client: Client;
    database: Kysely<DatabaseModel>;
};

export const handlers: Map<string, (args: HandlerArgs, data?: any) => Promise<any>> = new Map();

export function defineHandler<
    S extends ServiceId<Tachyon>,
    E extends RequestEndpointId<Tachyon, S> & string,
    T extends GetCommands<Tachyon, S, E>,
    ReqData extends T extends { request: { data: infer Req } } ? Req : EmptyObject,
    ResData extends T extends { response: infer Res } ? RemoveField<Res, "command"> : void,
    CB extends (args: HandlerArgs, data: ReqData) => Promise<ResData>
>(serviceId: S, endpointId: E, callback: CB) {
    handlers.set(`${serviceId}/${endpointId}`, callback);
}
