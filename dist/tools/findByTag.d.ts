interface FindByTagParams {
    tag_name: string;
}
export declare function findByTag(databasePath: string, params: FindByTagParams): {
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
