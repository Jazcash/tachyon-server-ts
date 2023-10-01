import { Lobby } from "@/model/lobby.js";

export const lobbies: Map<number, Lobby> = new Map();

export function addLobby(lobby: Lobby) {
    lobbies.set(lobby.id, lobby);
}

export function removeLobby(lobby: Lobby) {
    lobbies.delete(lobby.id);
}
