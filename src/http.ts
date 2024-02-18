import { fastifyCookie } from "@fastify/cookie";
import { fastifyCsrfProtection } from "@fastify/csrf-protection";
import fastifyFormbody from "@fastify/formbody";
import { fastifyHelmet } from "@fastify/helmet";
import fastifyMultipart from "@fastify/multipart";
import { fastifyOauth2, OAuth2Namespace } from "@fastify/oauth2";
import { fastifySession } from "@fastify/session";
import { fastifyView } from "@fastify/view";
import { AuthorizationRequest } from "@jmondi/oauth2-server";
import chalk from "chalk";
import Fastify from "fastify";
import handlebars from "handlebars";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import { config } from "@/config.js";
import { dbSessionStore } from "@/db-session-store.js";
import { UserRow } from "@/model/db/user.js";
import { homeRoute } from "@/routes/home.js";
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
    //logger: true,
});

fastify.setErrorHandler((err, req, reply) => {
    console.error(err);
    reply.send(err);
});

await fastify.register(fastifyCookie, { secret: await getSignSecret() });
await fastify.register(fastifySession, { secret: await getSignSecret(), cookie: { secure: false }, store: dbSessionStore }); // TODO: use fastifySecureSession instead? secure cookie should be true for https
await fastify.register(fastifyHelmet, { enableCSPNonces: true });
await fastify.register(fastifyCsrfProtection, { cookieOpts: { signed: true } });
await fastify.register(fastifyMultipart, { attachFieldsToBody: true });
await fastify.register(fastifyFormbody);
await fastify.register(fastifyView, {
    engine: { handlebars },
    root: path.join(__dirname, "./views"),
    options: {
        partials: {
            layout: "layout.hbs",
        },
    },
});

/** @ts-expect-error https://github.com/fastify/fastify-oauth2/issues/249 */
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

await fastify.register(homeRoute);
await fastify.register(registerRoutes);
await fastify.register(loginRoutes);
await fastify.register(logoutRoute);
await fastify.register(oauthRoutes);

export async function startHttpServer() {
    try {
        await fastify.listen({ port: config.port });
        console.log(chalk.green(`Tachyon Server listening on ${fastify.listeningOrigin}`));
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

export async function stopHttpServer() {
    await fastify.close();
}
