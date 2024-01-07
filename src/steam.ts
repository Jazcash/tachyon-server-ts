import { asArray } from "jaz-ts-utils";
import fetch from "node-fetch";

import { config } from "@/config.js";
import { SteamPlayerSummaryResponse as SteamPlayerSummary, SteamSessionTicketResponse } from "@/model/steam.js";

export async function authenticateSteamTicket(
    ticket?: string
): Promise<{ steamId: string } | "steam_banned" | "steam_session_ticket_missing" | "steam_auth_error"> {
    try {
        if (!ticket) {
            return "steam_session_ticket_missing";
        }

        const query = new URLSearchParams({
            appid: config.steamAppId,
            key: config.steamWebApiKey,
            ticket,
        }).toString();

        const res = await fetch(`https://api.steampowered.com/ISteamUserAuth/AuthenticateUserTicket/v1?${query}`, {
            method: "GET",
        });

        const data = (await res.json()) as SteamSessionTicketResponse;

        if ("result" in data.response.params) {
            if (data.response.params.vacbanned || data.response.params.publisherbanned) {
                return "steam_banned";
            }

            return {
                steamId: data.response.params.steamid,
            };
        } else {
            throw new Error("result not found in data.response.params");
        }
    } catch (error) {
        console.error(error);
        return "steam_auth_error";
    }
}

export async function getSteamPlayerSummaries(steamId: string): Promise<SteamPlayerSummary>;
export async function getSteamPlayerSummaries(steamIds: string[]): Promise<SteamPlayerSummary[]>;
export async function getSteamPlayerSummaries(
    steamIdOrIds: string | string[]
): Promise<SteamPlayerSummary | SteamPlayerSummary[]> {
    const steamIds = asArray(steamIdOrIds);

    const res = await fetch(
        `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${
            config.steamWebApiKey
        }&steamids=${steamIds.join(",")}`,
        {
            method: "GET",
        }
    );

    const data = (await res.json()) as { response: { players: Array<SteamPlayerSummary> } };

    if (Array.isArray(steamIdOrIds)) {
        return data.response.players;
    } else {
        return data.response.players[0];
    }
}
