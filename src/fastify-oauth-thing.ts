import OAuth2Server from "@node-oauth/oauth2-server";

export class FastifyOauthThing implements OAuth2Server {
    authenticate(
        request: OAuth2Server.Request,
        response: OAuth2Server.Response,
        options?: OAuth2Server.AuthenticateOptions | undefined
    ): Promise<OAuth2Server.Token> {
        throw new Error("Method not implemented.");
    }

    authorize(
        request: OAuth2Server.Request,
        response: OAuth2Server.Response,
        options?: OAuth2Server.AuthorizeOptions | undefined
    ): Promise<OAuth2Server.AuthorizationCode> {
        throw new Error("Method not implemented.");
    }

    token(
        request: OAuth2Server.Request,
        response: OAuth2Server.Response,
        options?: OAuth2Server.TokenOptions | undefined
    ): Promise<OAuth2Server.Token> {
        throw new Error("Method not implemented.");
    }
}
