import { startAutohostHttpServer } from "@/autohost-http.js";
import { startHttpServer } from "@/http.js";

await startHttpServer();
await startAutohostHttpServer();
