import chalk from "chalk";
import { tachyonMeta } from "tachyon-protocol";
import { WebSocketServer } from "ws";

import { config } from "@/config.js";
import { fastify } from "@/http.js";
import { authenticateSteamTicket, getSteamPlayerSummaries } from "@/steam.js";
import { userClientService } from "@/user-client-service.js";
import { userService } from "@/user-service.js";

export const wss = new WebSocketServer({
    handleProtocols: (protocols, request) => {
        return `tachyon-${tachyonMeta.version}`;
    },
    server: fastify.server,
});

wss.addListener("connection", async (socket, request) => {
    if (!request.headers.authorization) {
        socket.close(1000, "authorization_header_missing");
        return;
    }

    const steamSessionTicket = request.headers.authorization.split(" ")[1];

    const steamAuthResult = await authenticateSteamTicket(steamSessionTicket);

    if (typeof steamAuthResult === "string") {
        socket.close(1000, steamAuthResult);
        return;
    }

    const steamInfo = await getSteamPlayerSummaries(steamAuthResult.steamId);

    let user = await userService.getUserBySteamId(steamAuthResult.steamId);

    if (user) {
        await userService.updateUser(user.userId, {
            displayName: steamInfo.personaname,
            avatarUrl: steamInfo.avatar,
            countryCode: steamInfo.loccountrycode,
        });
    } else {
        user = await userService.createUser({
            steamId: steamAuthResult.steamId,
            displayName: steamInfo.personaname,
            avatarUrl: steamInfo.avatar,
            countryCode: steamInfo.loccountrycode,
        });
    }

    userClientService.addUserClient(socket, user);
});

export function startWssServer() {
    return new Promise<void>((resolve) => {
        wss.addListener("listening", () => {
            console.log(
                chalk.green(
                    `Tachyon ${tachyonMeta.version} WebSocket Server now listening on ws://127.0.0.1:${config.port}`
                )
            );

            resolve();
        });
    });
}
