import { Selectable } from "kysely";

export type SettingsTable = {
    key: string;
    value: unknown;
};

export type Settings = Selectable<SettingsTable>;
