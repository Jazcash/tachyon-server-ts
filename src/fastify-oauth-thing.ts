import OAuth2Server, { UnauthorizedRequestError } from "@node-oauth/oauth2-server";
import { FastifyReply, FastifyRequest } from "fastify";

export type FastifyOAuth2ServerConfig = OAuth2Server.ServerOptions & {
    useErrorHandler?: boolean;
};

export class FastifyOAuth2Server {
    protected oauthServer: OAuth2Server;
    protected useErrorHandler: boolean;

    constructor(config: FastifyOAuth2ServerConfig) {
        this.oauthServer = new OAuth2Server(config);

        this.useErrorHandler = config.useErrorHandler ?? false;
    }

    public async authenticate(
        req: FastifyRequest,
        reply: FastifyReply,
        options?: OAuth2Server.AuthenticateOptions | undefined
    ) {
        const oauthRequest = new OAuth2Server.Request(req);
        const oauthResponse = new OAuth2Server.Response(reply);

        let token: OAuth2Server.Token;
        try {
            token = await this.oauthServer.authenticate(oauthRequest, oauthResponse, options);
        } catch (err) {
            this.handleError(reply, null, err);
            return;
        }

        this.handleResponse(req, reply, oauthResponse);

        return token;
    }

    public authorize(options?: OAuth2Server.AuthorizeOptions | undefined) {
        return async (req: FastifyRequest, reply: FastifyReply) => {
            const oauthRequest = new OAuth2Server.Request(req);
            const oauthResponse = new OAuth2Server.Response(reply);

            let code: OAuth2Server.AuthorizationCode;
            try {
                code = await this.oauthServer.authorize(oauthRequest, oauthResponse, options);
            } catch (err) {
                this.handleError(reply, null, err);
                return;
            }

            this.handleResponse(req, reply, oauthResponse);

            return code;
        };
    }

    public token(options?: OAuth2Server.TokenOptions | undefined) {
        return async (req: FastifyRequest, reply: FastifyReply) => {
            const oauthRequest = new OAuth2Server.Request(req);
            const oauthResponse = new OAuth2Server.Response(reply);

            let token: OAuth2Server.Token;
            try {
                token = await this.oauthServer.token(oauthRequest, oauthResponse, options);
            } catch (err) {
                this.handleError(reply, null, err);
                return;
            }

            this.handleResponse(req, reply, oauthResponse);

            return token;
        };
    }

    protected handleResponse(req: FastifyRequest, reply: FastifyReply, oauthResponse: OAuth2Server.Response) {
        if (oauthResponse.status === 302) {
            const location = oauthResponse.headers?.location;
            delete oauthResponse.headers?.location;
            if (oauthResponse.headers) {
                reply.headers(oauthResponse.headers);
            }
            if (location) {
                reply.redirect(location);
            }
        }
        if (oauthResponse.headers) {
            reply.headers(oauthResponse.headers);
        }
        reply.status(oauthResponse.status ?? 200).send(oauthResponse.body);
    }

    protected handleError(reply: FastifyReply, oauthResponse: OAuth2Server.Response | null, error: unknown) {
        if (this.useErrorHandler) {
            return;
        }

        if (oauthResponse?.headers) {
            reply.headers(oauthResponse.headers);
        }

        reply.status(
            typeof error === "object" && error !== null && "code" in error && typeof error.code === "number"
                ? error.code
                : 500
        );

        if (error instanceof UnauthorizedRequestError) {
            return reply.status(401);
        }

        return reply.send(error);
    }
}
