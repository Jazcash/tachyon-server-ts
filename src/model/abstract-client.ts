import { Signal } from "jaz-ts-utils";
import { GetCommands, TachyonCommand, TachyonEvent, TachyonRequest, TachyonResponse } from "tachyon-protocol";
import * as validators from "tachyon-protocol/validators";
import type { Except } from "type-fest";
import { MessageEvent, WebSocket } from "ws";

import { config } from "@/config.js";
import { database } from "@/database.js";
import { handlerService } from "@/handler-service.js";

export abstract class AbstractClient {
    public socket: WebSocket;

    protected responseHandlers: Map<string, Signal<TachyonResponse>> = new Map();
    protected eventHandlers: Map<string, Signal<TachyonEvent>> = new Map();

    constructor(socket: WebSocket) {
        this.socket = socket;

        this.socket.addEventListener("message", (message) => {
            try {
                this.handleMessage(message);
            } catch (err) {
                console.error(`Error handling message: ${err}`);
                console.error(message.data.toString());
            }
        });
    }

    public sendEvent(eventData: Except<TachyonEvent, "type" | "messageId">) {
        if (!this.socket) {
            throw new Error("Not connected to server");
        }

        const command = {
            type: "event",
            messageId: "0",
            ...eventData,
        } as TachyonEvent;

        this.validateCommand(command);

        this.socket.send(JSON.stringify(command));
        this.log("OUTGOING EVENT", command);
    }

    protected handleMessage(message: MessageEvent) {
        const obj = JSON.parse(message.data.toString());

        if (!this.isCommand(obj)) {
            throw new Error(`Message does not match expected command structure`);
        }

        this.validateCommand(obj);

        if (obj.type === "request") {
            this.handleRequest(obj);
        } else if (obj.type === "response") {
            this.handleResponse(obj);
        } else if (obj.type === "event") {
            this.handleEvent(obj);
        } else {
            throw new Error(`Unknown command type: ${obj.type}`);
        }
    }

    protected async handleRequest(command: TachyonRequest) {
        this.log("INCOMING REQUEST", command);

        const handler = await handlerService.getHandler(command.commandId);

        if (!handler) {
            const response: TachyonResponse = {
                type: "response",
                commandId: command.commandId,
                messageId: command.messageId,
                status: "failed",
                reason: "command_unimplemented",
            };
            this.validateCommand(response);

            this.socket.send(JSON.stringify(response));
            return;
        }

        // @ts-ignore
        const responseContent = (await handler.requestHandler({ client: this, database, data: command.data })) as Omit<
            TachyonResponse,
            "commandId" | "messageId" | "type"
        >;

        const response = {
            type: "response",
            commandId: command.commandId,
            messageId: command.messageId,
            ...responseContent,
        } as TachyonResponse;

        this.validateCommand(response);

        this.log("OUTGOING RESPONSE", response);
        this.socket?.send(JSON.stringify(response));
    }

    protected async handleResponse(command: TachyonResponse) {
        const signal = this.responseHandlers.get(command.commandId);
        if (signal) {
            signal.dispatch(command as GetCommands<"user" | "autohost", "server", "response">);
        }
    }

    protected async handleEvent(command: TachyonEvent) {
        const signal = this.eventHandlers.get(command.commandId);
        if (signal) {
            signal.dispatch(command);
        }
    }

    protected validateCommand(command: TachyonCommand) {
        const commandId = command.commandId;
        const validatorId = `${commandId}/${command.type}`.replaceAll("/", "_") as keyof typeof validators;
        const validator = validators[validatorId];

        if (!validator) {
            console.error(`No validator found with id: ${validatorId}`);
            throw new Error(`command_validation_failed`);
        }

        const isValid = validator(command);
        if (!isValid) {
            console.error(`Command validation failed for ${commandId}`);
            console.error(validator.errors);
            throw new Error(`command_validation_failed`);
        }
    }

    protected isCommand(obj: unknown): obj is TachyonCommand {
        return typeof obj === "object" && obj !== null && "commandId" in obj && "messageId" in obj && "type" in obj;
    }

    protected log(...args: Parameters<typeof console.log>) {
        if (config.logging) {
            console.log(...args);
        }
    }
}
