interface AddSchemaColumnParams {
    table_name?: string;
    column_name: string;
    column_type?: string;
    description?: string;
}
export declare function addSchemaColumn(databasePath: string, params: AddSchemaColumnParams): {
    success: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: string;
    message?: undefined;
};
export {};
