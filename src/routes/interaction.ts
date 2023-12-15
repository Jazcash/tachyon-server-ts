import { FastifyPluginAsync } from "fastify";
import { InteractionResults } from "oidc-provider";

import { database } from "@/database.js";
import { oidc } from "@/oidc-provider.js";
import { comparePassword } from "@/utils/hash-password.js";

function debug(obj: any) {
    return Object.entries(obj)
        .map((ent: [string, any]) => `<strong>${ent[0]}</strong>: ${JSON.stringify(ent[1])}`)
        .join("<br>");
}

export const interactionRoutes: FastifyPluginAsync = async function (fastify) {
    fastify.get("/interaction/:uid", async (request, reply) => {
        const { uid, prompt, params, session } = await oidc.interactionDetails(request.raw, reply.raw);

        if (prompt.name === "login" && isInteractionParams(params)) {
            return reply.view("/src/views/login.ejs", {
                uid,
                details: prompt.details,
                params,
                session: session ? debug(session) : undefined,
                title: "Sign-In",
                dbg: {
                    params: debug(params),
                    prompt: debug(prompt),
                },
            });
        } else if (prompt.name === "consent" && isInteractionParams(params)) {
            return reply.view("/src/views/consent.ejs", {
                uid,
                title: "Authorize",
                clientId: params.client_id,
                scope: params.scope.replace(/ /g, ", "),
                session: session ? debug(session) : undefined,
                dbg: {
                    params: debug(params),
                    prompt: debug(prompt),
                },
            });
        } else {
            reply.code(501).send("Not implemented.");
        }
    });

    fastify.post<{ Body: { email: string; password: string } }>("/interaction/:uid/login", async (req, reply) => {
        const {
            prompt: { name },
        } = await oidc.interactionDetails(req.raw, reply.raw);

        if (name === "login") {
            let result: InteractionResults | undefined;

            try {
                const user = await database
                    .selectFrom("user")
                    .where("email", "=", req.body.email)
                    .selectAll()
                    .executeTakeFirstOrThrow();

                const passwordCorrect = await comparePassword(req.body.password, user.hashedPassword);

                if (passwordCorrect) {
                    result = {
                        login: {
                            accountId: user.userId,
                        },
                    };
                } else {
                    throw new Error("Invalid password");
                }
            } catch (err) {
                result = {
                    error: "access_denied",
                    message: "Username or password is incorrect.",
                };
            }

            return oidc.interactionFinished(req.raw, reply.raw, result, {
                mergeWithLastSubmission: false,
            });
        }
    });

    fastify.post("/interaction/:uid/confirm", async (req, reply) => {
        const interactionDetails = await oidc.interactionDetails(req.raw, reply.raw);

        if (interactionDetails.prompt.name === "consent") {
            const grant = interactionDetails.grantId
                ? await oidc.Grant.find(interactionDetails.grantId)
                : new oidc.Grant({
                      accountId: interactionDetails.session?.accountId,
                      clientId: interactionDetails.params.client_id as string,
                  });

            if (grant) {
                const missingOIDCScope = interactionDetails.prompt.details.missingOIDCScope;
                if (missingOIDCScope && Array.isArray(missingOIDCScope)) {
                    grant.addOIDCScope(missingOIDCScope.join(" "));
                }

                const missingOIDCClaims = interactionDetails.prompt.details.missingOIDCClaims;
                if (missingOIDCClaims && Array.isArray(missingOIDCClaims)) {
                    grant.addOIDCClaims(missingOIDCClaims);
                }

                const missingResourceScopes = interactionDetails.prompt.details.missingResourceScopes as
                    | Record<string, string[]>
                    | undefined;
                if (missingResourceScopes) {
                    for (const [indicator, scopes] of Object.entries(missingResourceScopes)) {
                        grant.addResourceScope(indicator, scopes.join(" "));
                    }
                }

                const grantId = await grant.save();

                const result = { consent: { grantId } };

                await oidc.interactionFinished(req.raw, reply.raw, result, {
                    mergeWithLastSubmission: true,
                });
            }
        } else {
            return reply.status(400).send("Interaction prompt type must be 'consent'.");
        }
    });

    fastify.get("/interaction/:uid/abort", async (req, reply) => {
        const result: InteractionResults = {
            error: "access_denied",
            message: "End-User aborted interaction",
        };

        await oidc.interactionFinished(req.raw, reply.raw, result, {
            mergeWithLastSubmission: false,
        });
    });
};

function isInteractionParams(params: any): params is {
    client_id: string;
    code_challenge: string;
    code_challenge_method: string;
    redirect_uri: string;
    response_type: string;
    scope: string;
} {
    return "response_type" in params;
}
