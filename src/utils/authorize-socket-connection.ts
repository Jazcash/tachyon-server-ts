import { IncomingMessage } from "http";
import WebSocket from "ws";

export const authorizeSocketConnection:
    | WebSocket.VerifyClientCallbackAsync<IncomingMessage>
    | WebSocket.VerifyClientCallbackSync<IncomingMessage>
    | undefined = (info, next) => {
    next(true);
};
