import { EndpointId, FailedResponseReason, ServiceId } from "tachyon-protocol";

export class ResponseError<S extends ServiceId, E extends EndpointId<S>> extends Error {
    public reason: string;

    constructor(serviceId: S, endpointId: E, reason: FailedResponseReason<S, E> & string) {
        super(reason);
        this.reason = reason;
    }
}
