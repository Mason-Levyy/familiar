interface GetUpcomingBirthdaysParams {
    days?: number;
}
export declare function getUpcomingBirthdays(databasePath: string, params: GetUpcomingBirthdaysParams): {
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
