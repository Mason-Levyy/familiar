interface UpdateContactParams {
    id: number;
    fields: Record<string, unknown>;
}
export declare function updateContact(databasePath: string, params: UpdateContactParams): {
    success: boolean;
    error: string;
    message?: undefined;
} | {
    success: boolean;
    message: string;
    error?: undefined;
};
export {};
