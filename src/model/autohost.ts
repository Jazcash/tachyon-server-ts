import { Battle } from "@/model/battle.js";

export type Autohost = {
    id: string;
    ip: string;
    region: string;
    battles: Battle[];
};
