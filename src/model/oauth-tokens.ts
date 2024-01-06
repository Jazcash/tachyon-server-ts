import { Generated, Selectable } from "kysely";

export type OauthTokenTable = {
    id: Generated<number>;
    userId: number;
    clientId: string;
    accessToken: string;
    accessTokenExpiry: Date;
    refreshToken: string;
    refreshTokenExpiry: Date;
};

export type OauthTokenRow = Selectable<OauthTokenTable>;
