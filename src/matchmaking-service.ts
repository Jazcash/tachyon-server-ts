import { delay, removeFromArray } from "jaz-ts-utils";

import { config } from "@/config.js";
import { UserRow } from "@/model/db/user.js";
import { MatchmakingPlaylist, MatchmakingQueue } from "@/model/matchmaking.js";
import { ResponseError } from "@/model/response-error.js";
import { UserClient } from "@/model/user-client.js";
import { userClientService } from "@/user-client-service.js";

const playlistIds = config.matchmakingPlaylists.map((playlist) => playlist.id);

type UserId = UserRow["userId"];
type PlaylistId = MatchmakingPlaylist["id"];

export class MatchmakingService {
    protected matchmakingQueueByPlaylistId: Record<UserId, MatchmakingQueue> = {};
    protected matchmakingQueuesByUserId: Record<PlaylistId, MatchmakingQueue[]> = {};

    constructor() {
        for (const playlist of config.matchmakingPlaylists) {
            this.matchmakingQueueByPlaylistId[playlist.id] = {
                playlist: playlist,
                users: [],
            };
        }

        this.matchmakingLoop();
    }

    public addUserToQueues(userId: UserId, playlistIds: PlaylistId[]) {
        if (userId in this.matchmakingQueuesByUserId) {
            throw new ResponseError("matchmaking", "queue", "already_queued");
        }

        for (const playlistId of playlistIds) {
            this.addUserToQueue(userId, playlistId);
        }
    }

    protected addUserToQueue(userId: UserId, playlistId: PlaylistId) {
        if (!playlistIds.includes(playlistId)) {
            throw new ResponseError("matchmaking", "queue", "invalid_queue_specified");
        }

        const user = userClientService.getUserClientByIdOrThrow(userId);
        const matchmakingQueue = this.matchmakingQueueByPlaylistId[playlistId];

        if (!this.isUserInQueue(userId, playlistId)) {
            this.matchmakingQueueByPlaylistId[playlistId].users.push(user);
            if (!this.matchmakingQueuesByUserId[userId]) {
                this.matchmakingQueuesByUserId[userId] = [matchmakingQueue];
            } else {
                this.matchmakingQueuesByUserId[userId].push(matchmakingQueue);
            }
        }
    }

    public removeUserFromQueues(userId: UserId, playlistIds: PlaylistId[]) {
        for (const playlistId of playlistIds) {
            this.removeUserFromQueue(userId, playlistId);
        }
    }

    protected removeUsersFromQueue(userIds: UserId[], playlistId: PlaylistId) {
        for (const userId of userIds) {
            this.removeUserFromQueue(userId, playlistId);
        }
    }

    public removeUsersFromAllQueues(userId: UserId) {
        const matchmakingQueues = this.matchmakingQueuesByUserId[userId];
        if (!matchmakingQueues) {
            return;
        }
        for (const matchmakingQueue of matchmakingQueues) {
            removeFromArray(matchmakingQueue.users, userClientService.getUserClientByIdOrThrow(userId));
        }
        delete this.matchmakingQueuesByUserId[userId];
    }

    protected removeUserFromQueue(userId: UserId, playlistId: PlaylistId) {
        if (!playlistIds.includes(playlistId)) {
            throw new ResponseError("matchmaking", "queue", "invalid_queue_specified");
        }

        const user = userClientService.getUserClientByIdOrThrow(userId);
        const matchmakingQueue = this.matchmakingQueueByPlaylistId[playlistId];

        removeFromArray(matchmakingQueue.users, user);

        if (this.matchmakingQueuesByUserId[userId]) {
            removeFromArray(this.matchmakingQueuesByUserId[userId], matchmakingQueue);
        }
    }

    protected getMatchmakingQueueByPlaylistId(playlistId: PlaylistId): MatchmakingQueue {
        return this.matchmakingQueueByPlaylistId[playlistId];
    }

    protected getMatchmakingQueuesByUserId(userId: UserId): MatchmakingQueue[] | null {
        return this.matchmakingQueuesByUserId[userId] || null;
    }

    protected isUserInQueue(userId: UserId, playlistId: PlaylistId): boolean {
        return this.matchmakingQueuesByUserId[userId]?.some((queue) => queue.playlist.id === playlistId) || false;
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

                for (const user of usersToMatch) {
                    this.removeUsersFromAllQueues(user.userId);
                }

                this.matchFound(queue.playlist, usersToMatch);
            }

            await delay(1000);
        }
    }

    protected matchFound(playlist: MatchmakingPlaylist, users: UserClient[]) {
        for (const user of users) {
            user.sendResponse({
                commandId: "matchmaking/found/response",
                messageId: "0",
                status: "success",
                data: {
                    queueId: playlist.id,
                    timeoutMs: 10000,
                },
            });
        }
    }
}

export const matchmakingService = new MatchmakingService();
