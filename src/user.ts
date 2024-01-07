import { Client } from "@/client.js";

export type UserConfig = {
    accountId: number;
    displayName: string;
    avatarUrl: string;
    countryCode?: string;
};

export class User {
    public client: Client;

    public readonly config: Readonly<UserConfig>;

    constructor(client: Client, config: UserConfig) {
        this.client = client;

        this.config = config;
    }
}
