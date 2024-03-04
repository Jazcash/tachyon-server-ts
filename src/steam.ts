import { asArray } from "jaz-ts-utils";
import fetch from "node-fetch";

import { config } from "@/config.js";
import { SteamPlayerSummaryResponse as SteamPlayerSummary } from "@/model/steam.js";

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
