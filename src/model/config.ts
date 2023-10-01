import { Static, Type } from "@sinclair/typebox";

export const configSchema = Type.Object({
    port: Type.Integer({ default: 3005 }),
    accountVerification: Type.Boolean({ default: true }),
    mail: Type.Optional(
        Type.Object({
            host: Type.String(),
            port: Type.Integer(),
            secure: Type.Boolean(),
            auth: Type.Object({
                user: Type.String(),
                pass: Type.String(),
            }),
        })
    ),
});

export type Config = Static<typeof configSchema>;
