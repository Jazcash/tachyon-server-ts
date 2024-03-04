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
    if (!request.headers.authorization) {
        socket.close(1000, "authorization_header_missing");
        return;
    }

    const [authKey, authValue] = request.headers.authorization.split(" ");

    if (authKey === "Bearer") {
        const token = await getAccessToken(authValue);
        const user = await userService.getUserById(token.userId);
        if (!user) {
            return socket.close(1000, "user_not_found");
        }
        userClientService.addUserClient(socket, user);
        // } else if (authKey === "SteamSessionTicket") {
        //     const steamAuthResult = await authenticateSteamTicket(authValue);
        //     if (typeof steamAuthResult === "string") {
        //         socket.close(1000, steamAuthResult);
        //         return;
        //     }
        //     user = await userService.getUserBySteamId(steamAuthResult.steamId);
        //     const steamInfo = await getSteamPlayerSummaries(steamAuthResult.steamId);
        //     const steamUpdateData: Pick<UserRow, "displayName" | "avatarUrl"> = {
        //         displayName: steamInfo.personaname,
        //         avatarUrl: steamInfo.avatar,
        //     };
        //     if (user) {
        //         await userService.updateUser(user.userId, steamUpdateData);
        //     } else {
        //         user = await userService.createUser({
        //             steamId: steamAuthResult.steamId,
        //             ...steamUpdateData,
        //         });
        //     }
    } else {
        return socket.close(1000, "invalid_authorization_header");
    }
});

export function startWssServer() {
    return new Promise<void>((resolve) => {
        wss.addListener("listening", () => {
            resolve();
        });
    });
}
