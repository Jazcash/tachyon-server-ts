import { FastifyPluginAsync } from "fastify";

export const testRoutes: FastifyPluginAsync = async function (fastify) {
    fastify.post("/test", async (request, reply) => {
        console.log("test!");

        //const test = await oidc

        // const body = new URLSearchParams();
        // if (!request.headers.authorization) return reply.code(401);
        // body.append("token", request.headers.authorization.replace(/^Bearer /, ""));
        // body.append("client_id", process.env.CLIENT_ID as string);
        // body.append("client_secret", process.env.CLIENT_SECRET as string);
        // const url = `${process.env.AUTH_ISSUER}/token/introspection`;
        // const response = await fetch(url, {
        //     method: "POST",
        //     headers: {
        //         ["Content-Type"]: "application/x-www-form-urlencoded",
        //     },
        //     body: body,
        // });
        // if (response.status !== 200) reply.code(401);
        // const json = (await response.json()) as any;
        // const { active, aud } = json;

        // // Resource URI and audience (aud) must be equal
        // if (active && aud.trim() === request.url.split("?")[0]) {
        //     request.session.set() = json;
        //     await next();
        // } else {
        //     reply.code(401);
        // }
    });
};

// // Check if scope is valid
// function authorize(...scopes: string[]): RouteHandler {
//   return async (request, reply) => {
//     const session = request.cookies["session"];

//     if (session && scopes.every((scope) => session.scope.includes(scope))) {
//       reply.send();
//     } else {
//       reply.status(401).send();
//     }
//   };
// }
