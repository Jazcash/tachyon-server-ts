import { AccountTable } from "@/model/db/account.js";
import { SettingTable } from "@/model/db/settings.js";

export type DatabaseModel = {
    setting: SettingTable;
    account: AccountTable;
};
