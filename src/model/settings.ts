import { Selectable } from "kysely";

export type SettingTable = {
    key: string;
    value: string;
};

export type SettingRow = Selectable<SettingTable>;
