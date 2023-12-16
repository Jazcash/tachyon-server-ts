import { FastifyPluginAsync } from "fastify";

function debug(obj: any) {
    return Object.entries(obj)
        .map((ent: [string, any]) => `<strong>${ent[0]}</strong>: ${JSON.stringify(ent[1])}`)
        .join("<br>");
}

export const introspectionRoutes: FastifyPluginAsync = async function (fastify) {
    // fastify.get("/token/introspection", async (req, reply) => {
    //     reply.send("Introspection!");
    // });
};
