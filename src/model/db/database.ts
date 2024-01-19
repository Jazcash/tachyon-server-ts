import { SettingTable } from "@/model/db/setting.js";
import { UserTable } from "@/model/db/user.js";

export type DatabaseModel = {
    setting: SettingTable;
    user: UserTable;
};
