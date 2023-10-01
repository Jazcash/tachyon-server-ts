import { Battle } from "@/model/battle.js";
import { Lobby } from "@/model/lobby.js";

export type Autohost = {
    ip: string;
    region: string;
    lobbies: Lobby[];
    battles: Battle[];
};
