/* eslint-disable no-restricted-imports */
import { startServer, stopServer } from "../dist/index.js";
import { TachyonServer } from "../dist/server.js";

let server: TachyonServer;

beforeAll(async () => {
    server = await startServer();
});

afterAll(async () => {
    await stopServer();
});

test("system", () => {
    test("version", async () => {});
});
