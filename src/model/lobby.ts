import { Lobby as LobbySchema } from "tachyon-protocol";

import { Battle } from "@/model/battle.js";

export type Lobby = LobbySchema & { battle: Battle | null };
