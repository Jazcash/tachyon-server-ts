import { FastifyPluginAsync } from "fastify";
import { InteractionResults } from "oidc-provider";
import { generators } from "openid-client";

import { database } from "@/database.js";
import { UserRow } from "@/model/user.js";
import { codeVerifier, googleClient, googleRedirectUrl, oidc } from "@/oidc-provider.js";
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
            return reply.code(501).send("Not implemented.");
        }
    });

    fastify.post<{ Body: { email?: string; password?: string } }>("/interaction/:uid/login", async (req, reply) => {
        const { prompt } = await oidc.interactionDetails(req.raw, reply.raw);

        if (prompt.name === "login") {
            let result: InteractionResults = {
                error: "access_denied",
                message: "Username or password is incorrect.",
            };

            try {
                if (req.body.email && req.body.password) {
                    const user = await database
                        .selectFrom("user")
                        .where("email", "=", req.body.email)
                        .selectAll()
                        .executeTakeFirstOrThrow();

                    if (!user.hashedPassword) {
                        throw new Error("Hashed password is null");
                    }

                    const passwordCorrect = await comparePassword(req.body.password, user.hashedPassword);

                    if (passwordCorrect) {
                        result = {
                            login: {
                                accountId: user.userId.toString(),
                            },
                        };
                    } else {
                        throw new Error("Invalid password");
                    }
                }
            } catch (err) {
                console.error(err);
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

                return oidc.interactionFinished(req.raw, reply.raw, result, {
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

        return oidc.interactionFinished(req.raw, reply.raw, result, {
            mergeWithLastSubmission: false,
        });
    });

    fastify.get("/interaction/callback/google", async (req, reply) => {
        const params = googleClient.callbackParams(req.raw);
        const tokenSet = await googleClient.callback(googleRedirectUrl, params, {
            code_verifier: codeVerifier,
            response_type: "code",
        });
        const claims = tokenSet.claims();
        const googleAccountId = claims.sub.toString();

        let user: UserRow | undefined;

        user = await database.selectFrom("user").where("googleId", "=", googleAccountId).selectAll().executeTakeFirst();

        if (!user) {
            user = await database
                .insertInto("user")
                .values({
                    displayName: "Player",
                    verified: true,
                    googleId: googleAccountId,
                    roles: [],
                    icons: {},
                    friends: [],
                    friendRequests: [],
                    ignores: [],
                })
                .returningAll()
                .executeTakeFirstOrThrow();
        }

        await oidc.interactionFinished(
            req.raw,
            reply.raw,
            {
                login: {
                    accountId: user.userId.toString(),
                },
            },
            {
                mergeWithLastSubmission: false,
            }
        );

        return reply.status(200).send("Authorization complete, you may now close this window.");
    });

    fastify.get("/interaction/:uid/google", async (req, reply) => {
        const authUrl = googleClient.authorizationUrl({
            scope: "openid",
            code_challenge: generators.codeChallenge(codeVerifier),
            code_challenge_method: "S256",
        });

        reply.redirect(303, authUrl);
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
