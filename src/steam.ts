import { asArray } from "jaz-ts-utils";
import fetch from "node-fetch";

import { config } from "@/config.js";
import { SteamPlayerSummaryResponse as SteamPlayerSummary, SteamSessionTicketResponse } from "@/model/steam.js";

export async function authenticateSteamTicket(ticket: string): Promise<{ steamId: string }> {
    if (!ticket) {
        throw new Error("steam:session_ticket_missing");
    }

    const query = new URLSearchParams({
        appid: config.steamAppId.toString(),
        key: config.steamWebApiKey,
        ticket,
    }).toString();

    const res = await fetch(`https://api.steampowered.com/ISteamUserAuth/AuthenticateUserTicket/v1?${query}`, {
        method: "GET",
    });

    const data = (await res.json()) as SteamSessionTicketResponse;

    if ("error" in data.response) {
        if (data.response.error.errorcode === 101) {
            throw new Error("steam:invalid_session_ticket");
        } else if (data.response.error.errorcode === 3) {
            throw new Error("steam:invalid_parameter");
        } else {
            throw new Error(`steam:${data.response.error.errordesc}`);
        }
    } else {
        if (data.response.params.vacbanned || data.response.params.publisherbanned) {
            throw new Error("steam:banned");
        }

        return {
            steamId: data.response.params.steamid,
        };
    }
}

export async function getSteamPlayerSummaries(steamId: string): Promise<SteamPlayerSummary>;
export async function getSteamPlayerSummaries(steamIds: string[]): Promise<SteamPlayerSummary[]>;
export async function getSteamPlayerSummaries(steamIdOrIds: string | string[]): Promise<SteamPlayerSummary | SteamPlayerSummary[]> {
    const steamIds = asArray(steamIdOrIds);

    const res = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.steamWebApiKey}&steamids=${steamIds.join(",")}`, {
        method: "GET",
    });

    const data = (await res.json()) as { response: { players: Array<SteamPlayerSummary> } };

    if (Array.isArray(steamIdOrIds)) {
        return data.response.players;
    } else {
        return data.response.players[0];
    }
}
