import { program } from "commander";
import { loadConfig } from "jaz-ts-utils";

import { Config, configSchema } from "@/model/config.js";

program.option("-c, --config [config]", "Path to config.json or JSON literal", "config.json");

program.parse();

const options = program.opts<{
    config: string;
}>();

export let config = await loadConfig(
    options.config.endsWith(".json")
        ? {
              schema: configSchema,
              filePath: options.config,
          }
        : {
              schema: configSchema,
              config: JSON.parse(options.config),
          }
);

export async function setConfig(configToSet: Config) {
    config = await loadConfig({
        schema: configSchema,
        config: configToSet,
    });
}
