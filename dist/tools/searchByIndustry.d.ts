interface SearchByIndustryParams {
    industry?: string;
    company?: string;
}
export declare function searchByIndustry(databasePath: string, params: SearchByIndustryParams): {
    success: boolean;
    error: string;
    count?: undefined;
    contacts?: undefined;
} | {
    success: boolean;
    count: number;
    contacts: Record<string, unknown>[];
    error?: undefined;
};
export {};
