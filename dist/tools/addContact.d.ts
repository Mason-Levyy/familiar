interface AddContactParams {
    name: string;
    tier: string;
    email?: string;
    phone?: string;
    location?: string;
    company?: string;
    industry?: string;
    role?: string;
    birthday?: string;
    how_met?: string;
    notes?: string;
    next_followup?: string;
}
export declare function addContact(databasePath: string, params: AddContactParams): {
    success: boolean;
    id: number;
    message: string;
    next_followup: string;
    error?: undefined;
} | {
    success: boolean;
    error: string;
    id?: undefined;
    message?: undefined;
    next_followup?: undefined;
};
export {};
