type FileUpload = {
    uri: string;
    type?: string;
    name?: string;
};

const isFileUpload = (value: unknown): value is FileUpload =>
    typeof value === "object" && value !== null && typeof (value as any).uri === "string";

const serializeFormDataPair = (data: FormData, key: string, value: unknown) => {
    if (typeof value === "string" || typeof value === "number") {
        data.append(key, String(value));
    } else if (value instanceof Blob) {
        data.append(key, value);
    } else if (isFileUpload(value)) {
        // For React Native file uploads, create a proper file object for FormData
        // This format is specifically required for React Native's FormData implementation
        const fileObj: any = {
            uri: value.uri,
            type: value.type || 'image/jpeg', // Default to image/jpeg for images
            name: value.name || 'file.jpg'
        };

        // For React Native, we need to append the file object directly
        // React Native's FormData will handle the file reading internally
        data.append(key, fileObj as any);
    } else if (value !== null && value !== undefined) {
        data.append(key, JSON.stringify(value));
    }
};

const formDataBodySerializer = {
    bodySerializer: <T extends Record<string, any> | Array<Record<string, any>>>(
        body: T
    ) => {
        const data = new FormData();

        Object.entries(body).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return;
            }
            if (Array.isArray(value)) {
                value.forEach((v) => serializeFormDataPair(data, key, v));
            } else {
                serializeFormDataPair(data, key, value);
            }
        });

        return data;
    },
};
export { formDataBodySerializer };