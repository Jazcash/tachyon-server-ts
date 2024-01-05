import { randomBytes } from "crypto";
import { FastifyPluginAsync } from "fastify";
import { InteractionResults } from "oidc-provider";

import { database } from "@/database.js";
import { UserRow } from "@/model/user.js";
import { googleClient, oidc } from "@/oidc-provider.js";
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
                nonce: reply.cspNonce.script,
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
                nonce: reply.cspNonce.script,
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
                error_description: "Username or password is incorrect.",
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
            error_description: "End-User aborted interaction",
        };

        return oidc.interactionFinished(req.raw, reply.raw, result, {
            mergeWithLastSubmission: false,
        });
    });

    fastify.get<{ Params: { uid: string } }>("/interaction/:uid/google", async (req, reply) => {
        const nonce = randomBytes(32).toString("hex");
        const state = `${req.params.uid}|${nonce}`;
        //const path = `/interaction/${req.params.uid}/google`;

        const authUrl = googleClient.authorizationUrl({
            state,
            nonce,
            scope: "openid",
        });

        return (
            reply
                //.setCookie("google.state", state, { path, sameSite: "strict" })
                //.setCookie("google.nonce", nonce, { path, sameSite: "strict" })
                .redirect(303, authUrl)
        );
    });

    fastify.get("/interaction/callback/google", async (req, reply) => {
        return reply.view("/src/views/repost.ejs", { strategy: "google", nonce: reply.cspNonce.script });
    });

    fastify.get("/test", async (req, reply) => {
        reply.send("test");
    });

    fastify.post<{ Params: { uid: string }; Body: { id_token: string; state: string } }>(
        "/interaction/:uid/google",
        async (req, reply) => {
            const tokenSet = await googleClient.callback(
                undefined,
                {
                    id_token: req.body.id_token,
                    state: req.body.state,
                },
                {
                    state: req.body.state,
                    nonce: req.body.state.split("|")[1],
                    response_type: "id_token",
                }
            );

            const claims = tokenSet.claims();
            const googleAccountId = claims.sub.toString();

            let user: UserRow | undefined;

            user = await database
                .selectFrom("user")
                .where("googleId", "=", googleAccountId)
                .selectAll()
                .executeTakeFirst();

            if (!user) {
                user = await database
                    .insertInto("user")
                    .values({
                        displayName: "Player",
                        verified: true,
                        googleId: googleAccountId,
                        roles: [],
                        friends: [],
                        friendRequests: [],
                        ignores: [],
                    })
                    .returningAll()
                    .executeTakeFirstOrThrow();
            }

            return oidc.interactionFinished(
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
        }
    );
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
