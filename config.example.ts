// eslint-disable-next-line no-restricted-imports
import { Config } from "./src/model/config.js";

export default {
    hotLoadHandlers: true,
    host: "0.0.0.0",
    port: 3005,
    accountVerification: false,
    steamAppId: 480,
    steamWebApiKey: "looks_like_DCDF2512E051CC260AB22D3F13C536F7",
    googleClientId: "looks_like_1047182226627-sb70sggfiq4bukf7swr69e44el2lmql47.apps.googleusercontent.com ",
    googleClientSecret: "looks_like_GCCSPX-XY6OcY2umc8b1Ub2eOvFpd3npx-W",
    matchmakingPlaylists: [
        {
            id: "1v1",
            name: "Duel",
            numOfTeams: 2,
            teamSize: 1,
            ranked: true,
        },
    ],
} satisfies Config;
