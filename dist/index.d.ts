interface OpenClawApi {
    pluginConfig?: {
        dbPath?: string;
    };
    registerTool(config: {
        name: string;
        description: string;
        parameters: unknown;
        execute: (id: string, params: Record<string, unknown>) => Promise<{
            content: Array<{
                type: string;
                text: string;
            }>;
        }>;
    }, options?: {
        optional?: boolean;
    }): void;
}
export default function registerCrmTools(api: OpenClawApi): void;
export {};
