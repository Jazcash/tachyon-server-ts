// eslint-disable-next-line no-restricted-imports
import { TachyonServer } from "../dist/index.js";

const server = new TachyonServer({
    host: "localhost",
    port: 3010,
});

beforeAll(async () => {
    await server.ready();
});

afterAll(async () => {
    await server.destroy();
});

test("thing", () => {
    expect(true).toBe(true);
});
