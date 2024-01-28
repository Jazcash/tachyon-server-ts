import { database } from "@/database.js";
import { TokenRow } from "@/model/db/token.js";

export async function getAccessToken(accessToken: string): Promise<TokenRow> {
    return await database.selectFrom("token").where("accessToken", "=", accessToken).selectAll().executeTakeFirstOrThrow();
}
