import { HandlerService } from "@/handler-service.js";

export default HandlerService.defineHandler("lobby/create", async () => {
    // if (slaves.length === 0) {
    //     return {
    //         status: "failed",
    //         reason: "no_hosts_available",
    //     };
    // }

    return {
        status: "success",
        data: {
            maxPlayers: 16,
            private: false,
            region: "us",
            title: "My Lobby",
        },
    };
});
