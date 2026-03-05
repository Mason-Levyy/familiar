interface LogInteractionParams {
    contact_id: number;
    type: string;
    summary: string;
    date?: string;
}
export declare function logInteraction(databasePath: string, params: LogInteractionParams): {
    success: boolean;
    message: string;
    next_followup: string;
    error?: undefined;
} | {
    success: boolean;
    error: string;
    message?: undefined;
    next_followup?: undefined;
};
export {};
