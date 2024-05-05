import { UserClient } from "@/model/user-client.js";

export type MatchmakingPlaylist = {
    id: string;
    name: string;
    numOfTeams: number;
    teamSize: number;
    ranked: boolean;
};

export type MatchmakingQueue = {
    playlist: MatchmakingPlaylist;
    users: UserClient[];
};
