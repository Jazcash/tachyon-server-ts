import { DeepReadonly } from "jaz-ts-utils";

import { accountService } from "@/account-service.js";
import { Client } from "@/client.js";
import { AccountRow } from "@/model/db/account.js";

// export type User = {
//     account: ReadonlyDeep<AccountRow>;
//     client: Client;
// };

export class User {
    protected account: AccountRow;
    protected client: Client;

    constructor(account: AccountRow, client: Client) {
        this.account = account;
        this.client = client;
    }

    public getAccount(): DeepReadonly<AccountRow> {
        return this.account;
    }

    public async addFriend(accountId: number) {
        if (!this.account.friendIds.includes(accountId)) {
            this.account.friendIds.push(accountId);
            await accountService.updateRow(this.account.accountId, "friendIds", this.account.friendIds);
        }
    }

    public async removeFriend(accountId: number) {
        const index = this.account.friendIds.indexOf(accountId);
        if (index > -1) {
            this.account.friendIds.splice(index, 1);
            await accountService.updateRow(this.account.accountId, "friendIds", this.account.friendIds);
        }
    }
}
