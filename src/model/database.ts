import { AccountTable } from "@/model/account.js";
import { SettingTable } from "@/model/settings.js";

export type DatabaseModel = {
    setting: SettingTable;
    account: AccountTable;
};
