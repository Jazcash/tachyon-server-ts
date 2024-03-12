export type Battle = {
    lobbyId: string | null;
    ip: string;
    port: number;
    runtimeMs: number;
    engine: string;
    game: string;
    map: string;
    playerIds: string[];
    spectatorIds: string[];
};
