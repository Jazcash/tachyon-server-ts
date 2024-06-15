import { MatchmakingPlaylist } from "@/model/matchmaking.js";

export type Config = {
    /** Will always re-import response handlers on every request, so handlers can be developed without restarting server. Disable for production. */
    hotLoadHandlers?: boolean;
    host?: string;
    port?: number;
    autohostPort?: number;
    accountVerification?: boolean;
    mail?: {
        port: number;
        host: string;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
        from: string;
    };
    logging?: boolean;
    steamAppId: number;
    steamWebApiKey: string;
    googleClientId: string;
    googleClientSecret: string;
    matchmakingPlaylists: MatchmakingPlaylist[];
};
