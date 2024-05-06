export type JWTToken = {
    client_id?: string;
    user_id?: string;
    expires_at?: number;
    scope?: string;
    access_token_id?: string;
    refresh_token_id?: string;
    iat?: number;
    jti?: string;
};
