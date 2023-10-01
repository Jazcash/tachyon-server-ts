export type Battle = {
    lobbyId: number | null;
    ip: string;
    port: number;
    runtimeMs: number;
    engine: string;
    game: string;
    map: string;
    playerIds: number[];
    spectatorIds: number[];
};
