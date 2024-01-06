import { OauthTokenTable } from "@/model/oauth-tokens.js";
import { OidcTable } from "@/model/oidc-table.js";
import { SettingsTable } from "@/model/settings.js";
import { UserTable } from "@/model/user.js";

export type DatabaseModel = {
    settings: SettingsTable;
    user: UserTable;
    oidc: OidcTable;
    oauthToken: OauthTokenTable;
};
