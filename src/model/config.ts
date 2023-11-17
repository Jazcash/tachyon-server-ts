import { Static, Type } from "@sinclair/typebox";

export const configSchema = Type.Object({
    wssPort: Type.Optional(Type.Integer({ default: 3005 })),
    httpPort: Type.Optional(Type.Integer({ default: 3006 })),
    accountVerification: Type.Optional(Type.Boolean({ default: true })),
    mail: Type.Optional(
        Type.Object({
            host: Type.String(),
            port: Type.Integer(),
            secure: Type.Boolean(),
            auth: Type.Object({
                user: Type.String(),
                pass: Type.String(),
            }),
            from: Type.String(),
        })
    ),
});

export type Config = Static<typeof configSchema>;
