interface AddTagParams {
    contact_id: number;
    tag_name: string;
}
export declare function addTag(databasePath: string, params: AddTagParams): {
    success: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: string;
    message?: undefined;
};
export {};
