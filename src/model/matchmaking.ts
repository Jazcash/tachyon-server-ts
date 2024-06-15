import { UserClient } from "@/model/user-client.js";

export type PlaylistId = string;

export type MatchmakingPlaylist = {
    id: PlaylistId;
    name: string;
    numOfTeams: number;
    teamSize: number;
    ranked: boolean;
};

export type MatchmakingQueue = {
    playlist: MatchmakingPlaylist;
    users: UserClient[];
};

export type MatchId = string;

export type Match = {
    matchId: MatchId;
    playlistId: string;
    users: UserClient[];
    readyUsers: Set<UserClient>;
};
