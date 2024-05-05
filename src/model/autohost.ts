import { Battle } from "@/model/battle.js";
import { Lobby } from "@/model/lobby.js";

export type Autohost = {
    id: string;
    ip: string;
    region: string;
    lobbies: Lobby[];
    battles: Battle[];
};
