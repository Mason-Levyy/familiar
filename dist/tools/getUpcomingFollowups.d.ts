interface GetUpcomingFollowupsParams {
    days?: number;
}
export declare function getUpcomingFollowups(databasePath: string, params: GetUpcomingFollowupsParams): {
    success: boolean;
    count: number;
    contacts: Record<string, unknown>[];
    error?: undefined;
} | {
    success: boolean;
    error: string;
    count?: undefined;
    contacts?: undefined;
};
export {};
