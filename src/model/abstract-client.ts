import chalk from "chalk";
import { EndpointId, GenericResponseCommand, ResponseType, ServiceId, tachyonMeta } from "tachyon-protocol";
import * as validators from "tachyon-protocol/validators";
import { Data, WebSocket } from "ws";

import { handlerService } from "@/handler-service.js";
import { ResponseError } from "@/model/response-error.js";

export abstract class AbstractClient {
    public socket: WebSocket;

    constructor(socket: WebSocket) {
        this.socket = socket;

        this.socket.on("message", (data) => this.handleRequest(data));
    }

    public sendResponse(responseCommand: ResponseType): void {
        const [serviceId, endpointId, commandType] = responseCommand.commandId.split("/");

        const validatorId = `${serviceId}_${endpointId}_${commandType}`;
        const validator = validators[validatorId as keyof typeof validators];

        if (!validator) {
            console.error(`No response schema or validator found for ${serviceId}/${endpointId}`);
            return;
        }

        const isValid = validator(responseCommand);
        if (!isValid) {
            console.error("Response validation failed");
            console.error(validator.errors);
            throw new Error(`Response validation failed for ${serviceId}/${endpointId}`);
        }

        this.socket.send(JSON.stringify(responseCommand));
    }

    protected async handleRequest(message: Data): Promise<void> {
        const jsonStr = message.toString();

        try {
            const request = JSON.parse(jsonStr) as { commandId: `${string}/${string}/request`; messageId: string; data?: object };
            const [serviceId, endpointId] = request.commandId.split("/", 2);

            if (!this.isValidServiceId(serviceId)) {
                throw new Error(`Invalid ServiceId: ${serviceId}`);
            }

            if (!this.isValidEndpointId(serviceId, endpointId)) {
                throw new Error(`Invalid EndpointId: ${endpointId}`);
            }

            const response: any = {
                commandId: `${serviceId}/${endpointId}/response`,
                messageId: request.messageId,
            };

            const handler = await handlerService.getHandler(serviceId, endpointId as EndpointId<typeof serviceId>);

            if (!handler) {
                response.status = "failed";
                response.reason = "command_unimplemented";

                this.sendResponse(response);
                return;
            }

            const validator = validators[`${serviceId}_${endpointId}_request` as keyof typeof validators];

            if (!validator) {
                throw new Error(`No request validator found for command: ${request.commandId}`);
            }

            const isValid = validator(request);
            if (!isValid) {
                console.error(`Request command validation failed for ${serviceId}/${endpointId}:`);
                console.error(validator.errors);

                response.status = "failed";
                response.reason = "invalid_request";

                this.sendResponse(response);
                return;
            }

            try {
                // @ts-ignore
                const responseData = (await handler.requestHandler({ client: this, database, data: request.data })) as Omit<
                    GenericResponseCommand,
                    "commandId" | "messageId"
                >;

                if (responseData) {
                    Object.assign(response, responseData);
                }
            } catch (err) {
                if (err instanceof ResponseError) {
                    Object.assign(response, {
                        status: "failed",
                        reason: err.reason,
                    });
                } else {
                    console.error(chalk.redBright(`Uncaught error in handler for ${serviceId}/${endpointId}:`));
                    console.error(chalk.red(err));
                    Object.assign(response, {
                        status: "failed",
                        reason: "internal_error",
                    });
                }
            }

            this.sendResponse(response);

            if (handler.postHandler) {
                // @ts-ignore
                await handler.postHandler({ client: this, database, data: request.data });
            }
        } catch (err) {
            console.error(`received message:`, jsonStr);
            console.error(`Error parsing request`, err);
        }
    }

    protected isValidServiceId(serviceId: string): serviceId is ServiceId {
        return serviceId in tachyonMeta.ids;
    }

    protected isValidEndpointId(serviceId: ServiceId, endpointId: string): boolean {
        return endpointId in tachyonMeta.ids[serviceId];
    }
}
