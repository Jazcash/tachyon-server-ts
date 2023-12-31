import { Adapter, AdapterPayload } from "oidc-provider";

import { database } from "@/database.js";
import { InsertableOidcRowRow, OidcRow } from "@/model/oidc-table.js";

const oidcTypes = {
    Session: 1,
    AccessToken: 2,
    AuthorizationCode: 3,
    RefreshToken: 4,
    DeviceCode: 5,
    ClientCredentials: 6,
    Client: 7,
    InitialAccessToken: 8,
    RegistrationAccessToken: 9,
    Interaction: 10,
    ReplayDetection: 11,
    PushedAuthorizationRequest: 12,
    Grant: 13,
    BackchannelAuthenticationRequest: 14,
};

const prepare = (doc: OidcRow) => {
    return {
        ...doc.payload,
        ...(doc.consumedAt ? { consumed: true } : undefined),
    };
};

const expiresAt = (expiresIn?: number) => (expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined);

export class KyselyAdapter implements Adapter {
    type: number;

    constructor(name: string) {
        this.type = oidcTypes[name as keyof typeof oidcTypes];
    }

    async upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<void | undefined> {
        const values: InsertableOidcRowRow = {
            id,
            type: this.type,
            payload: payload,
            grantId: payload.grantId,
            userCode: payload.userCode,
            uid: payload.uid,
            expiresAt: expiresAt(expiresIn),
        };

        await database
            .insertInto("oidc")
            .values(values)
            .onConflict((oc) => oc.doUpdateSet(values))
            .execute();
    }

    async find(id: string): Promise<void | AdapterPayload | undefined> {
        const doc = await database.selectFrom("oidc").where("id", "=", id).selectAll().executeTakeFirst();
        if (!doc || (doc.expiresAt && doc.expiresAt < new Date())) {
            return undefined;
        }
        return prepare(doc);
    }

    async findByUserCode(userCode: string): Promise<void | AdapterPayload | undefined> {
        const doc = await database.selectFrom("oidc").where("userCode", "=", userCode).selectAll().executeTakeFirst();
        if (!doc || (doc.expiresAt && doc.expiresAt < new Date())) {
            return undefined;
        }
        return prepare(doc);
    }

    async findByUid(uid: string): Promise<void | AdapterPayload | undefined> {
        const doc = await database.selectFrom("oidc").where("uid", "=", uid).selectAll().executeTakeFirst();
        if (!doc || (doc.expiresAt && doc.expiresAt < new Date())) {
            return undefined;
        }
        return prepare(doc);
    }

    async consume(id: string): Promise<void | undefined> {
        await database
            .updateTable("oidc")
            .set({
                consumedAt: new Date(),
            })
            .where("id", "=", id)
            .execute();
    }

    async destroy(id: string): Promise<void | undefined> {
        await database.deleteFrom("oidc").where("id", "=", id).execute();
    }

    async revokeByGrantId(grantId: string): Promise<void | undefined> {
        await database.deleteFrom("oidc").where("grantId", "=", grantId).execute();
    }
}
