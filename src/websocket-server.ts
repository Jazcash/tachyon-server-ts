import { NoResultError } from "kysely";
import { tachyonMeta } from "tachyon-protocol";
import { WebSocketServer } from "ws";

import { getAccessToken } from "@/auth/validation.js";
import { fastify } from "@/http.js";
import { userClientService } from "@/user-client-service.js";
import { userService } from "@/user-service.js";

export const wss = new WebSocketServer({
    handleProtocols: (protocols, request) => {
        return `tachyon-${tachyonMeta.version}`;
    },
    server: fastify.server,
});

wss.addListener("connection", async (socket, request) => {
    try {
        if (!request.headers.authorization) {
            throw new Error("authorization_header_missing");
        }

        const [authKey, authValue] = request.headers.authorization.split(" ");

        if (authKey === "Bearer") {
            const token = await getAccessToken(authValue);
            const user = await userService.getUserById(token.userId);
            if (!user) {
                throw new Error("user_not_found");
            }
            userClientService.addUserClient(socket, user);
        } else {
            throw new Error("invalid_authorization_header");
        }
    } catch (err) {
        let message = "unknown_error";
        if (err instanceof Error) {
            if (err instanceof NoResultError) {
                message = "Access Token not found";
            } else {
                message = err.message;
            }
        }
        socket.close(1000, message);
        console.error(err);
    }
});

export function startWssServer() {
    return new Promise<void>((resolve) => {
        wss.addListener("listening", () => {
            resolve();
        });
    });
}
