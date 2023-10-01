import { User } from "@/model/user.js";

const userClients: Map<number, User> = new Map();

export function addUserClient(user: User) {
    userClients.set(user.userId, user);
}

export function removeUserClient(user: User) {
    userClients.delete(user.userId);
}
