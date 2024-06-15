import { GetCommandIds, GetFailedResponseReason } from "tachyon-protocol";

export class ResponseError<C extends GetCommandIds<"server", "user" | "autohost", "response">> extends Error {
    public reason: string;

    constructor(commandId: C, reason: GetFailedResponseReason<C> & string) {
        super(reason);
        this.reason = reason;
    }
}
