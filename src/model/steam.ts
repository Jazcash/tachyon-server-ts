export type SteamSessionTicketResponse = {
    response:
        | {
              params: {
                  result: "OK";
                  steamid: string;
                  ownersteamid: string;
                  vacbanned: boolean;
                  publisherbanned: boolean;
              };
          }
        | {
              error:
                  | { errorcode: 3; errordesc: "Invalid parameter" }
                  | { errorcode: 101; errordesc: "Invalid ticket" }
                  | { errorcode: number; errordesc: string };
          };
};

export type SteamPlayerSummaryResponse = {
    steamid: string;
    communityvisibilitystate: number;
    profilestate: number;
    personaname: string;
    profileurl: string;
    avatar: string;
    avatarmedium: string;
    avatarfull: string;
    avatarhash: string;
    lastlogoff?: number;
    personastate: number;
    primaryclanid?: string;
    timecreated?: number;
    personastateflags?: number;
    loccountrycode?: string;
};
