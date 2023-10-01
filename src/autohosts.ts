import { Autohost } from "@/model/autohost.js";

const autohosts = new Map<string, Autohost>();

export function addAutohost(autohost: Autohost) {
    if (!autohosts.has(autohost.ip)) {
        autohosts.set(autohost.ip, autohost);
    } else {
        console.warn(`Autohost has already been added: ${autohost.ip}`);
    }
}

export function removeAutohost(autohost: Autohost) {
    if (autohosts.has(autohost.ip)) {
        autohosts.delete(autohost.ip);
    } else {
        console.warn(`Autohost has already been removed: ${autohost.ip}`);
    }
}
