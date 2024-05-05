export function isUserIdValid(userId: string | number | null | undefined): userId is string | null | undefined {
    return userId === null || userId === undefined || typeof userId === "string";
}
