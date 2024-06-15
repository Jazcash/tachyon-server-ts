import { randomUUID } from "crypto";
import { delay, removeFromArray } from "jaz-ts-utils";

import { config } from "@/config.js";
import { UserId } from "@/model/db/user.js";
import { Match, MatchId, MatchmakingPlaylist, MatchmakingQueue, PlaylistId } from "@/model/matchmaking.js";
import { ResponseError } from "@/model/response-error.js";
import { UserClient } from "@/model/user-client.js";

const playlistIds = config.matchmakingPlaylists.map((playlist) => playlist.id);

export class MatchmakingService {
    protected matchmakingQueueByPlaylistId: Record<PlaylistId, MatchmakingQueue> = {};
    protected matchmakingQueuesByUserId: Record<UserId, MatchmakingQueue[]> = {};
    protected matches: Record<MatchId, Match> = {};
    protected userMatch: Record<UserId, Match> = {};

    constructor() {
        for (const playlist of config.matchmakingPlaylists) {
            this.matchmakingQueueByPlaylistId[playlist.id] = {
                playlist: playlist,
                users: [],
            };
        }

        this.matchmakingLoop();
    }

    public addUserToQueues(user: UserClient, playlistIds: PlaylistId[]) {
        if (user.userId in this.matchmakingQueuesByUserId) {
            throw new ResponseError("matchmaking/queue", "already_queued");
        }

        for (const playlistId of playlistIds) {
            this.addUserToQueue(user, playlistId);
        }
    }

    public setUserReady(userClient: UserClient) {
        const match = this.userMatch[userClient.userId];
        if (!match) {
            throw new ResponseError("matchmaking/ready", "no_match");
        }
        if (!match.users.includes(userClient)) {
            throw new ResponseError("matchmaking/ready", "no_match");
        }
        match.readyUsers.add(userClient);
    }

    protected addUserToQueue(userClient: UserClient, playlistId: PlaylistId) {
        if (!playlistIds.includes(playlistId)) {
            throw new ResponseError("matchmaking/queue", "invalid_queue_specified");
        }

        const matchmakingQueue = this.matchmakingQueueByPlaylistId[playlistId];

        if (!this.isUserInQueue(userClient, playlistId)) {
            this.matchmakingQueueByPlaylistId[playlistId].users.push(userClient);
            if (!this.matchmakingQueuesByUserId[userClient.userId]) {
                this.matchmakingQueuesByUserId[userClient.userId] = [matchmakingQueue];
            } else {
                this.matchmakingQueuesByUserId[userClient.userId].push(matchmakingQueue);
            }
        }
    }

    public removeUserFromQueues(userClient: UserClient, playlistIds: PlaylistId[]) {
        for (const playlistId of playlistIds) {
            this.removeUserFromQueue(userClient, playlistId);
        }
    }

    protected removeUsersFromQueue(userClients: UserClient[], playlistId: PlaylistId) {
        for (const user of userClients) {
            this.removeUserFromQueue(user, playlistId);
        }
    }

    public removeUsersFromAllQueues(userClient: UserClient) {
        const matchmakingQueues = this.matchmakingQueuesByUserId[userClient.userId];
        if (!matchmakingQueues) {
            return;
        }
        for (const matchmakingQueue of matchmakingQueues) {
            removeFromArray(matchmakingQueue.users, userClient);
        }
        delete this.matchmakingQueuesByUserId[userClient.userId];
    }

    protected removeUserFromQueue(userClient: UserClient, playlistId: PlaylistId) {
        if (!playlistIds.includes(playlistId)) {
            throw new ResponseError("matchmaking/queue", "invalid_queue_specified");
        }

        const matchmakingQueue = this.matchmakingQueueByPlaylistId[playlistId];

        removeFromArray(matchmakingQueue.users, userClient);

        if (this.matchmakingQueuesByUserId[userClient.userId]) {
            removeFromArray(this.matchmakingQueuesByUserId[userClient.userId], matchmakingQueue);
        }
    }

    protected getMatchmakingQueueByPlaylistId(playlistId: PlaylistId): MatchmakingQueue {
        return this.matchmakingQueueByPlaylistId[playlistId];
    }

    protected isUserInQueue(userClient: UserClient, playlistId: PlaylistId): boolean {
        return this.matchmakingQueuesByUserId[userClient.userId]?.some((queue) => queue.playlist.id === playlistId) || false;
    }

    /** Primitive matchmaking loop that doesn't care about any factors such as skill or region */
    protected async matchmakingLoop() {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            for (const playlistId in this.matchmakingQueueByPlaylistId) {
                const queue = this.matchmakingQueueByPlaylistId[playlistId];
                const requiredPlayers = queue.playlist.numOfTeams * queue.playlist.teamSize;

                if (queue.users.length < requiredPlayers) {
                    continue;
                }

                const usersToMatch = queue.users.slice(0, requiredPlayers);

                for (const userClient of usersToMatch) {
                    this.removeUsersFromAllQueues(userClient);
                }

                this.createMatch(queue.playlist, usersToMatch);
            }

            await delay(1000);
        }
    }

    protected createMatch(playlist: MatchmakingPlaylist, users: UserClient[]) {
        for (const userClient of users) {
            userClient.sendEvent({
                commandId: "matchmaking/found",
                data: {
                    queueId: playlist.id,
                    timeoutMs: 10000,
                },
            });
        }

        const matchId = randomUUID();

        this.matches[matchId] = {
            matchId,
            playlistId: playlist.id,
            users,
            readyUsers: new Set(),
        };
    }
}

export const matchmakingService = new MatchmakingService();
