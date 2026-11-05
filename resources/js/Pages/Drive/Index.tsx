import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    HardDrive,
    Clock,
    Star,
    Trash2,
    Search,
    Upload,
    FolderPlus,
    Grid,
    List,
    MoreVertical,
    Download,
    Share2,
    Edit2,
    FolderInput,
    ChevronRight,
    ChevronDown,
    Zap,
    CheckCircle,
    AlertCircle,
    X,
    Folder as FolderIcon,
    RotateCcw,
    Copy,
    CheckSquare,
    Square,
    Eye,
    Layers,
    FileCheck,
    Info,
    Sparkles,
    Filter,
    FileText,
    Image as ImageIcon,
    Video,
    Archive,
    Code,
    History,
    Activity,
    SlidersHorizontal,
    Tag,
    Lock,
    Unlock,
    Palette,
    Files,
    PieChart,
    FileUp,
    MessageSquare
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, FolderItem, FileItem, Breadcrumb, StorageInfo } from '@/types';
import { FileIcon, CustomFolderIcon } from '@/Components/FileIcon';
import {
    NewFolderModal,
    RenameModal,
    MoveModal,
    ShareModal,
    FilePreviewModal,
    DeleteConfirmModal,
    VersionHistoryModal,
    ActivityLogModal
} from '@/Components/DriveModals';
import {
    FolderColorModal,
    FileTagModal,
    AdvancedSearchModal,
    StorageAnalyticsModal,
    DuplicateDetectionModal,
    DownloadManagerModal,
    FileRequestModal,
    WhatsAppIntegrationModal,
    DownloadItem
} from '@/Components/DriveFeatureModals';

interface DriveIndexProps extends PageProps {
    section: 'all' | 'recent' | 'starred' | 'trash';
    currentFolder: FolderItem | null;
    breadcrumbs: Breadcrumb[];
    folders: FolderItem[];
    files: FileItem[];
    quickAccess?: {
        recent: FileItem[];
        starred: FileItem[];
    };
    availableFolders: { id: number; name: string }[];
    search: string;
    filter?: string;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    storage: StorageInfo;
    allTags?: string[];
    advancedSearch?: {
        search_type?: string;
        size_range?: string;
        date_range?: string;
        tag?: string;
    };
}

const FILTER_TABS = [
    { key: 'all', label: 'Semua Berkas', icon: Layers },
    { key: 'image', label: 'Gambar', icon: ImageIcon },
    { key: 'document', label: 'Dokumen', icon: FileText },
    { key: 'media', label: 'Audio & Video', icon: Video },
    { key: 'archive', label: 'Arsip (ZIP)', icon: Archive },
    { key: 'code', label: 'Kode & Teks', icon: Code },
];

