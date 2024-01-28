import { GrantIdentifier, OAuthClient, OAuthScope, OAuthScopeRepository, OAuthUserIdentifier } from "@jmondi/oauth2-server";

export const oauthScopeRepository: OAuthScopeRepository = {
    async getAllByIdentifiers(scopeNames: string[]): Promise<OAuthScope[]> {
        return scopeNames.map((scopeName) => ({ name: scopeName }));
    },
    async finalize(scopes: OAuthScope[], identifier: GrantIdentifier, client: OAuthClient, user_id?: OAuthUserIdentifier | undefined): Promise<OAuthScope[]> {
        return scopes;
    },
};
