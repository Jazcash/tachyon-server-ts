import { AuthCodeTable } from "@/model/db/auth-code.js";
import { SessionTable } from "@/model/db/session.js";
import { SettingTable } from "@/model/db/setting.js";
import { TokenTable } from "@/model/db/token.js";
import { UserTable } from "@/model/db/user.js";

export type DatabaseModel = {
    setting: SettingTable;
    user: UserTable;
    authCode: AuthCodeTable;
    token: TokenTable;
    session: SessionTable;
};
