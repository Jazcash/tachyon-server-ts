import { config } from "@/config.js";
import { MatchmakingQueue } from "@/model/matchmaking.js";
import { ResponseError } from "@/model/response-error.js";

const playlistIds = config.matchmakingPlaylists.map((playlist) => playlist.id);

export class MatchmakingService {
    protected matchmakingQueueByPlaylistId: Record<string, MatchmakingQueue> = {};
    protected matchmakingQueuesByUserId: Record<string, Set<MatchmakingQueue>> = {};

    constructor() {
        for (const playlist of config.matchmakingPlaylists) {
            this.matchmakingQueueByPlaylistId[playlist.id] = {
                playlistId: playlist.id,
                userIds: new Set(),
            };
        }
    }

    public addUserToQueues(userId: string, playlistIds: string[]) {
        for (const playlistId of playlistIds) {
            this.addUserToQueue(userId, playlistId);
        }
    }

    public addUserToQueue(userId: string, playlistId: string) {
        if (!playlistIds.includes(playlistId)) {
            throw new ResponseError("matchmaking", "queue", "invalid_queue_specified");
        }
        const matchmakingQueue = this.matchmakingQueueByPlaylistId[playlistId];
        this.matchmakingQueueByPlaylistId[playlistId].userIds.add(userId);
        if (!this.matchmakingQueuesByUserId[userId]) {
            this.matchmakingQueuesByUserId[userId] = new Set([matchmakingQueue]);
        } else {
            this.matchmakingQueuesByUserId[userId].add(matchmakingQueue);
        }
    }

    public removeUserFromQueues(userId: string, playlistIds: string[]) {
        for (const playlistId of playlistIds) {
            this.removeUserFromQueue(userId, playlistId);
        }
    }

    public removeUserFromQueue(userId: string, playlistId: string) {
        if (!playlistIds.includes(playlistId)) {
            throw new ResponseError("matchmaking", "queue", "invalid_queue_specified");
        }
        const matchmakingQueue = this.matchmakingQueueByPlaylistId[playlistId];
        this.matchmakingQueueByPlaylistId[playlistId].userIds.delete(userId);
        if (this.matchmakingQueuesByUserId[userId]) {
            this.matchmakingQueuesByUserId[userId].delete(matchmakingQueue);
        }
    }

    public getMatchmakingQueueByPlaylistId(playlistId: string): MatchmakingQueue {
        return this.matchmakingQueueByPlaylistId[playlistId];
    }

    public getMatchmakingQueuesByUserId(userId: string): Set<MatchmakingQueue> | null {
        return this.matchmakingQueuesByUserId[userId] || null;
    }
}

export const matchmakingService = new MatchmakingService();
