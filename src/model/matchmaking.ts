export type MatchmakingPlaylist = {
    id: string;
    name: string;
    numOfTeams: number;
    teamSize: number;
    ranked: boolean;
};

export type MatchmakingQueue = {
    playlistId: string;
    userIds: Set<string>;
};
