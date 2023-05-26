import WebSocket, { Data, Server, ServerOptions } from "ws";
import type { Tachyon } from "../tachyon/src/schema";
import { ServiceId, ResponseType, ResponseEndpointId, RequestEndpointId, RequestType } from "../tachyon/src/helpers";
import { Signal } from "jaz-ts-utils";

import Ajv, { ValidateFunction } from "ajv";
import fs from "fs";
import path from "path";

type Handlers = {
    [serviceId in keyof Tachyon as string]?: {
        [endpointId in keyof Tachyon[serviceId] as Tachyon[serviceId][endpointId] extends { response: any } ? endpointId & string : never]: Tachyon[serviceId][endpointId] extends { response: infer Res }
            ? Tachyon[serviceId][endpointId] extends { request: { data: infer Req } }
                ? (data: Req) => Res extends { command: string } ? Promise<Omit<Res, "command">> : never
                : () => Res extends { command: string } ? Promise<Omit<Res, "command">> : never
            : never;
    };
};

const ajv = new Ajv({ coerceTypes: true });
const validators: Map<string, ValidateFunction> = new Map();

const services = fs.readdirSync("./tachyon/schema");
for (const serviceId of services.filter((s) => !s.endsWith(".json"))) {
    const endpoints = fs.readdirSync(path.join("./tachyon/schema", serviceId));
    for (const endpointId of endpoints) {
        const commands = fs.readdirSync(path.join("./tachyon/schema", serviceId, endpointId));
        for (const command of commands) {
            const schema = JSON.parse(fs.readFileSync(path.join("./tachyon/schema", serviceId, endpointId, command), "utf-8"));
            const validator = ajv.compile(schema);
            const commandId = path.parse(command).name;
            validators.set(`${serviceId}/${endpointId}/${commandId}`, validator);
        }
    }
}

const handlers = (() => {
    return {
        auth: {
            register: async (data) => {
                return {
                    status: "success"
                }
            },
            getToken: async (data) => {
                return {
                    status: "success"
                }
            }
        }
    }
}) satisfies () => Handlers;

export class TachyonServer {
    protected wss: Server;
    protected clients: Client[] = [];

    constructor(options?: ServerOptions) {
        this.wss = new Server(options);

        this.wss.addListener("connection", (socket) => {
            const client = new Client(socket);
            this.clients.push(client);

            socket.on("close", () => {
                this.clients.splice(this.clients.indexOf(client), 1);
            });
        });
    }
}

class Client {
    protected socket: WebSocket;
    protected requestSignals: Map<string, Signal> = new Map();
    protected handlers: Handlers;

    constructor(socket: WebSocket) {
        this.socket = socket;

        this.handlers = handlers();

        socket.on("message", (data) => this.handleRequest(data));

        this.sendResponse("init", "init", {
            status: "success",
            data: {
                tachyonVersion: "1.2",
            },
        });
    }

    public on<S extends ServiceId<Tachyon>, E extends RequestEndpointId<Tachyon, S>>(serviceId: S, endpointId: E) : Signal<RequestType<Tachyon, S, E>> {
        const commandId = `${serviceId}/${endpointId.toString()}/request`;
        let signal = this.requestSignals.get(commandId);
        if (!signal) {
            signal = new Signal();
            this.requestSignals.set(commandId, signal);
        }

        return signal;
    }

    protected async handleRequest(message: Data) {
        try {
            const request = JSON.parse(message.toString()) as { command: `${string}/${string}/request`, data?: object }; // TODO: parse this against an AJV validator
            const signal = this.requestSignals.get(request.command);
            if (signal) {
                signal.dispatch(request);
            }
    
            const [ serviceId, endpointId, commandType ] = request.command.split("/");
            const service = this.handlers[serviceId];
            if (service) {
                const handler = service[endpointId as keyof typeof service] as ((data?: any) => Promise<any>) | undefined;
                if (handler) {
                    const response = await handler(request.data)
                    this.sendResponse(serviceId as any, endpointId as any, response as any);
                }
            }
        } catch (err) {
            console.error(`Error parsing request`, err);
        }
    }

    protected sendResponse<S extends ServiceId<Tachyon>, E extends ResponseEndpointId<Tachyon, S>>(service: S, endpoint: E, data: Omit<ResponseType<Tachyon, S, E>, "command">) {
        const validator = validators.get(`${service}/${endpoint.toString()}/response`);

        if (!validator) {
            console.error(`No schema or validator found for response: ${service}/${endpoint.toString()}`);
            return;
        }

        const commandId = `${service}/${endpoint.toString()}/response`;

        const response = {
            command: commandId,
            ...data,
        } as ResponseType<Tachyon, S, E>;

        const isValid = validator(response);
        if (!isValid) {
            console.error(`Error validating response: ${commandId}:`);
            console.error(response);
            console.error(validator.errors);
            return;
        }

        this.socket.send(JSON.stringify(response));
    }

    // protected validateRequest(request: any) : { command: string, data: object } | never {
    //     return {
            
    //     };
    // }
}

class User {}
