import Ajv, { ValidateFunction } from "ajv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ajv = new Ajv({ coerceTypes: true });

export const validators: Map<string, ValidateFunction> = new Map();

const services = await fs.promises.readdir(path.join(__dirname, "../tachyon/schema"));
for (const serviceId of services.filter((s) => !s.endsWith(".json"))) {
    const endpoints = await fs.promises.readdir(path.join(__dirname, "../tachyon/schema", serviceId));
    for (const endpointId of endpoints) {
        const commands = await fs.promises.readdir(path.join(__dirname, "../tachyon/schema", serviceId, endpointId));
        for (const command of commands) {
            const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "../tachyon/schema", serviceId, endpointId, command), "utf-8"));
            const validator = ajv.compile(schema);
            const commandId = path.parse(command).name;
            validators.set(`${serviceId}/${endpointId}/${commandId}`, validator);
        }
    }
}
