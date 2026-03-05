interface FindContactParams {
    query: string;
}
export declare function findContact(databasePath: string, params: FindContactParams): {
    success: boolean;
    results: {
        recent_interactions: Record<string, unknown>[];
    }[];
    error?: undefined;
} | {
    success: boolean;
    error: string;
    results?: undefined;
};
export {};
