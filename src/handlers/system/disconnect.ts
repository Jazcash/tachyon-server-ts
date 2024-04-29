import { HandlerService } from "@/handler-service.js";

export default HandlerService.defineHandler(
    "system",
    "disconnect",
    async () => {
        return {
            status: "success",
        };
    },
    async ({ client }) => {
        client.socket.close();
    }
);
