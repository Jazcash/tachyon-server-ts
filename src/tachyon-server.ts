import WebSocket, { Data, Server, ServerOptions } from "ws";
import type { Tachyon } from "../tachyon/src/schema";

import Ajv from "ajv";
import fs from "fs";
import path from "path";

type ServiceId = keyof Tachyon;
type EndpointId<S extends ServiceId> = keyof Tachyon[S];
type ResponseEndpointId<S extends ServiceId> = keyof {
    [key in keyof Tachyon[S] as Tachyon[S][key] extends { response: any } ? key : never]: Tachyon[S][key];
};
type A = ResponseEndpointId<"init">;
// type ResponseCommands = {
//     [serviceId in keyof Tachyon]: {
//         [endpointId in keyof Tachyon[serviceId]]: Tachyon[serviceId][endpointId] extends { response: infer Res } ? Res : never;
//     }[keyof Tachyon[serviceId]];
// }[keyof Tachyon];
type Response<S extends ServiceId, E extends ResponseEndpointId<S>> = Tachyon[S][E] extends { response: infer Res } ? Res : {};

type Handlers = {
    [serviceId in keyof Tachyon]?: {
        [endpointId in keyof Tachyon[serviceId] as Tachyon[serviceId][endpointId] extends { response: any } ? endpointId : never]: Tachyon[serviceId][endpointId] extends { response: infer Res }
            ? Tachyon[serviceId][endpointId] extends { request: { data: infer Req } }
                ? (data: Req) => Res extends { command: string } ? Omit<Res, "command"> : never
                : () => Res extends { command: string } ? Omit<Res, "command"> : never
            : never;
    };
};

const ajv = new Ajv({ coerceTypes: true });
const validators: Map<string, Ajv.ValidateFunction> = new Map();

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

const handlers: Handlers = {
    auth: {
        register: (data) => {
            return {
                status: "success",
            };
        },
        getToken: (data) => {
            return {
                status: "failed",
                reason: "invalid_password",
            };
        },
    },
};

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

    constructor(socket: WebSocket) {
        this.socket = socket;

        // this.sendResponse("init", "init", {
        //     status: "success",
        //     data: {
        //         tachyonVersion: "1.0.0",
        //     },
        // });

        this.sendResponse("init", "init", {
            status: "success",
            data: {
                tachyonVersion: "1.2",
            },
        });

        socket.on("message", (data) => this.handleRequest(data));
    }

    protected handleRequest(data: Data) {
        console.log(data);
    }

    protected sendResponse<S extends ServiceId, E extends ResponseEndpointId<S>>(service: S, endpoint: E, data: Omit<Response<S, E>, "command">) {
        const validator = validators.get(`${service}/${endpoint.toString()}/response`);

        if (!validator) {
            console.error(`No schema or validator found for response: ${service}/${endpoint.toString()}`);
            return;
        }

        const commandId = `${service}/${endpoint.toString()}/response`;

        const response = {
            command: commandId,
            ...data,
        } as Response<S, E>;

        const isValid = validator(response);
        if (!isValid) {
            console.error(`Error validating response: ${commandId}:`);
            console.error(response);
            console.error(validator.errors);
            return;
        }

        this.socket.send(JSON.stringify(response));
    }
}

class User {}
