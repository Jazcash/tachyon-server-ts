import { fastifyCookie } from "@fastify/cookie";
import { fastifyCsrfProtection } from "@fastify/csrf-protection";
import fastifyFormbody from "@fastify/formbody";
import { fastifyHelmet } from "@fastify/helmet";
import fastifyMultipart from "@fastify/multipart";
import { fastifyOauth2, OAuth2Namespace } from "@fastify/oauth2";
import { fastifySession } from "@fastify/session";
import { fastifyView } from "@fastify/view";
import fastifyWebsocket from "@fastify/websocket";
import { AuthorizationRequest } from "@jmondi/oauth2-server";
import chalk from "chalk";
import Fastify from "fastify";
import handlebars from "handlebars";
import handlebarsHelpers from "handlebars-helpers";
import path, { dirname } from "path";
import { tachyonMeta } from "tachyon-protocol";
import { fileURLToPath } from "url";

import { config } from "@/config.js";
import { dbSessionStore } from "@/db-session-store.js";
import { UserRow } from "@/model/db/user.js";
import { indexRoute } from "@/routes/index.js";
import { loginRoutes } from "@/routes/login.js";
import { logoutRoute } from "@/routes/logout.js";
import { oauthRoutes } from "@/routes/oauth.js";
import { registerRoutes } from "@/routes/register.js";
import { getSignSecret } from "@/utils/get-sign-secret.js";

declare module "fastify" {
    interface FastifyInstance {
        googleOAuth2: OAuth2Namespace;
    }
    interface Session {
        auth?: AuthorizationRequest;
        googleId?: string;
        steamId?: string;
        user?: UserRow;
    }
}

const __dirname = dirname(fileURLToPath(import.meta.url));

export const fastify = Fastify({
    trustProxy: true,
    logger: {
        level: "warn",
        file: "fastify.log",
    },
});

fastify.setErrorHandler((err, req, reply) => {
    console.error(err);
    reply.send(err);
});

const hbs = handlebars.create();
const helpers = handlebarsHelpers();
for (const key in helpers) {
    hbs.registerHelper(key, helpers[key]);
}

await fastify.register(fastifyWebsocket, {
    options: {
        handleProtocols: (protocols, request) => {
            return `tachyon-${tachyonMeta.version}`;
        },
        //verifyClient: authorizeSocketConnection,
    },
});
await fastify.register(fastifyCookie, { secret: await getSignSecret() });
await fastify.register(fastifySession, { secret: await getSignSecret(), cookie: { secure: false }, store: dbSessionStore }); // TODO: use fastifySecureSession instead? secure cookie should be true for https
await fastify.register(fastifyHelmet, { enableCSPNonces: true });
await fastify.register(fastifyCsrfProtection, { cookieOpts: { signed: true } });
await fastify.register(fastifyMultipart, { attachFieldsToBody: true });
await fastify.register(fastifyFormbody);
await fastify.register(fastifyView, {
    engine: { handlebars: hbs },
    root: path.join(__dirname, "./views"),
    options: {
        partials: {
            layout: "layout.hbs",
        },
    },
});

fastify.register(fastifyOauth2, {
    name: "googleOAuth2",
    scope: ["openid"],
    credentials: {
        client: {
            id: config.googleClientId,
            secret: config.googleClientSecret,
        },
    },
    startRedirectPath: "/login/google",
    callbackUri: "http://127.0.0.1:3005/login/google/callback",
    discovery: {
        issuer: "https://accounts.google.com",
    },
});

await fastify.register(registerRoutes);
await fastify.register(loginRoutes);
await fastify.register(logoutRoute);
await fastify.register(oauthRoutes);
await fastify.register(indexRoute);

export async function startHttpServer() {
    try {
        await fastify.listen({ port: config.port });
        console.log(chalk.green(`Tachyon Server listening on ${fastify.listeningOrigin}, serving Tachyon v${tachyonMeta.version}`));
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

export async function stopHttpServer() {
    await fastify.close();
}
