import { Battle } from "@/model/battle.js";
import { UserClient } from "@/model/user-client.js";

type Subscriptions = {
    users: Set<UserClient>;
    battles: Set<Battle>;
};

export class SubscriptionService {
    protected subscriptions: Map<UserClient, Subscriptions> = new Map();

    public addUserSubscription(subscriber: UserClient, subscription: UserClient): void {
        const subscriptions = this.subscriptions.get(subscriber) ?? { users: new Set(), battles: new Set() };
        subscriptions.users.add(subscription);
        this.subscriptions.set(subscriber, subscriptions);
    }

    public removeUserSubscription(subscriber: UserClient, subscription: UserClient): void {
        const subscriptions = this.subscriptions.get(subscriber);
        if (subscriptions) {
            subscriptions.users.delete(subscription);
        }
    }

    public addBattleSubscription(subscriber: UserClient, subscription: Battle): void {
        const subscriptions = this.subscriptions.get(subscriber) ?? { users: new Set(), battles: new Set() };
        subscriptions.battles.add(subscription);
        this.subscriptions.set(subscriber, subscriptions);
    }

    public removeBattleSubscription(subscriber: UserClient, subscription: Battle): void {
        const subscriptions = this.subscriptions.get(subscriber);
        if (subscriptions) {
            subscriptions.battles.delete(subscription);
        }
    }
}
