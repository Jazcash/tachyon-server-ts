import { createTransport, Transport, TransportOptions } from "nodemailer";

import { config } from "@/config.js";

export const mail = config.mail ? createTransport(config.mail as TransportOptions | Transport) : null;
