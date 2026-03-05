interface ListContactsParams {
    tier?: string;
    limit?: number;
}
export declare function listContacts(databasePath: string, params: ListContactsParams): {
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
