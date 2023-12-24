import { Authenticator } from "@fastify/passport";
import { Strategy as BearerStrategy } from "passport-http-bearer";

import { fastify } from "@/http.js";

// https://github.com/fastify/fastify-passport

const passport = new Authenticator();

export async function setupPassport() {
    await fastify.register(passport.initialize());
    await fastify.register(passport.secureSession());

    passport.use(
        "bearer",
        new BearerStrategy((token, done) => {
            console.log({ token });

            return done(null);
        })
    );

    fastify.get(
        "/auth/login/google",
        passport.authenticate("bearer", { session: false, failureRedirect: "/failed", successRedirect: "/success" })
    );

    // fastifyPassport.use(
    //     "google",
    //     new GoogleOAuthStrategy(
    //         {
    //             clientID: config.googleClientId,
    //             clientSecret: config.googleClientSecret,
    //             callbackURL: "http://localhost:3005/auth/google/callback",
    //             passReqToCallback: true,
    //         },
    //         async function (request, accessToken, refreshToken, profile, done) {
    //             // console.log({ accessToken, refreshToken });

    //             let user: UserRow | undefined;

    //             user = await database
    //                 .selectFrom("user")
    //                 .where("googleId", "=", profile.id)
    //                 .selectAll()
    //                 .executeTakeFirst();

    //             if (!user) {
    //                 user = await database
    //                     .insertInto("user")
    //                     .values({
    //                         displayName: "Player",
    //                         googleId: profile.id,
    //                     })
    //                     .onConflict((oc) => oc.doNothing())
    //                     .returningAll()
    //                     .executeTakeFirst();
    //             }

    //             if (!user) {
    //                 console.error("Something went wrong trying to create/find user");
    //                 return;
    //             }

    //             return done(null, user);
    //         }
    //     )
    // );

    // fastifyPassport.use(
    //     "steam",
    //     new SteamStrategy(
    //         {
    //             returnURL: "http://localhost:3006/steam-callback",
    //             realm: "http://localhost:3006/",
    //             apiKey: config.steamWebApiKey,
    //             passReqToCallback: true,
    //         },
    //         (req, identifier, profile, done) => {
    //             console.log("TODO: Steam Auth");
    //             console.log(identifier, profile);

    //             return done(null, profile);
    //         }
    //     )
    // );

    // // google
    // fastify.get(
    //     "/auth/google",
    //     fastifyPassport.authenticate("google", {
    //         scope: ["openid"],
    //     })
    // );
    // fastify.get(
    //     "/auth/google/callback",
    //     {
    //         preValidation: fastifyPassport.authenticate(
    //             "google",
    //             {
    //                 failureRedirect: "/failed",
    //                 scope: ["openid"],
    //                 authInfo: true,
    //             },
    //             async (req, reply, err, user, info, status) => {
    //                 console.log({ err, user, info, status });
    //             }
    //         ),
    //     },
    //     async (req, reply) => {
    //         reply.send("Authenticated - You may now close this window.");
    //     }
    // );
    // // fastify.post(
    // //     "/auth/google",
    // //     {
    // //         preValidation: fastifyPassport.default.authenticate("google", {
    // //             failureRedirect: "/failed",
    // //             successRedirect: "/success",
    // //         }),
    // //     },
    // //     (req, reply) => {
    // //         console.log("YEP");
    // //         console.log({ user: req.user });
    // //         reply.send("wot");
    // //     }
    // // );

    // // steam
    // fastify.get(
    //     "/auth/steam",
    //     {
    //         preValidation: fastifyPassport.authenticate("steam", {
    //             scope: ["openid"],
    //         }),
    //     },
    //     async (req, reply) => console.log("wat")
    // );
    // fastify.post("/auth/steam", fastifyPassport.authenticate("steam"));

    // register a serializer that stores the user object's id in the session ...
    passport.registerUserSerializer(async (user) => {
        const thing = typeof user === "object" && user !== null && "userId" in user && user.userId;
        console.log({ user });
        return user;
    });

    // ... and then a deserializer that will fetch that user from the database when a request with an id in the session arrives
    passport.registerUserDeserializer(async (id, request) => {
        console.log("TODO: find user!");
        console.log(id);
        return { cum: "cum" };
        //return await User.findById(id);
    });

    fastify.get("/failed", (req, res) => {
        res.send("Authentication failed.");
    });

    fastify.get("/success", (req, res) => {
        console.log("user", req.user);
        res.send(`Welcome TODO`);
    });
}
