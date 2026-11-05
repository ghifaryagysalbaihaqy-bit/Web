export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    storage_limit?: number;
    is_admin?: boolean;
    webhook_token?: string;
}

export interface FolderItem {
    id: number;
    parent_id: number | null;
    name: string;
    color: string | null;
    is_starred: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

export interface FileItem {
    id: number;
    name: string;
    path: string;
    mime_type: string | null;
    extension: string | null;
    size: number;
    formatted_size: string;
    is_starred: boolean;
    is_locked?: boolean;
    tags?: string[];
    has_active_share?: boolean;
    folder_id: number | null;
    folder_name?: string;
    is_image: boolean;
    is_pdf: boolean;
    is_audio: boolean;
    is_video: boolean;
    is_text: boolean;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

export interface QuickAccessData {
    recent: FileItem[];
    starred: FileItem[];
}

export interface ShareLinkItem {
    id: number;
    token: string;
    share_url: string;
    permission: 'viewer' | 'editor';
    has_password: boolean;
    is_expired: boolean;
    expires_at: string;
    downloads_count: number;
    created_at: string;
}

export interface FileVersionItem {
    id: number;
    version_number: number;
    formatted_size: string;
    size: number;
    notes: string;
    created_at: string;
    creator_name: string;
    is_current: boolean;
}

export interface ActivityLogItem {
    id: number;
    action: string;
    item_name: string;
    item_type: string;
    description: string | null;
    created_at: string;
    time_ago: string;
}

export interface Breadcrumb {
    id: number;
    name: string;
}

export interface StorageCategoryBreakdown {
    key: string;
    label: string;
    color: string;
    bytes: number;
    formatted: string;
    percentage_of_used: number;
    percentage_of_limit: number;
    is_largest: boolean;
}

export interface LargestStorageCategory {
    key: string;
    label: string;
    color: string;
    bytes: number;
    formatted: string;
    percentage_of_used: number;
}

export interface StorageInfo {
    used: number;
    trashed?: number;
    limit: number;
    percentage: number;
    formatted_used: string;
    formatted_trashed?: string;
    formatted_limit: string;
    total_files?: number;
    total_folders?: number;
    largest_files?: Array<{
        id: number;
        name: string;
        size: number;
        formatted_size: string;
        mime_type?: string;
        extension?: string;
        created_at?: string;
    }>;
    categories?: StorageCategoryBreakdown[];
    largest_category?: LargestStorageCategory | null;
}

export interface FileRequestItem {
    id: number;
    title: string;
    description: string | null;
    token: string;
    url: string;
    folder_name: string;
    folder_id: number | null;
    is_active: boolean;
    is_expired: boolean;
    expires_at: string | null;
    uploads_count: number;
    created_at: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
        timestamp?: string;
        action_type?: 'upload' | 'trash' | 'delete' | 'restore';
        file_name?: string;
    };
};