export default function DriveIndex({
    auth,
    section,
    currentFolder,
    breadcrumbs,
    folders,
    files,
    quickAccess,
    availableFolders,
    search: initialSearch,
    filter: initialFilter = 'all',
    sortBy,
    sortDirection,
    storage,
    flash,
    allTags = [],
    advancedSearch,
}: DriveIndexProps) {
    // Persistent View Mode from LocalStorage
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('cloudvault_view_mode');
            if (saved === 'grid' || saved === 'list') return saved;
        }
        return 'grid';
    });

    const [search, setSearch] = useState(initialSearch || '');
    const [activeFilter, setActiveFilter] = useState(initialFilter);

    useEffect(() => {
        setActiveFilter(initialFilter);
    }, [initialFilter]);

    const [quickAccessTab, setQuickAccessTab] = useState<'recent' | 'starred'>('recent');
    const [isQuickAccessCollapsed, setIsQuickAccessCollapsed] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadFileDetails, setUploadFileDetails] = useState<{
        name: string;
        size: string;
        count: number;
    } | null>(null);
    const uploadAbortControllerRef = useRef<AbortController | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [localNotice, setLocalNotice] = useState<{
        type: 'success' | 'info';
        message: string;
        timestamp?: string;
    } | null>(null);
    const [toast, setToast] = useState<{
        id: number;
        type: 'success' | 'error' | 'info';
        message: string;
        timestamp?: string;
        action_type?: string;
    } | null>(null);

    // Sync Inertia Flash messages to Toast (with auto-dismiss after 5s)
    useEffect(() => {
        if (flash?.success) {
            setToast({
                id: Date.now(),
                type: 'success',
                message: flash.success,
                timestamp: flash.timestamp,
                action_type: flash.action_type,
            });
        } else if (flash?.error) {
            setToast({
                id: Date.now(),
                type: 'error',
                message: flash.error,
            });
        }
    }, [flash]);

    // Sync local upload notices to Toast (with auto-dismiss after 5s)
    useEffect(() => {
        if (localNotice) {
            setToast({
                id: Date.now(),
                type: localNotice.type === 'info' ? 'info' : 'success',
                message: localNotice.message,
                timestamp: localNotice.timestamp,
                action_type: 'upload',
            });
        }
    }, [localNotice]);

    // Sync upload errors to Toast
    useEffect(() => {
        if (uploadError) {
            setToast({
                id: Date.now(),
                type: 'error',
                message: uploadError,
            });
        }
    }, [uploadError]);

    // Auto-dismiss Toast notification after 5 seconds
    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => {
            setToast(null);
        }, 5000);

        return () => clearTimeout(timer);
    }, [toast]);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Multi-Selection State
    const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
    const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);

    // Inspector Details Sidebar State
    const [inspectedItem, setInspectedItem] = useState<{
        type: 'file' | 'folder';
        item: FileItem | FolderItem;
    } | null>(null);

    // Modals state
    const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
    const [renameItem, setRenameItem] = useState<{ id: number; name: string; type: 'folder' | 'file' } | null>(null);
    const [moveTarget, setMoveTarget] = useState<{
        type: 'file' | 'folder' | 'batch';
        id?: number;
        name?: string;
        currentFolderId?: number | null;
        fileIds?: number[];
        folderIds?: number[];
    } | null>(null);
    const [shareFile, setShareFile] = useState<FileItem | null>(null);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [historyFile, setHistoryFile] = useState<FileItem | null>(null);
    const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isPermanent?: boolean;
    } | null>(null);

    // Feature Modals state
    const [colorFolder, setColorFolder] = useState<FolderItem | null>(null);
    const [tagFile, setTagFile] = useState<FileItem | null>(null);
    const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
    const [isStorageAnalyticsOpen, setIsStorageAnalyticsOpen] = useState(false);
    const [isDuplicatesOpen, setIsDuplicatesOpen] = useState(false);
    const [isFileRequestOpen, setIsFileRequestOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [isDownloadManagerOpen, setIsDownloadManagerOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Download history tracker
    const [downloads, setDownloads] = useState<DownloadItem[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('cloudvault_downloads');
                return saved ? JSON.parse(saved) : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    });

    const trackDownload = (name: string, size?: string, url?: string) => {
        const newItem: DownloadItem = {
            id: String(Date.now() + Math.random()),
            name,
            size,
            downloaded_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            url: url || '#',
        };
        setDownloads((prev) => {
            const updated = [newItem, ...prev.slice(0, 49)];
            if (typeof window !== 'undefined') {
                localStorage.setItem('cloudvault_downloads', JSON.stringify(updated));
            }
            return updated;
        });
    };

    const handleClearDownloads = () => {
        setDownloads([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('cloudvault_downloads');
        }
    };

    const hasActiveAdvancedFilter = Boolean(
        (advancedSearch?.search_type && advancedSearch.search_type !== 'all') ||
        advancedSearch?.size_range ||
        advancedSearch?.date_range ||
        advancedSearch?.tag
    );

    const handleApplyAdvancedSearch = (filters: {
        search?: string;
        search_type?: string;
        size_range?: string;
        date_range?: string;
        tag?: string;
    }) => {
        navigateWithParams({
            search: filters.search,
            search_type: filters.search_type,
            size_range: filters.size_range,
            date_range: filters.date_range,
            tag: filters.tag,
        });
    };

    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalSelected = selectedFileIds.length + selectedFolderIds.length;

    // Save view mode
    const handleSetViewMode = (mode: 'grid' | 'list') => {
        setViewMode(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('cloudvault_view_mode', mode);
        }
    };

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Keyboard Shortcuts (Ctrl+A to select all, Esc to deselect)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                setSelectedFileIds(files.map((f) => f.id));
                setSelectedFolderIds(folders.map((f) => f.id));
            } else if (e.key === 'Escape') {
                setSelectedFileIds([]);
                setSelectedFolderIds([]);
                setInspectedItem(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [files, folders]);

    // Protect against accidentally closing or navigating tab while upload is running
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (uploading) {
                e.preventDefault();
                e.returnValue = 'Proses unggah berkas sedang berlangsung. Meninggalkan halaman ini akan membatalkan unggahan.';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [uploading]);

    // Drag and Drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (section !== 'trash') setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (section === 'trash') return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploadFiles(e.dataTransfer.files);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUploadFiles(e.target.files);
        }
    };

    const handleCancelUpload = () => {
        if (uploadAbortControllerRef.current) {
            uploadAbortControllerRef.current.abort();
            uploadAbortControllerRef.current = null;
        }
        setUploading(false);
        setUploadProgress(0);
        setUploadFileDetails(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setLocalNotice({
            type: 'info',
            message: 'Proses pengunggahan berkas telah dibatalkan.',
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
    };

    const handleUploadFiles = async (fileList: FileList) => {
        if (!fileList || fileList.length === 0) return;

        // Abort previous upload if still in-flight
        if (uploadAbortControllerRef.current) {
            uploadAbortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        uploadAbortControllerRef.current = abortController;

        const filesArray = Array.from(fileList);
        const count = filesArray.length;
        const totalBytes = filesArray.reduce((acc, f) => acc + f.size, 0);

        // Validasi kapasitas penyimpanan pengguna secara dinamis
        const remainingBytes = Math.max(0, (storage.limit || 5368709120) - storage.used);
        if (totalBytes > remainingBytes) {
            setUploadError(`Ukuran total berkas (${formatBytes(totalBytes)}) melebihi sisa kapasitas akun Anda (${formatBytes(remainingBytes)}).`);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        const displayName = count === 1 ? filesArray[0].name : `${count} berkas`;

        setUploadFileDetails({
            name: displayName,
            size: formatBytes(totalBytes),
            count,
        });
        setUploading(true);
        setUploadProgress(5);
        setUploadError(null);
        setLocalNotice(null);

        const formData = new FormData();
        filesArray.forEach((file) => {
            formData.append('files[]', file);
        });

        if (currentFolder) {
            formData.append('folder_id', String(currentFolder.id));
        }

        try {
            const response = await axios.post(route('files.upload'), formData, {
                signal: abortController.signal,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.min(
                            98,
                            Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        );
                        setUploadProgress(percent);
                    }
                },
            });

            setUploadProgress(100);
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
                setUploadFileDetails(null);
                uploadAbortControllerRef.current = null;
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }, 300);

            // Smooth reload of the current drive directory view
            router.reload({
                onSuccess: () => {
                    if (response.data && response.data.message) {
                        setLocalNotice({
                            type: 'success',
                            message: response.data.message,
                            timestamp: response.data.timestamp,
                        });
                    }
                },
            });
        } catch (error: any) {
            if (axios.isCancel(error) || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                setUploading(false);
                setUploadProgress(0);
                setUploadFileDetails(null);
                uploadAbortControllerRef.current = null;
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            let msg = 'Gagal mengunggah berkas. Silakan coba kembali.';
            if (error.response?.status === 413) {
                msg = 'Ukuran berkas terlalu besar dan melampaui konfigurasi batas server (HTTP 413).';
            } else if (error.response?.data?.errors) {
                const firstErr = Object.values(error.response.data.errors).flat()[0];
                if (typeof firstErr === 'string') {
                    msg = firstErr;
                }
            } else if (error.response?.data?.message) {
                msg = error.response.data.message;
            }

            setUploadError(msg);
            setUploading(false);
            setUploadProgress(0);
            setUploadFileDetails(null);
            uploadAbortControllerRef.current = null;
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Navigation and Filtering
    const navigateWithParams = (params: Record<string, unknown>) => {
        router.get(
            route('drive.index'),
            {
                section,
                folder_id: currentFolder?.id,
                search: search.trim() || undefined,
                search_type: advancedSearch?.search_type,
                size_range: advancedSearch?.size_range,
                date_range: advancedSearch?.date_range,
                tag: advancedSearch?.tag,
                filter: activeFilter !== 'all' ? activeFilter : undefined,
                sort_by: sortBy,
                sort_direction: sortDirection,
                ...params,
            },
            { preserveState: true }
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        navigateWithParams({ search: search.trim() || undefined });
    };

    const handleFilterChange = (newFilter: string) => {
        setActiveFilter(newFilter);
        navigateWithParams({ filter: newFilter !== 'all' ? newFilter : undefined });
    };

    const handleSortChange = (newSortBy: string) => {
        const newDirection = sortBy === newSortBy && sortDirection === 'asc' ? 'desc' : 'asc';
        navigateWithParams({ sort_by: newSortBy, sort_direction: newDirection });
    };

    // Selection Handlers
    const toggleSelectFile = (fileId: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedFileIds((prev) =>
            prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
        );
    };

    const toggleSelectFolder = (folderId: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedFolderIds((prev) =>
            prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
        );
    };

    const handleSelectAll = () => {
        if (totalSelected === files.length + folders.length) {
            setSelectedFileIds([]);
            setSelectedFolderIds([]);
        } else {
            setSelectedFileIds(files.map((f) => f.id));
            setSelectedFolderIds(folders.map((f) => f.id));
        }
    };

    // Batch Actions
    const handleBatchTrash = () => {
        const fileCount = selectedFileIds.length;
        const folderCount = selectedFolderIds.length;
        const parts = [];
        if (fileCount > 0) parts.push(`${fileCount} berkas`);
        if (folderCount > 0) parts.push(`${folderCount} folder`);
        const itemSummary = parts.join(' dan ') || `${totalSelected} item`;

        setDeleteModal({
            isOpen: true,
            title: `Pindahkan ${itemSummary} ke Sampah?`,
            message: `Apakah Anda yakin ingin memindahkan ${itemSummary} terpilih ke tempat sampah? Berkas masih dapat dipulihkan kembali kapan saja dari menu Sampah.`,
            isPermanent: false,
            onConfirm: () => {
                router.post(
                    route('drive.batch'),
                    {
                        action: 'trash',
                        file_ids: selectedFileIds,
                        folder_ids: selectedFolderIds,
                    },
                    {
                        onSuccess: () => {
                            setSelectedFileIds([]);
                            setSelectedFolderIds([]);
                            setInspectedItem(null);
                        },
                    }
                );
            },
        });
    };

    const handleBatchRestore = () => {
        router.post(
            route('drive.batch'),
            {
                action: 'restore',
                file_ids: selectedFileIds,
                folder_ids: selectedFolderIds,
            },
            {
                onSuccess: () => {
                    setSelectedFileIds([]);
                    setSelectedFolderIds([]);
                    setInspectedItem(null);
                },
            }
        );
    };

    const handleBatchForceDelete = () => {
        const fileCount = selectedFileIds.length;
        const folderCount = selectedFolderIds.length;
        const parts = [];
        if (fileCount > 0) parts.push(`${fileCount} berkas`);
        if (folderCount > 0) parts.push(`${folderCount} folder`);
        const itemSummary = parts.join(' dan ') || `${totalSelected} item`;

        setDeleteModal({
            isOpen: true,
            title: `Hapus Permanen ${itemSummary}?`,
            message: `PERINGATAN: ${itemSummary} terpilih akan dihapus selamanya dari penyimpanan fisik server. Tindakan ini tidak dapat dibatalkan!`,
            isPermanent: true,
            onConfirm: () => {
                router.post(
                    route('drive.batch'),
                    {
                        action: 'force_delete',
                        file_ids: selectedFileIds,
                        folder_ids: selectedFolderIds,
                    },
                    {
                        onSuccess: () => {
                            setSelectedFileIds([]);
                            setSelectedFolderIds([]);
                            setInspectedItem(null);
                        },
                    }
                );
            },
        });
    };

    const handleBatchDownload = () => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = route('drive.batch-download');

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }

        selectedFileIds.forEach((id) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'file_ids[]';
            input.value = String(id);
            form.appendChild(input);
        });

        selectedFolderIds.forEach((id) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'folder_ids[]';
            input.value = String(id);
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const handleBatchStar = (starred: boolean) => {
        router.post(
            route('drive.batch'),
            {
                action: starred ? 'star' : 'unstar',
                file_ids: selectedFileIds,
                folder_ids: selectedFolderIds,
            },
            {
                onSuccess: () => {
                    setSelectedFileIds([]);
                    setSelectedFolderIds([]);
                },
            }
        );
    };

    // Single Trash & Delete Actions
    const handleTrashFolder = (folder: FolderItem) => {
        setDeleteModal({
            isOpen: true,
            title: 'Pindahkan Folder ke Sampah?',
            message: `Folder "${folder.name}" beserta seluruh isinya akan dipindahkan ke tempat sampah.`,
            isPermanent: false,
            onConfirm: () => {
                router.delete(route('folders.destroy', folder.id), {
                    onSuccess: () => setInspectedItem(null),
                });
            },
        });
    };

    const handleTrashFile = (file: FileItem) => {
        setDeleteModal({
            isOpen: true,
            title: 'Pindahkan Berkas ke Sampah?',
            message: `Berkas "${file.name}" akan dipindahkan ke tempat sampah.`,
            isPermanent: false,
            onConfirm: () => {
                router.delete(route('files.destroy', file.id), {
                    onSuccess: () => setInspectedItem(null),
                });
            },
        });
    };

    const handlePermanentDeleteFolder = (folderId: number, folderName: string) => {
        setDeleteModal({
            isOpen: true,
            title: 'Hapus Folder Secara Permanen?',
            message: `Folder "${folderName}" dan seluruh isinya akan dihapus permanen dari server. Tindakan ini tidak dapat dibatalkan.`,
            isPermanent: true,
            onConfirm: () => {
                router.delete(route('folders.force-delete', folderId), {
                    onSuccess: () => setInspectedItem(null),
                });
            },
        });
    };

    const handlePermanentDeleteFile = (fileId: number, fileName: string) => {
        setDeleteModal({
            isOpen: true,
            title: 'Hapus Berkas Secara Permanen?',
            message: `Berkas "${fileName}" akan dihapus permanen dari server. Tindakan ini tidak dapat dibatalkan.`,
            isPermanent: true,
            onConfirm: () => {
                router.delete(route('files.force-delete', fileId), {
                    onSuccess: () => setInspectedItem(null),
                });
            },
        });
    };

    const handleEmptyTrash = () => {
        setDeleteModal({
            isOpen: true,
            title: 'Kosongkan Seluruh Tempat Sampah?',
            message: 'Semua folder dan berkas di tempat sampah akan dihapus selamanya dari server. Tindakan ini tidak dapat dibatalkan.',
            isPermanent: true,
            onConfirm: () => {
                router.post(route('files.empty-trash'), {}, {
                    onSuccess: () => setInspectedItem(null),
                });
            },
        });
    };

    const handleDuplicateFile = (file: FileItem) => {
        router.post(route('files.duplicate', file.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-poppins">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-1.5 text-xs font-medium overflow-x-auto py-1 max-w-full no-scrollbar">
                        <Link
                            href={route('drive.index', { section: 'all' })}
                            preserveState
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${!currentFolder && section === 'all'
                                    ? 'bg-[#FEF9EC] dark:bg-amber-950/40 text-[#9A5B00] dark:text-[#F9E6A8] font-semibold border border-[#F2A900]/30'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <HardDrive className="w-4 h-4 text-[#CC6F00]" />
                            <span>My Drive</span>
                        </Link>

                        {section === 'all' &&
                            breadcrumbs.map((crumb) => (
                                <React.Fragment key={crumb.id}>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                    <Link
                                        href={route('drive.index', { section: 'all', folder_id: crumb.id })}
                                        preserveState
                                        className={`px-3 py-1.5 rounded-xl transition-all truncate max-w-[160px] ${currentFolder?.id === crumb.id
                                                ? 'bg-[#FEF9EC] dark:bg-amber-950/40 text-[#9A5B00] dark:text-[#F9E6A8] font-semibold border border-[#F2A900]/30'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {crumb.name}
                                    </Link>
                                </React.Fragment>
                            ))}

                        {section !== 'all' && (
                            <>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                <span className="px-3 py-1.5 rounded-xl bg-[#FEF9EC] dark:bg-amber-950/40 text-[#9A5B00] dark:text-[#F9E6A8] font-semibold border border-[#F2A900]/30 capitalize">
                                    {section === 'recent' ? 'Terbaru' : section === 'starred' ? 'Berbintang' : 'Sampah'}
                                </span>
                            </>
                        )}
                    </nav>

                    {/* Controls, Actions & Search */}
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                        {/* Primary Upload & New Folder Action Buttons (Moved from Sidebar) */}
                        {section !== 'trash' && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs text-slate-900 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white shadow-xs hover:shadow-sm transition-all active:scale-98 shrink-0"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Upload Berkas</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsNewFolderOpen(true)}
                                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs active:scale-98 shrink-0"
                                    title="Buat Folder Baru"
                                >
                                    <FolderPlus className="w-4 h-4 text-[#CC6F00]" />
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari berkas..."
                                className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#F2A900] focus:ring-2 focus:ring-[#F2A900]/20"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        navigateWithParams({ search: undefined });
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </form>

                        {/* Advanced Search Filter Trigger */}
                        <button
                            type="button"
                            onClick={() => setIsAdvancedSearchOpen(true)}
                            className={`p-2 rounded-xl border transition-all ${hasActiveAdvancedFilter
                                    ? 'bg-[#FEF9EC] border-[#F2A900] text-[#CC6F00] font-bold shadow-2xs'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                            title="Pencarian Tingkat Lanjut (Advanced Search: tipe, ukuran, tanggal, tag)"
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>

                        {/* Download Manager Drawer Trigger */}
                        <button
                            type="button"
                            onClick={() => setIsDownloadManagerOpen(true)}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-600 transition-colors relative shadow-2xs"
                            title="Manajer Unduhan (Download Manager)"
                        >
                            <Download className="w-3.5 h-3.5 text-[#CC6F00]" />
                            {downloads.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F2A900] text-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center">
                                    {downloads.length > 9 ? '9+' : downloads.length}
                                </span>
                            )}
                        </button>

                        {/* View Switcher */}
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-white dark:bg-slate-800 shadow-2xs">
                            <button
                                onClick={() => handleSetViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid'
                                        ? 'bg-[#FEF9EC] text-[#9A5B00] font-bold shadow-2xs'
                                        : 'text-slate-400 hover:text-slate-700'
                                    }`}
                                title="Tampilan Grid"
                            >
                                <Grid className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => handleSetViewMode('list')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list'
                                        ? 'bg-[#FEF9EC] text-[#9A5B00] font-bold shadow-2xs'
                                        : 'text-slate-400 hover:text-slate-700'
                                    }`}
                                title="Tampilan List"
                            >
                                <List className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <Head>
                <title>Cloud Drive - CloudVault</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            {/* FLOATING TOP NOTIFICATION TOAST (Disappears after 5s, drops from top) */}
            {toast && (
                <div
                    key={toast.id}
                    role="alert"
                    aria-live="assertive"
                    className="fixed top-5 left-1/2 z-50 w-[94%] max-w-xl -translate-x-1/2 animate-toast-in font-poppins pointer-events-auto"
                >
                    <div
                        className={`relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 ${toast.action_type === 'trash' || toast.action_type === 'delete'
                                ? 'bg-red-50/95 dark:bg-red-950/95 border-red-200/90 dark:border-red-900/80 text-red-900 dark:text-red-200'
                                : toast.action_type === 'restore'
                                    ? 'bg-blue-50/95 dark:bg-blue-950/95 border-blue-200/90 dark:border-blue-900/80 text-blue-900 dark:text-blue-200'
                                    : toast.type === 'info'
                                        ? 'bg-amber-50/95 dark:bg-amber-950/95 border-amber-200/90 dark:border-amber-900/80 text-amber-900 dark:text-amber-200'
                                        : toast.type === 'error'
                                            ? 'bg-red-50/95 dark:bg-red-950/95 border-red-200/90 dark:border-red-900/80 text-red-900 dark:text-red-200'
                                            : 'bg-emerald-50/95 dark:bg-emerald-950/95 border-emerald-200/90 dark:border-emerald-900/80 text-emerald-900 dark:text-emerald-200'
                            }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className={`p-2 rounded-xl shrink-0 ${toast.action_type === 'trash' || toast.action_type === 'delete'
                                        ? 'bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300'
                                        : toast.action_type === 'restore'
                                            ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300'
                                            : toast.type === 'info'
                                                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                                                : toast.type === 'error'
                                                    ? 'bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300'
                                                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300'
                                    }`}
                            >
                                {toast.action_type === 'trash' || toast.action_type === 'delete' ? (
                                    <Trash2 className="w-4 h-4" />
                                ) : toast.action_type === 'restore' ? (
                                    <RotateCcw className="w-4 h-4" />
                                ) : toast.type === 'error' ? (
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                ) : toast.type === 'info' ? (
                                    <AlertCircle className="w-4 h-4" />
                                ) : (
                                    <CheckCircle className="w-4 h-4" />
                                )}
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs font-semibold leading-snug truncate sm:whitespace-normal">
                                    {toast.message}
                                </p>
                                {toast.timestamp && (
                                    <p className="text-[11px] opacity-80 mt-0.5 flex items-center gap-1.5 font-medium">
                                        <Clock className="w-3.5 h-3.5 shrink-0" />
                                        <span>
                                            {toast.action_type === 'trash' || toast.action_type === 'delete'
                                                ? `Waktu Terhapus: ${toast.timestamp}`
                                                : toast.action_type === 'restore'
                                                    ? `Waktu Dipulihkan: ${toast.timestamp}`
                                                    : toast.action_type === 'upload'
                                                        ? `Selesai Diunggah: ${toast.timestamp}`
                                                        : `Waktu Selesai: ${toast.timestamp}`}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setToast(null)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                            title="Tutup pemberitahuan"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* 5-second animated progress timer bar at bottom edge */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 overflow-hidden">
                            <div
                                className={`h-full animate-toast-progress ${toast.action_type === 'trash' || toast.action_type === 'delete'
                                        ? 'bg-red-500'
                                        : toast.action_type === 'restore'
                                            ? 'bg-blue-500'
                                            : toast.type === 'info'
                                                ? 'bg-amber-500'
                                                : toast.type === 'error'
                                                    ? 'bg-red-500'
                                                    : 'bg-emerald-500'
                                    }`}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                onClick={(e) => {
                    (e.target as HTMLInputElement).value = '';
                }}
                multiple
                className="hidden"
            />

            <div
                className="min-h-[calc(100vh-130px)] flex flex-col md:flex-row relative font-poppins"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drag and Drop Overlay */}
                {isDragging && (
                    <div className="absolute inset-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border-2 border-dashed border-[#F2A900] rounded-3xl flex flex-col items-center justify-center pointer-events-none transition-all">
                        <Upload className="w-12 h-12 text-[#CC6F00] animate-bounce mb-3" />
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Lepaskan Berkas di Sini</h3>
                        <p className="text-xs text-slate-500">Berkas akan otomatis diunggah ke folder ini.</p>
                    </div>
                )}

                {/* SIDEBAR NAVIGATION (Desktop Column + Mobile Slide-over Drawer) */}
                {isMobileSidebarOpen && (
                    <div
                        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs md:hidden animate-fade-in"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                <aside
                    className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] p-4 bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between overflow-y-auto transition-transform duration-300 md:static md:z-auto md:w-60 md:shadow-none md:border-r md:border-slate-200/80 md:bg-white/75 md:backdrop-blur-xs md:dark:bg-slate-900/50 md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                        }`}
                >
                    {/* Mobile Drawer Close Header */}
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800 md:hidden">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-[#CC6F00]" />
                            <span>Navigasi Drive</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-5">
                        {/* Navigation Menu */}
                        <div className="space-y-1">
                            <Link
                                href={route('drive.index', { section: 'all' })}
                                preserveState
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${section === 'all'
                                        ? 'bg-[#FEF9EC] dark:bg-amber-950/40 text-[#9A5B00] dark:text-[#F9E6A8] font-semibold border border-[#F2A900]/30'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
                                    }`}
                            >
                                <HardDrive className="w-4 h-4 text-[#CC6F00]" />
                                <span>My Drive</span>
                            </Link>

                            <Link
                                href={route('drive.index', { section: 'recent' })}
                                preserveState
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${section === 'recent'
                                        ? 'bg-[#FEF9EC] dark:bg-amber-950/40 text-[#9A5B00] dark:text-[#F9E6A8] font-semibold border border-[#F2A900]/30'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
                                    }`}
                            >
                                <Clock className="w-4 h-4 text-[#CC6F00]" />
                                <span>Terbaru (Recent)</span>
                            </Link>

                            <Link
                                href={route('drive.index', { section: 'starred' })}
                                preserveState
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${section === 'starred'
                                        ? 'bg-[#FEF9EC] dark:bg-amber-950/40 text-[#9A5B00] dark:text-[#F9E6A8] font-semibold border border-[#F2A900]/30'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
                                    }`}
                            >
                                <Star className="w-4 h-4 text-[#F2A900] fill-[#F2A900]" />
                                <span>Berbintang (Starred)</span>
                            </Link>

                            <Link
                                href={route('drive.index', { section: 'trash' })}
                                preserveState
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${section === 'trash'
                                        ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-semibold border border-red-200 dark:border-red-900/60'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-red-50/50 hover:text-red-600'
                                    }`}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Sampah (Trash)</span>
                            </Link>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileSidebarOpen(false);
                                    setIsActivityLogOpen(true);
                                }}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-[#FEF9EC] hover:text-[#9A5B00] dark:hover:bg-slate-800 transition-all text-left"
                            >
                                <Activity className="w-4 h-4 text-[#CC6F00]" />
                                <span>Log Aktivitas</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileSidebarOpen(false);
                                    setIsFileRequestOpen(true);
                                }}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-[#FEF9EC] hover:text-[#9A5B00] dark:hover:bg-slate-800 transition-all text-left"
                            >
                                <FileUp className="w-4 h-4 text-[#CC6F00]" />
                                <span>Minta Berkas (Request)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileSidebarOpen(false);
                                    setIsWhatsAppModalOpen(true);
                                }}
                                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-[#E8F8F0] hover:text-[#075E54] dark:hover:bg-emerald-950/40 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="w-4 h-4 text-[#25D366] group-hover:scale-110 transition-transform" />
                                    <span>Integrasi WhatsApp</span>
                                </div>
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#25D366]/15 text-[#075E54] dark:text-[#25D366]">
                                    API
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileSidebarOpen(false);
                                    setIsDuplicatesOpen(true);
                                }}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-[#FEF9EC] hover:text-[#9A5B00] dark:hover:bg-slate-800 transition-all text-left"
                            >
                                <Files className="w-4 h-4 text-[#CC6F00]" />
                                <span>Pindai Duplikat</span>
                            </button>
                        </div>
                    </div>

                    {/* Storage Bar Indicator & Breakdown with Largest File Category */}
                    <div
                        onClick={() => setIsStorageAnalyticsOpen(true)}
                        className="pt-5 border-t border-slate-200/80 space-y-3 cursor-pointer group hover:opacity-95 transition-all"
                        title="Klik untuk membuka Analisis Penyimpanan Lengkap"
                    >
                        <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                            <span className="flex items-center gap-1.5 font-bold group-hover:text-[#CC6F00] transition-colors">
                                <PieChart className="w-3.5 h-3.5 text-[#CC6F00]" />
                                <span>Kapasitas Cloud</span>
                            </span>
                            <span className="font-bold text-slate-900 group-hover:text-[#CC6F00]">{storage.percentage}%</span>
                        </div>

                        {/* Multi-Color Segmented Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex shadow-2xs">
                            {storage.used === 0 ? (
                                <div className="w-0 h-full" />
                            ) : (
                                storage.categories?.filter((c) => c.bytes > 0).map((cat) => {
                                    // Calculate display width: ensure minimum visible width if used space is tiny
                                    const minActiveWidth = Math.max(storage.percentage, 4);
                                    const segmentWidth = (cat.percentage_of_used / 100) * minActiveWidth;

                                    return (
                                        <div
                                            key={cat.key}
                                            style={{
                                                width: `${Math.max(segmentWidth, 1.5)}%`,
                                                backgroundColor: cat.color,
                                            }}
                                            className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                            title={`${cat.label}: ${cat.formatted} (${cat.percentage_of_used}% dari total terpakai)`}
                                        />
                                    );
                                })
                            )}
                        </div>

                        {/* Largest File Category Indicator Badge */}
                        {storage.largest_category && storage.used > 0 ? (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        File Terbesar
                                    </span>
                                    <span
                                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs"
                                        style={{ backgroundColor: storage.largest_category.color }}
                                    >
                                        {storage.largest_category.percentage_of_used}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-2 ring-white"
                                        style={{ backgroundColor: storage.largest_category.color }}
                                    />
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                        {storage.largest_category.label}
                                    </span>
                                    <span className="text-xs text-slate-500 ml-auto font-medium">
                                        {storage.largest_category.formatted}
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        {/* Capacity Summary Text */}
                        <div className="text-[11px] text-slate-500 space-y-0.5">
                            <p className="font-medium text-slate-700">
                                {storage.formatted_used} dari {storage.formatted_limit} terpakai
                            </p>
                            {storage.trashed && storage.trashed > 0 ? (
                                <p className="text-amber-700 text-[10px]">
                                    (Termasuk {storage.formatted_trashed} di Sampah)
                                </p>
                            ) : null}
                        </div>

                        {/* Category Legend Breakdown */}
                        {storage.categories && storage.categories.some((c) => c.bytes > 0) && (
                            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                                {storage.categories
                                    .filter((c) => c.bytes > 0)
                                    .map((cat) => (
                                        <div
                                            key={cat.key}
                                            className="flex items-center gap-1.5 min-w-0"
                                            title={`${cat.label}: ${cat.formatted} (${cat.percentage_of_used}%)`}
                                        >
                                            <span
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                            <span className="text-slate-600 truncate text-[10px]">
                                                {cat.label}
                                            </span>
                                            <span className="text-slate-400 text-[10px] ml-auto font-mono">
                                                {cat.formatted}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 p-3.5 sm:p-4 md:p-6 overflow-y-auto">
                    {/* Mobile Quick Action Toolbar (visible on < md screens) */}
                    <div className="mb-4 flex items-center justify-between gap-2 md:hidden">
                        <button
                            type="button"
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 transition-colors active:scale-98"
                        >
                            <Layers className="w-4 h-4 text-[#CC6F00]" />
                            <span>Menu & Kuota</span>
                        </button>

                        {section !== 'trash' && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs text-slate-950 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white shadow-xs transition-all active:scale-98"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Upload</span>
                                </button>
                                <button
                                    onClick={() => setIsNewFolderOpen(true)}
                                    className="p-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-2xs active:scale-98"
                                    title="Folder Baru"
                                >
                                    <FolderPlus className="w-4 h-4 text-[#CC6F00]" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Uploading progress bar with Cancel Action */}
                    {uploading && (
                        <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#F2A900]/50 shadow-md animate-fade-in">
                            <div className="flex items-center justify-between gap-3 mb-2.5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0 border border-[#F2A900]/30">
                                        <Upload className="w-4 h-4 text-[#CC6F00] animate-bounce" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                {uploadFileDetails?.name || 'Mengunggah Berkas...'}
                                            </span>
                                            {uploadFileDetails?.size && (
                                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium shrink-0">
                                                    {uploadFileDetails.size}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {uploadProgress < 100
                                                ? `Sedang mengunggah ke ${currentFolder ? `folder "${currentFolder.name}"` : 'My Drive'}...`
                                                : 'Memproses berkas di server...'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-sm font-bold text-[#CC6F00] font-mono">
                                        {uploadProgress}%
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCancelUpload}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/60 transition-colors shadow-2xs"
                                        title="Batalkan proses pengunggahan berkas ini"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Batalkan</span>
                                    </button>
                                </div>
                            </div>

                            {/* Progress track */}
                            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-[#F2A900] via-[#E59800] to-[#CC6F00] transition-all duration-200 rounded-full"
                                    style={{ width: `${Math.max(uploadProgress, 2)}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                                <span>Pengunggahan tetap berjalan meskipun Anda berpindah tab.</span>
                                <span>Klik Batalkan untuk menghentikan seketika.</span>
                            </div>
                        </div>
                    )}

                    {/* Active Advanced Search Filters Banner */}
                    {hasActiveAdvancedFilter && (
                        <div className="mb-4 p-3 rounded-2xl bg-[#FEF9EC] dark:bg-amber-950/40 border border-[#F2A900]/40 flex items-center justify-between text-xs animate-fade-in">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <span className="font-bold text-[#CC6F00] flex items-center gap-1.5 shrink-0">
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    <span>Pencarian Khusus:</span>
                                </span>
                                {advancedSearch?.search_type && advancedSearch.search_type !== 'all' && (
                                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-[#F2A900]/40 font-semibold text-slate-800 dark:text-slate-100">
                                        Tipe: {advancedSearch.search_type}
                                    </span>
                                )}
                                {advancedSearch?.size_range && (
                                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-[#F2A900]/40 font-semibold text-slate-800 dark:text-slate-100">
                                        Ukuran: {advancedSearch.size_range}
                                    </span>
                                )}
                                {advancedSearch?.date_range && (
                                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-[#F2A900]/40 font-semibold text-slate-800 dark:text-slate-100">
                                        Tanggal: {advancedSearch.date_range}
                                    </span>
                                )}
                                {advancedSearch?.tag && (
                                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-[#F2A900]/40 font-semibold text-slate-800 dark:text-slate-100">
                                        #{advancedSearch.tag}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => handleApplyAdvancedSearch({})}
                                className="text-xs font-bold text-red-600 hover:underline shrink-0 ml-3"
                            >
                                Reset Filter
                            </button>
                        </div>
                    )}

                    {/* Filter Category Pills Bar */}
                    <div className="mb-5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar max-w-full">
                        {FILTER_TABS.map((tab) => {
                            const IconComponent = tab.icon;
                            const isActive = activeFilter === tab.key;

                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => handleFilterChange(tab.key)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${isActive
                                            ? 'bg-[#FEF9EC] dark:bg-amber-950/50 text-[#9A5B00] dark:text-[#F9E6A8] font-bold border border-[#F2A900]/40 shadow-xs'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
                                        }`}
                                >
                                    <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-[#CC6F00]' : 'text-slate-400'}`} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Trash header alert */}
                    {section === 'trash' && (
                        <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-xs font-medium">
                                <Trash2 className="w-4 h-4 text-[#CC6F00] shrink-0" />
                                <span>Item di tempat sampah akan tersimpan sampai Anda menghapusnya secara permanen.</span>
                            </div>
                            {(folders.length > 0 || files.length > 0) && (
                                <button
                                    onClick={handleEmptyTrash}
                                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shrink-0 shadow-xs"
                                >
                                    Kosongkan Tempat Sampah
                                </button>
                            )}
                        </div>
                    )}

                    {/* EMPTY STATE */}
                    {folders.length === 0 && files.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-4">
                                {section === 'trash' ? (
                                    <Trash2 className="w-8 h-8" />
                                ) : section === 'starred' ? (
                                    <Star className="w-8 h-8 text-[#F2A900] fill-[#F2A900]" />
                                ) : (
                                    <FolderPlus className="w-8 h-8 text-slate-400" />
                                )}
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                                {section === 'trash'
                                    ? 'Tempat sampah kosong'
                                    : section === 'starred'
                                        ? 'Belum ada berkas berbintang'
                                        : search
                                            ? 'Tidak ada berkas yang sesuai dengan pencarian'
                                            : activeFilter !== 'all'
                                                ? 'Tidak ada berkas untuk kategori ini'
                                                : 'Direktori ini belum memiliki berkas'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                                {section === 'trash'
                                    ? 'Tidak ada item yang dihapus saat ini.'
                                    : section === 'starred'
                                        ? 'Tandai berkas atau folder penting Anda dengan bintang untuk akses cepat.'
                                        : search
                                            ? 'Coba gunakan kata kunci pencarian yang lain.'
                                            : 'Mulai dengan mengunggah berkas atau membuat folder baru.'}
                            </p>
                            {section === 'all' && !search && activeFilter === 'all' && (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white transition-all shadow-xs"
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Upload Berkas</span>
                                    </button>
                                    <button
                                        onClick={() => setIsNewFolderOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 transition-colors"
                                    >
                                        <FolderPlus className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Folder Baru</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* QUICK ACCESS (AKSES CEPAT) SECTION */}
                    {section === 'all' && !currentFolder && !search && activeFilter === 'all' && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#CC6F00]">
                                        <Zap className="w-3.5 h-3.5 fill-[#CC6F00]" />
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                        Akses Cepat
                                    </h4>
                                    <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-900/60">
                                        {((quickAccessTab === 'recent' ? quickAccess?.recent : quickAccess?.starred) || []).length} berkas
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Switch between Recent & Starred */}
                                    <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                        <button
                                            type="button"
                                            onClick={() => setQuickAccessTab('recent')}
                                            className={`px-2.5 py-1 rounded-md transition-all ${quickAccessTab === 'recent'
                                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                                                    : 'hover:text-slate-900 dark:hover:text-slate-100'
                                                }`}
                                        >
                                            Terbaru
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickAccessTab('starred')}
                                            className={`px-2.5 py-1 rounded-md transition-all ${quickAccessTab === 'starred'
                                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                                                    : 'hover:text-slate-900 dark:hover:text-slate-100'
                                                }`}
                                        >
                                            Berbintang ({quickAccess?.starred?.length ?? 0})
                                        </button>
                                    </div>

                                    {/* Collapse / Expand Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setIsQuickAccessCollapsed(!isQuickAccessCollapsed)}
                                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title={isQuickAccessCollapsed ? 'Tampilkan Akses Cepat' : 'Sembunyikan Akses Cepat'}
                                    >
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isQuickAccessCollapsed ? '-rotate-90' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {!isQuickAccessCollapsed && (
                                ((quickAccessTab === 'recent' ? quickAccess?.recent : quickAccess?.starred) || []).length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                                        {((quickAccessTab === 'recent' ? quickAccess?.recent : quickAccess?.starred) || []).map((file) => (
                                            <div
                                                key={`qa-${file.id}`}
                                                onClick={() => setInspectedItem({ type: 'file', item: file })}
                                                onDoubleClick={() => setPreviewFile(file)}
                                                className="group relative flex flex-col justify-between p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#F2A900]/70 hover:shadow-md transition-all cursor-pointer active:scale-98"
                                            >
                                                {/* Top row: Icon + Hover Quick Actions */}
                                                <div className="flex items-center justify-between mb-2.5">
                                                    <FileIcon extension={file.extension} mimeType={file.mime_type} className="w-7 h-7 shrink-0" />
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewFile(file);
                                                            }}
                                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                            title="Pratinjau Cepat"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                        <a
                                                            href={route('files.download', file.id)}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                trackDownload(file.name, file.formatted_size, route('files.download', file.id));
                                                            }}
                                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                            title="Unduh Berkas"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                        </a>
                                                    </div>
                                                </div>

                                                {/* Middle: File Name & Size */}
                                                <div className="mb-2.5 min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#CC6F00] transition-colors" title={file.name}>
                                                        {file.name}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {file.formatted_size}
                                                    </span>
                                                </div>

                                                {/* Bottom: Folder origin badge & Time */}
                                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 gap-1">
                                                    <span
                                                        onClick={(e) => {
                                                            if (file.folder_id) {
                                                                e.stopPropagation();
                                                                router.get(route('drive.index', { section: 'all', folder_id: file.folder_id }), {}, { preserveState: true });
                                                            }
                                                        }}
                                                        className="truncate max-w-[95px] font-medium hover:text-[#CC6F00] hover:underline"
                                                        title={`Lokasi folder: ${file.folder_name || 'My Drive'}`}
                                                    >
                                                        📁 {file.folder_name || 'My Drive'}
                                                    </span>
                                                    <span className="shrink-0 text-slate-400">
                                                        {file.updated_at}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
                                        {quickAccessTab === 'starred'
                                            ? 'Belum ada berkas berbintang. Berikan tanda bintang pada berkas penting untuk melihatnya di sini.'
                                            : 'Belum ada berkas terkini.'}
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    {/* FOLDERS SECTION */}
                    {folders.length > 0 && activeFilter === 'all' && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Folder ({folders.length})
                                </h4>
                            </div>

                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {folders.map((folder) => {
                                        const menuKey = `folder-${folder.id}`;
                                        const isMenuOpen = activeMenuId === menuKey;
                                        const isSelected = selectedFolderIds.includes(folder.id);

                                        return (
                                            <div
                                                key={folder.id}
                                                onClick={() => setInspectedItem({ type: 'folder', item: folder })}
                                                onDoubleClick={() => {
                                                    if (section === 'all') {
                                                        router.get(route('drive.index', { section: 'all', folder_id: folder.id }), {}, { preserveState: true });
                                                    }
                                                }}
                                                className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${isSelected
                                                        ? 'border-[#F2A900] bg-[#FEF9EC]/50 dark:bg-amber-950/30 shadow-xs'
                                                        : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#F2A900]/70 shadow-2xs hover:shadow-xs'
                                                    }`}
                                            >
                                                {/* Checkbox */}
                                                <div
                                                    onClick={(e) => toggleSelectFolder(folder.id, e)}
                                                    className={`mr-2.5 transition-opacity ${isSelected || totalSelected > 0
                                                            ? 'opacity-100'
                                                            : 'opacity-0 group-hover:opacity-100'
                                                        }`}
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-4 h-4 text-[#CC6F00]" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                                                    )}
                                                </div>

                                                <div
                                                    onClick={() => {
                                                        if (section === 'all') {
                                                            router.get(route('drive.index', { section: 'all', folder_id: folder.id }), {}, { preserveState: true });
                                                        }
                                                    }}
                                                    className="flex items-center gap-3 min-w-0 flex-1"
                                                >
                                                    <CustomFolderIcon color={folder.color || '#F2A900'} className="w-7 h-7 shrink-0" />
                                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                        {folder.name}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                                    {section !== 'trash' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.post(route('folders.star', folder.id));
                                                            }}
                                                            className={`p-1 rounded-lg transition-colors ${folder.is_starred
                                                                    ? 'text-[#F2A900]'
                                                                    : 'text-slate-300 hover:text-[#F2A900] opacity-0 group-hover:opacity-100'
                                                                }`}
                                                            title={folder.is_starred ? 'Hapus bintang' : 'Beri bintang'}
                                                        >
                                                            <Star className={`w-3.5 h-3.5 ${folder.is_starred ? 'fill-[#F2A900]' : ''}`} />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuId(isMenuOpen ? null : menuKey);
                                                        }}
                                                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        <MoreVertical className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Dropdown Menu */}
                                                {isMenuOpen && (
                                                    <div
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="absolute right-3 top-12 z-30 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs animate-fade-in font-poppins"
                                                    >
                                                        {section !== 'trash' ? (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        router.get(route('drive.index', { section: 'all', folder_id: folder.id }), {}, { preserveState: true });
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <FolderIcon className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                    <span>Buka Folder</span>
                                                                </button>
                                                                <a
                                                                    href={route('folders.download', folder.id)}
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        trackDownload(folder.name + '.zip', undefined, route('folders.download', folder.id));
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <Download className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                    <span>Unduh (ZIP)</span>
                                                                </a>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        setColorFolder(folder);
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <Palette className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                    <span>Ubah Warna Folder</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        setRenameItem({ id: folder.id, name: folder.name, type: 'folder' });
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                    <span>Ganti Nama</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        setMoveTarget({
                                                                            type: 'folder',
                                                                            id: folder.id,
                                                                            name: folder.name,
                                                                            currentFolderId: folder.parent_id,
                                                                        });
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <FolderInput className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                    <span>Pindahkan Folder</span>
                                                                </button>
                                                                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        handleTrashFolder(folder);
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 font-medium flex items-center gap-2"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    <span>Pindahkan ke Sampah</span>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        router.post(route('folders.restore', folder.id));
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                                                    <span>Pulihkan</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        handlePermanentDeleteFolder(folder.id, folder.name);
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 font-medium flex items-center gap-2"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    <span>Hapus Permanen</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* LIST VIEW FOR FOLDERS */
                                <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar bg-white dark:bg-slate-900 shadow-xs">
                                    <table className="w-full min-w-[560px] sm:min-w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-800/40">
                                                <th className="py-3 px-4 w-10">
                                                    {/* Checkbox placeholder */}
                                                </th>
                                                <th className="py-3 px-4">Nama Folder</th>
                                                <th className="py-3 px-4 hidden sm:table-cell">Tipe</th>
                                                <th className="py-3 px-4 hidden md:table-cell">
                                                    {section === 'trash' ? 'Waktu Terhapus' : 'Waktu Diperbarui'}
                                                </th>
                                                <th className="py-3 px-4 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                            {folders.map((folder) => {
                                                const isSelected = selectedFolderIds.includes(folder.id);

                                                return (
                                                    <tr
                                                        key={folder.id}
                                                        onClick={() => setInspectedItem({ type: 'folder', item: folder })}
                                                        onDoubleClick={() => {
                                                            if (section === 'all') {
                                                                router.get(route('drive.index', { section: 'all', folder_id: folder.id }), {}, { preserveState: true });
                                                            }
                                                        }}
                                                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${isSelected ? 'bg-[#FEF9EC]/50 dark:bg-amber-950/20' : ''
                                                            }`}
                                                    >
                                                        <td className="py-3 px-4" onClick={(e) => toggleSelectFolder(folder.id, e)}>
                                                            {isSelected ? (
                                                                <CheckSquare className="w-4 h-4 text-[#CC6F00]" />
                                                            ) : (
                                                                <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div
                                                                className="flex items-center gap-3"
                                                                onClick={() => {
                                                                    if (section === 'all') {
                                                                        router.get(route('drive.index', { section: 'all', folder_id: folder.id }), {}, { preserveState: true });
                                                                    }
                                                                }}
                                                            >
                                                                <CustomFolderIcon color={folder.color || '#F2A900'} className="w-5 h-5 shrink-0" />
                                                                <span className="font-semibold text-slate-800 dark:text-slate-100 truncate hover:text-[#CC6F00] transition-colors">
                                                                    {folder.name}
                                                                </span>
                                                                {folder.is_starred && (
                                                                    <Star className="w-3.5 h-3.5 text-[#F2A900] fill-[#F2A900] shrink-0" />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-500 hidden sm:table-cell">
                                                            Folder
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-400 hidden md:table-cell">
                                                            {section === 'trash' && folder.deleted_at ? folder.deleted_at : (folder.updated_at || folder.created_at || '-')}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                                {section !== 'trash' ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => router.post(route('folders.star', folder.id))}
                                                                            className={`p-1.5 rounded-lg transition-colors ${folder.is_starred ? 'text-[#F2A900]' : 'text-slate-400 hover:text-[#F2A900]'
                                                                                }`}
                                                                            title={folder.is_starred ? 'Hapus bintang' : 'Beri bintang'}
                                                                        >
                                                                            <Star className={`w-3.5 h-3.5 ${folder.is_starred ? 'fill-[#F2A900]' : ''}`} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                router.get(route('drive.index', { section: 'all', folder_id: folder.id }), {}, { preserveState: true });
                                                                            }}
                                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                            title="Buka Folder"
                                                                        >
                                                                            <FolderIcon className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                        </button>
                                                                        <a
                                                                            href={route('folders.download', folder.id)}
                                                                            onClick={() => trackDownload(folder.name + '.zip', undefined, route('folders.download', folder.id))}
                                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                            title="Unduh Folder (ZIP)"
                                                                        >
                                                                            <Download className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                        </a>
                                                                        <button
                                                                            onClick={() => setColorFolder(folder)}
                                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                            title="Ubah Warna Folder"
                                                                        >
                                                                            <Palette className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setRenameItem({ id: folder.id, name: folder.name, type: 'folder' })}
                                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                            title="Ganti Nama"
                                                                        >
                                                                            <Edit2 className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleTrashFolder(folder)}
                                                                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                                            title="Pindahkan ke Sampah"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => router.post(route('folders.restore', folder.id))}
                                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                                                            title="Pulihkan Folder"
                                                                        >
                                                                            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handlePermanentDeleteFolder(folder.id, folder.name)}
                                                                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                                                            title="Hapus Permanen"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* FILES SECTION */}
                    {files.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSelectAll}
                                        className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                        title={totalSelected === files.length + folders.length ? 'Batal Pilih Semua' : 'Pilih Semua (Ctrl+A)'}
                                    >
                                        {totalSelected > 0 && totalSelected === files.length + folders.length ? (
                                            <CheckSquare className="w-4 h-4 text-[#CC6F00]" />
                                        ) : totalSelected > 0 ? (
                                            <Square className="w-4 h-4 text-[#CC6F00]" />
                                        ) : (
                                            <Square className="w-4 h-4 text-slate-400" />
                                        )}
                                    </button>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Berkas ({files.length})
                                    </h4>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>Urutkan:</span>
                                    <button
                                        onClick={() => handleSortChange('name')}
                                        className={`hover:text-[#CC6F00] transition-colors ${sortBy === 'name' ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}`}
                                    >
                                        Nama
                                    </button>
                                    <span>•</span>
                                    <button
                                        onClick={() => handleSortChange('updated_at')}
                                        className={`hover:text-[#CC6F00] transition-colors ${sortBy === 'updated_at' ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}`}
                                    >
                                        Waktu
                                    </button>
                                    <span>•</span>
                                    <button
                                        onClick={() => handleSortChange('size')}
                                        className={`hover:text-[#CC6F00] transition-colors ${sortBy === 'size' ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}`}
                                    >
                                        Ukuran
                                    </button>
                                </div>
                            </div>

                            {/* GRID VIEW */}
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                                    {files.map((file) => {
                                        const menuKey = `file-${file.id}`;
                                        const isMenuOpen = activeMenuId === menuKey;
                                        const isSelected = selectedFileIds.includes(file.id);

                                        return (
                                            <div
                                                key={file.id}
                                                onClick={() => setInspectedItem({ type: 'file', item: file })}
                                                onDoubleClick={() => setPreviewFile(file)}
                                                className={`group relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${isSelected
                                                        ? 'border-[#F2A900] bg-[#FEF9EC]/50 dark:bg-amber-950/30 shadow-xs'
                                                        : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#F2A900]/70 shadow-2xs hover:shadow-xs'
                                                    }`}
                                            >
                                                {/* Top header on card */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <div
                                                        onClick={(e) => toggleSelectFile(file.id, e)}
                                                        className={`transition-opacity ${isSelected || totalSelected > 0
                                                                ? 'opacity-100'
                                                                : 'opacity-0 group-hover:opacity-100'
                                                            }`}
                                                    >
                                                        {isSelected ? (
                                                            <CheckSquare className="w-4 h-4 text-[#CC6F00]" />
                                                        ) : (
                                                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        {file.has_active_share && (
                                                            <span className="p-1 text-emerald-600" title="Berkas sedang dibagikan secara publik">
                                                                <Share2 className="w-3 h-3" />
                                                            </span>
                                                        )}

                                                        {file.is_locked && (
                                                            <span className="p-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" title="Berkas sedang dikunci dari pengeditan">
                                                                <Lock className="w-3.5 h-3.5" />
                                                            </span>
                                                        )}

                                                        {section !== 'trash' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.post(route('files.star', file.id));
                                                                }}
                                                                className={`p-1 rounded-lg transition-colors ${file.is_starred
                                                                        ? 'text-[#F2A900]'
                                                                        : 'text-slate-300 hover:text-[#F2A900] opacity-0 group-hover:opacity-100'
                                                                    }`}
                                                                title={file.is_starred ? 'Hapus bintang' : 'Beri bintang'}
                                                            >
                                                                <Star className={`w-3.5 h-3.5 ${file.is_starred ? 'fill-[#F2A900]' : ''}`} />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveMenuId(isMenuOpen ? null : menuKey);
                                                            }}
                                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        >
                                                            <MoreVertical className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Card Icon & Center */}
                                                <div className="flex flex-col items-center justify-center py-4">
                                                    <FileIcon extension={file.extension} mimeType={file.mime_type} className="w-12 h-12" />
                                                </div>

                                                {/* Card Footer Info */}
                                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                                    <div className="flex items-center gap-1.5">
                                                        {file.is_locked && <Lock className="w-3 h-3 text-amber-600 shrink-0" />}
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate" title={file.name}>
                                                            {file.name}
                                                        </p>
                                                    </div>

                                                    {/* Tags list */}
                                                    {file.tags && file.tags.length > 0 && (
                                                        <div className="flex items-center gap-1 flex-wrap mt-1">
                                                            {file.tags.slice(0, 2).map((t, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#FEF9EC] dark:bg-amber-950/40 text-[#9A5B00] dark:text-amber-200 border border-[#F2A900]/30"
                                                                >
                                                                    #{t}
                                                                </span>
                                                            ))}
                                                            {file.tags.length > 2 && (
                                                                <span className="text-[9px] text-slate-400 font-mono">
                                                                    +{file.tags.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                                                        <span>{file.formatted_size}</span>
                                                        <span title={section === 'trash' && file.deleted_at ? `Waktu Terhapus: ${file.deleted_at}` : `Waktu Diperbarui: ${file.updated_at}`}>
                                                            {section === 'trash' && file.deleted_at ? `Hapus: ${file.deleted_at}` : file.updated_at}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Dropdown Menu */}
                                                {isMenuOpen && (
                                                    <div
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="absolute right-3 top-10 z-30 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs animate-fade-in font-poppins"
                                                    >
                                                        {section !== 'trash' ? (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        setPreviewFile(file);
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                    <span>Pratinjau</span>
                                                                </button>
                                                                <a
                                                                    href={route('files.download', file.id)}
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        trackDownload(file.name, file.formatted_size, route('files.download', file.id));
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <Download className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                    <span>Unduh</span>
                                                                </a>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        setShareFile(file);
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <Share2 className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                    <span>Bagikan</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        setTagFile(file);
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <Tag className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                    <span>Kelola Label / Tag</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        router.post(route('files.lock', file.id));
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    {file.is_locked ? (
                                                                        <>
                                                                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                                                            <span>Buka Kunci Berkas</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                                                                            <span>Kunci Berkas</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        setHistoryFile(file);
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <History className="w-3.5 h-3.5 text-violet-600" />
                                                                    <span>Riwayat Versi</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        handleDuplicateFile(file);
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <Copy className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                    <span>Duplikasi</span>
                                                                </button>
                                                                <button
                                                                    disabled={file.is_locked}
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        setRenameItem({ id: file.id, name: file.name, type: 'file' });
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2 disabled:opacity-50"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                    <span>Ganti Nama {file.is_locked && '(Terkunci)'}</span>
                                                                </button>
                                                                <button
                                                                    disabled={file.is_locked}
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        setMoveTarget({
                                                                            type: 'file',
                                                                            id: file.id,
                                                                            name: file.name,
                                                                            currentFolderId: file.folder_id,
                                                                        });
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2 disabled:opacity-50"
                                                                >
                                                                    <FolderInput className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                    <span>Pindahkan {file.is_locked && '(Terkunci)'}</span>
                                                                </button>
                                                                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                                                <button
                                                                    disabled={file.is_locked}
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        handleTrashFile(file);
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 font-medium flex items-center gap-2 disabled:opacity-50"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    <span>Pindahkan ke Sampah {file.is_locked && '(Terkunci)'}</span>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        setPreviewFile(file);
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                    <span>Pratinjau</span>
                                                                </button>
                                                                <a
                                                                    href={route('files.download', file.id)}
                                                                    onClick={() => setActiveMenuId(null)}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <Download className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                    <span>Unduh</span>
                                                                </a>
                                                                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        router.post(route('files.restore', file.id));
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                                                                >
                                                                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                                                    <span>Pulihkan</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveMenuId(null);
                                                                        handlePermanentDeleteFile(file.id, file.name);
                                                                    }}
                                                                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 font-medium flex items-center gap-2"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    <span>Hapus Permanen</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* LIST VIEW */
                                <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar bg-white dark:bg-slate-900 shadow-xs">
                                    <table className="w-full min-w-[560px] sm:min-w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-800/40">
                                                <th className="py-3 px-4 w-10 cursor-pointer" onClick={handleSelectAll} title="Pilih Semua / Batal Pilih">
                                                    {totalSelected > 0 && totalSelected === files.length + folders.length ? (
                                                        <CheckSquare className="w-4 h-4 text-[#CC6F00]" />
                                                    ) : totalSelected > 0 ? (
                                                        <CheckSquare className="w-4 h-4 text-[#F2A900]" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                                                    )}
                                                </th>
                                                <th className="py-3 px-4">Nama Berkas</th>
                                                <th className="py-3 px-4 hidden sm:table-cell">Ukuran</th>
                                                <th className="py-3 px-4 hidden md:table-cell">
                                                    {section === 'trash' ? 'Waktu Terhapus' : 'Waktu Diperbarui'}
                                                </th>
                                                <th className="py-3 px-4 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                            {files.map((file) => {
                                                const isSelected = selectedFileIds.includes(file.id);

                                                return (
                                                    <tr
                                                        key={file.id}
                                                        onClick={() => setInspectedItem({ type: 'file', item: file })}
                                                        onDoubleClick={() => setPreviewFile(file)}
                                                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${isSelected ? 'bg-[#FEF9EC]/50 dark:bg-amber-950/20' : ''
                                                            }`}
                                                    >
                                                        <td className="py-3 px-4" onClick={(e) => toggleSelectFile(file.id, e)}>
                                                            {isSelected ? (
                                                                <CheckSquare className="w-4 h-4 text-[#CC6F00]" />
                                                            ) : (
                                                                <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <FileIcon extension={file.extension} mimeType={file.mime_type} className="w-5 h-5 shrink-0" />
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                                                                            {file.name}
                                                                        </span>
                                                                        {file.is_locked && (
                                                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 shrink-0" title="Berkas terkunci dari perubahan">
                                                                                <Lock className="w-2.5 h-2.5" />
                                                                                <span>Terkunci</span>
                                                                            </span>
                                                                        )}
                                                                        {file.has_active_share && (
                                                                            <span className="text-emerald-600 shrink-0" title="Dibagikan publik">
                                                                                <Share2 className="w-3 h-3" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {file.tags && file.tags.length > 0 && (
                                                                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                                                            {file.tags.map((tag) => (
                                                                                <span
                                                                                    key={tag}
                                                                                    className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium"
                                                                                >
                                                                                    #{tag}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-500 hidden sm:table-cell">
                                                            {file.formatted_size}
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-400 hidden md:table-cell">
                                                            {section === 'trash' && file.deleted_at ? file.deleted_at : file.updated_at}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                                {section !== 'trash' ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => setPreviewFile(file)}
                                                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                                                            title="Pratinjau"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <a
                                                                            href={route('files.download', file.id)}
                                                                            onClick={() => trackDownload(file.name, file.formatted_size, route('files.download', file.id))}
                                                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                                                            title="Unduh"
                                                                        >
                                                                            <Download className="w-3.5 h-3.5" />
                                                                        </a>
                                                                        <button
                                                                            onClick={() => setShareFile(file)}
                                                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                                                            title="Bagikan"
                                                                        >
                                                                            <Share2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setTagFile(file)}
                                                                            className="p-1 rounded-lg text-slate-400 hover:text-[#CC6F00] hover:bg-amber-50"
                                                                            title="Kelola Label / Tag"
                                                                        >
                                                                            <Tag className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => router.post(route('files.lock', file.id))}
                                                                            className={`p-1 rounded-lg ${file.is_locked ? 'text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                                                                            title={file.is_locked ? 'Buka Kunci Berkas' : 'Kunci Berkas'}
                                                                        >
                                                                            {file.is_locked ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setHistoryFile(file)}
                                                                            className="p-1 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-slate-100"
                                                                            title="Riwayat Versi"
                                                                        >
                                                                            <History className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDuplicateFile(file)}
                                                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                                                            title="Duplikasi"
                                                                        >
                                                                            <Copy className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            disabled={file.is_locked}
                                                                            onClick={() => handleTrashFile(file)}
                                                                            className="p-1 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                            title={file.is_locked ? 'Berkas sedang terkunci' : 'Pindahkan ke Sampah'}
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => setPreviewFile(file)}
                                                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                                                            title="Pratinjau Berkas"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => router.post(route('files.restore', file.id))}
                                                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                                                            title="Pulihkan"
                                                                        >
                                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handlePermanentDeleteFile(file.id, file.name)}
                                                                            className="p-1 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                            title="Hapus Permanen"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                {/* INSPECTOR DETAILS SIDEBAR (Responsive Slide-over Drawer on Mobile / Panel on Desktop) */}
                {inspectedItem && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-2xs md:hidden animate-fade-in"
                            onClick={() => setInspectedItem(null)}
                        />
                        <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-80 md:static md:z-auto md:w-72 p-5 border-l border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/95 shrink-0 space-y-5 shadow-2xl md:shadow-none overflow-y-auto animate-fade-in">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                    <Info className="w-3.5 h-3.5 text-[#CC6F00]" />
                                    <span>Detail {inspectedItem.type === 'folder' ? 'Folder' : 'Berkas'}</span>
                                </span>
                                <button
                                    onClick={() => setInspectedItem(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Large Preview Thumbnail */}
                            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                                {inspectedItem.type === 'folder' ? (
                                    <CustomFolderIcon
                                        color={(inspectedItem.item as FolderItem).color || '#F2A900'}
                                        className="w-16 h-16 mb-2"
                                    />
                                ) : (
                                    <FileIcon
                                        extension={(inspectedItem.item as FileItem).extension}
                                        mimeType={(inspectedItem.item as FileItem).mime_type}
                                        className="w-16 h-16 mb-2"
                                    />
                                )}
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-full break-all">
                                    {inspectedItem.item.name}
                                </h4>
                                {inspectedItem.type === 'file' && (
                                    <span className="text-[11px] text-slate-400 mt-0.5">
                                        {(inspectedItem.item as FileItem).formatted_size}
                                    </span>
                                )}
                            </div>

                            {/* Metadata Details List */}
                            <div className="space-y-2.5 text-xs">
                                <div>
                                    <span className="text-[10px] uppercase font-semibold text-slate-400">Tipe</span>
                                    <p className="font-medium text-slate-700 dark:text-slate-200">
                                        {inspectedItem.type === 'folder'
                                            ? 'Direktori Folder'
                                            : (inspectedItem.item as FileItem).mime_type || 'Berkas Dokumen'}
                                    </p>
                                </div>

                                {inspectedItem.type === 'file' && (
                                    <div>
                                        <span className="text-[10px] uppercase font-semibold text-slate-400">Ekstensi</span>
                                        <p className="font-mono text-slate-700 dark:text-slate-200 uppercase">
                                            {(inspectedItem.item as FileItem).extension || '—'}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                                        {section === 'trash' ? 'Waktu Terhapus' : 'Terakhir Diperbarui'}
                                    </span>
                                    <p className="text-slate-700 dark:text-slate-200">
                                        {section === 'trash' && inspectedItem.item.deleted_at
                                            ? inspectedItem.item.deleted_at
                                            : inspectedItem.item.updated_at || '—'}
                                    </p>
                                </div>

                                {inspectedItem.type === 'file' && (
                                    <div>
                                        <span className="text-[10px] uppercase font-semibold text-slate-400">Status Berbagi</span>
                                        <p className="flex items-center gap-1.5 mt-0.5">
                                            {(inspectedItem.item as FileItem).has_active_share ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                    Dibagikan Publik
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 text-[11px]">Privat</span>
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Quick Action Buttons in Inspector */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                {inspectedItem.type === 'file' ? (
                                    <>
                                        <button
                                            onClick={() => setPreviewFile(inspectedItem.item as FileItem)}
                                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-[#CC6F00]" />
                                            <span>Pratinjau Berkas</span>
                                        </button>

                                        <a
                                            href={route('files.download', (inspectedItem.item as FileItem).id)}
                                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white transition-all shadow-xs"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            <span>Unduh Berkas</span>
                                        </a>

                                        {section !== 'trash' ? (
                                            <>
                                                <button
                                                    onClick={() => setShareFile(inspectedItem.item as FileItem)}
                                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    <Share2 className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                    <span>Kelola Tautan Berbagi</span>
                                                </button>

                                                <button
                                                    onClick={() => setHistoryFile(inspectedItem.item as FileItem)}
                                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    <History className="w-3.5 h-3.5 text-violet-600" />
                                                    <span>Riwayat Versi Berkas</span>
                                                </button>

                                                <button
                                                    onClick={() => handleDuplicateFile(inspectedItem.item as FileItem)}
                                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    <Copy className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                    <span>Buat Salinan (Duplikasi)</span>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => router.post(route('files.restore', (inspectedItem.item as FileItem).id))}
                                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>Pulihkan Berkas Ini</span>
                                                </button>

                                                <button
                                                    onClick={() => handlePermanentDeleteFile((inspectedItem.item as FileItem).id, inspectedItem.item.name)}
                                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span>Hapus Permanen</span>
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <a
                                        href={route('folders.download', inspectedItem.item.id)}
                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white transition-all shadow-xs"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Unduh Folder (.ZIP)</span>
                                    </a>
                                )}
                            </div>
                        </aside>
                    </>
                )}
            </div>

            {/* STICKY FLOATING BATCH ACTIONS BAR */}
            {totalSelected > 0 && (
                <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 sm:gap-3 max-w-[calc(100vw-1.5rem)] overflow-x-auto no-scrollbar animate-fade-in font-poppins text-xs">
                    <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
                        <CheckSquare className="w-4 h-4 text-[#F2A900]" />
                        <span className="font-bold">{totalSelected} item dipilih</span>
                    </div>

                    <button
                        onClick={handleBatchDownload}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold transition-colors"
                        title="Unduh semua item terpilih dalam bentuk file ZIP"
                    >
                        <Download className="w-3.5 h-3.5 text-[#F2A900]" />
                        <span>Unduh (.ZIP)</span>
                    </button>

                    {section !== 'trash' && (
                        <>
                            <button
                                onClick={() =>
                                    setMoveTarget({
                                        type: 'batch',
                                        fileIds: selectedFileIds,
                                        folderIds: selectedFolderIds,
                                    })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold transition-colors"
                            >
                                <FolderInput className="w-3.5 h-3.5 text-[#F2A900]" />
                                <span>Pindahkan</span>
                            </button>

                            <button
                                onClick={() => handleBatchStar(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold transition-colors"
                            >
                                <Star className="w-3.5 h-3.5 text-[#F2A900] fill-[#F2A900]" />
                                <span>Bintang</span>
                            </button>

                            <button
                                onClick={handleBatchTrash}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-200 font-semibold border border-red-800/60 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>Sampah</span>
                            </button>
                        </>
                    )}

                    {section === 'trash' && (
                        <>
                            <button
                                onClick={handleBatchRestore}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Pulihkan</span>
                            </button>

                            <button
                                onClick={handleBatchForceDelete}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus Permanen</span>
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => {
                            setSelectedFileIds([]);
                            setSelectedFolderIds([]);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors ml-1"
                        title="Batal pilihan (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* MODALS */}
            <NewFolderModal
                isOpen={isNewFolderOpen}
                onClose={() => setIsNewFolderOpen(false)}
                parentId={currentFolder?.id ?? null}
            />

            <RenameModal
                isOpen={!!renameItem}
                onClose={() => setRenameItem(null)}
                item={renameItem}
            />

            <MoveModal
                isOpen={!!moveTarget}
                onClose={() => setMoveTarget(null)}
                targetItem={moveTarget}
                availableFolders={availableFolders}
            />

            <ShareModal
                isOpen={!!shareFile}
                onClose={() => setShareFile(null)}
                file={shareFile}
            />

            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile}
            />

            <VersionHistoryModal
                isOpen={!!historyFile}
                onClose={() => setHistoryFile(null)}
                file={historyFile}
            />

            <ActivityLogModal
                isOpen={isActivityLogOpen}
                onClose={() => setIsActivityLogOpen(false)}
            />

            {deleteModal && (
                <DeleteConfirmModal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal(null)}
                    title={deleteModal.title}
                    message={deleteModal.message}
                    isPermanent={deleteModal.isPermanent}
                    onConfirm={deleteModal.onConfirm}
                />
            )}

            <FolderColorModal
                isOpen={!!colorFolder}
                onClose={() => setColorFolder(null)}
                folder={colorFolder}
            />

            <FileTagModal
                isOpen={!!tagFile}
                onClose={() => setTagFile(null)}
                file={tagFile}
            />

            <AdvancedSearchModal
                isOpen={isAdvancedSearchOpen}
                onClose={() => setIsAdvancedSearchOpen(false)}
                currentFilters={{
                    search,
                    search_type: advancedSearch?.search_type,
                    size_range: advancedSearch?.size_range,
                    date_range: advancedSearch?.date_range,
                    tag: advancedSearch?.tag,
                }}
                allTags={allTags || []}
                onApply={handleApplyAdvancedSearch}
            />

            <StorageAnalyticsModal
                isOpen={isStorageAnalyticsOpen}
                onClose={() => setIsStorageAnalyticsOpen(false)}
                storage={storage}
            />

            <DuplicateDetectionModal
                isOpen={isDuplicatesOpen}
                onClose={() => setIsDuplicatesOpen(false)}
            />

            <DownloadManagerModal
                isOpen={isDownloadManagerOpen}
                onClose={() => setIsDownloadManagerOpen(false)}
                downloads={downloads}
                onClear={handleClearDownloads}
            />

            <FileRequestModal
                isOpen={isFileRequestOpen}
                onClose={() => setIsFileRequestOpen(false)}
                availableFolders={availableFolders}
            />

            <WhatsAppIntegrationModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
                userToken={auth.user?.webhook_token}
            />

            {/* FLOATING UPLOAD DOCK (Stays visible on scroll and across navigation) */}
            {uploading && (
                <div
                    aria-live="polite"
                    className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-[#F2A900] shadow-2xl animate-fade-in font-poppins"
                >
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <Upload className="w-4 h-4 text-[#CC6F00] animate-bounce shrink-0" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {uploadFileDetails?.name || 'Mengunggah Berkas...'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-[#CC6F00] font-mono">
                                {uploadProgress}%
                            </span>
                            <button
                                type="button"
                                onClick={handleCancelUpload}
                                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                title="Batalkan unggahan"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-2">
                        <div
                            className="h-full bg-gradient-to-r from-[#F2A900] to-[#CC6F00] transition-all duration-200 rounded-full"
                            style={{ width: `${Math.max(uploadProgress, 2)}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{uploadFileDetails?.size || ''}</span>
                        <button
                            type="button"
                            onClick={handleCancelUpload}
                            className="text-red-600 dark:text-red-400 font-semibold hover:underline"
                        >
                            Batalkan Unggahan
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
