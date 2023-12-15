import { UserRow } from "@/model/user.js";

const userClients: Map<number, UserRow> = new Map();

export function addUserClient(user: UserRow) {
    userClients.set(user.userId, user);
}

export function removeUserClient(user: UserRow) {
    userClients.delete(user.userId);
}
