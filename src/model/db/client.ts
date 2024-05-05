import { GrantIdentifier } from "@jmondi/oauth2-server";
import { Generated, Insertable, Selectable, Updateable } from "kysely";

export type ClientTable = {
    clientId: string;
    clientSecret?: string;
    name: string;
    allowedGrants: GrantIdentifier[];
    redirectUris: string[];
    scopes: string[];
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
};

export type ClientRow = Selectable<ClientTable>;
export type InsertableClientRow = Insertable<ClientTable>;
export type UpdateableClientRow = Updateable<ClientTable>;
