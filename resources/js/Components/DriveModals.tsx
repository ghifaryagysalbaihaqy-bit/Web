import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import {
    X,
    FolderPlus,
    Edit2,
    FolderInput,
    Share2,
    Download,
    Copy,
    Check,
    Lock,
    Calendar,
    AlertTriangle,
    Trash2,
    Link as LinkIcon,
    Code,
    FileText,
    ExternalLink,
    RotateCcw,
    Upload,
    History,
    Eye,
    Shield,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    FileUp,
    Activity,
    Filter,
    Sparkles
} from 'lucide-react';
import { FileItem, FolderItem, ShareLinkItem, FileVersionItem, ActivityLogItem } from '@/types';
import { FileIcon } from './FileIcon';

const PRESET_COLORS = [
    '#F2A900', // Gold
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#64748B', // Slate
];

// --- 1. NEW FOLDER MODAL ---
interface NewFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentId: number | null;
}

export function NewFolderModal({ isOpen, onClose, parentId }: NewFolderModalProps) {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#F2A900');
    const [processing, setProcessing] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setProcessing(true);
        router.post(
            route('folders.store'),
            { name: name.trim(), parent_id: parentId, color },
            {
                onSuccess: () => {
                    setName('');
                    onClose();
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-fade-in font-poppins">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 font-bold text-base">
                        <FolderPlus className="w-5 h-5 text-[#CC6F00]" />
                        <span>Buat Folder Baru</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Nama Folder
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Dokumen Keuangan, Aset Desain..."
                            autoFocus
                            required
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#F2A900]/20 focus:border-[#F2A900] focus:outline-none text-xs"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Pilih Warna Tag Folder
                        </label>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105 opacity-80'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !name.trim()}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] disabled:opacity-50 transition-all shadow-xs"
                        >
                            {processing ? 'Membuat...' : 'Buat Folder'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- 2. RENAME MODAL ---
interface RenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: { id: number; name: string; type: 'folder' | 'file' } | null;
}

export function RenameModal({ isOpen, onClose, item }: RenameModalProps) {
    const [name, setName] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (item) setName(item.name);
    }, [item]);

    if (!isOpen || !item) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setProcessing(true);
        const url = item.type === 'folder' ? route('folders.update', item.id) : route('files.rename', item.id);

        router.patch(
            url,
            { name: name.trim() },
            {
                onSuccess: () => onClose(),
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-fade-in font-poppins">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-base">
                        <Edit2 className="w-4 h-4 text-[#CC6F00]" />
                        <span>Ganti Nama {item.type === 'folder' ? 'Folder' : 'Berkas'}</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            required
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#F2A900]/20 focus:border-[#F2A900] focus:outline-none text-xs"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !name.trim()}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] disabled:opacity-50 transition-all shadow-xs"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Nama'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- 3. MOVE MODAL (Single Item & Batch) ---
interface MoveModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetItem: {
        type: 'file' | 'folder' | 'batch';
        id?: number;
        name?: string;
        currentFolderId?: number | null;
        fileIds?: number[];
        folderIds?: number[];
    } | null;
    availableFolders: { id: number; name: string }[];
}

export function MoveModal({ isOpen, onClose, targetItem, availableFolders }: MoveModalProps) {
    const [selectedFolderId, setSelectedFolderId] = useState<string>('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (targetItem?.currentFolderId) {
            setSelectedFolderId(String(targetItem.currentFolderId));
        } else {
            setSelectedFolderId('');
        }
    }, [targetItem]);

    if (!isOpen || !targetItem) return null;

    // Filter out target folder from options if moving a folder
    const validFolders = availableFolders.filter(
        (f) => targetItem.type !== 'folder' || f.id !== targetItem.id
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const targetId = selectedFolderId ? parseInt(selectedFolderId) : null;

        if (targetItem.type === 'file' && targetItem.id) {
            router.patch(
                route('files.move', targetItem.id),
                { folder_id: targetId },
                {
                    onSuccess: () => onClose(),
                    onFinish: () => setProcessing(false),
                }
            );
        } else if (targetItem.type === 'folder' && targetItem.id) {
            router.patch(
                route('folders.move', targetItem.id),
                { parent_id: targetId },
                {
                    onSuccess: () => onClose(),
                    onFinish: () => setProcessing(false),
                }
            );
        } else if (targetItem.type === 'batch') {
            router.post(
                route('drive.batch'),
                {
                    action: 'move',
                    file_ids: targetItem.fileIds || [],
                    folder_ids: targetItem.folderIds || [],
                    target_folder_id: targetId,
                },
                {
                    onSuccess: () => onClose(),
                    onFinish: () => setProcessing(false),
                }
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-fade-in font-poppins">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-base">
                        <FolderInput className="w-4 h-4 text-[#CC6F00]" />
                        <span>Pindahkan {targetItem.type === 'batch' ? 'Item Terpilih' : targetItem.type === 'folder' ? 'Folder' : 'Berkas'}</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        {targetItem.type === 'batch'
                            ? `Pindahkan ${((targetItem.fileIds?.length || 0) + (targetItem.folderIds?.length || 0))} item terpilih ke:`
                            : `Pindahkan "${targetItem.name}" ke:`}
                    </p>

                    <div>
                        <select
                            value={selectedFolderId}
                            onChange={(e) => setSelectedFolderId(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#F2A900]/20 focus:border-[#F2A900] focus:outline-none text-xs"
                        >
                            <option value="">📂 Direktori Utama (Root / My Drive)</option>
                            {validFolders.map((f) => (
                                <option key={f.id} value={f.id}>
                                    📁 {f.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] disabled:opacity-50 transition-all shadow-xs"
                        >
                            {processing ? 'Memindahkan...' : 'Pindahkan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- 4. SHARE MODAL (Enhanced with Active Link History & Revoke) ---
interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: FileItem | null;
}

export function ShareModal({ isOpen, onClose, file }: ShareModalProps) {
    const [password, setPassword] = useState('');
    const [permission, setPermission] = useState<'viewer' | 'editor'>('viewer');
    const [expiresInDays, setExpiresInDays] = useState<string>('7');
    const [existingLinks, setExistingLinks] = useState<ShareLinkItem[]>([]);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [loadingLinks, setLoadingLinks] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (isOpen && file) {
            setPassword('');
            setPermission('viewer');
            setLoadingLinks(true);
            axios
                .get(route('share.list', file.id))
                .then((res) => {
                    setExistingLinks(res.data.links || []);
                })
                .catch((err) => console.error(err))
                .finally(() => setLoadingLinks(false));
        }
    }, [isOpen, file]);

    if (!isOpen || !file) return null;

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const res = await axios.post(route('share.create', file.id), {
                password: password.trim() || null,
                permission,
                expires_in_days: expiresInDays ? parseInt(expiresInDays) : null,
            });

            // Prepend newly created link to list
            setExistingLinks((prev) => [
                {
                    id: res.data.id,
                    token: res.data.token,
                    share_url: res.data.share_url,
                    permission: res.data.permission || permission,
                    has_password: res.data.has_password,
                    is_expired: false,
                    expires_at: res.data.expires_at,
                    downloads_count: 0,
                    created_at: res.data.created_at,
                },
                ...prev,
            ]);

            setPassword('');
            // Auto copy URL
            handleCopy(res.data.share_url, res.data.token);
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    const handleCopy = (url: string, token: string) => {
        navigator.clipboard.writeText(url);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2500);
    };

    const handleRevoke = (linkId: number) => {
        if (!confirm('Apakah Anda yakin ingin menonaktifkan tautan berbagi ini?')) return;

        router.delete(route('share.destroy', linkId), {
            preserveScroll: true,
            onSuccess: () => {
                setExistingLinks((prev) => prev.filter((l) => l.id !== linkId));
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-fade-in font-poppins">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-base">
                        <Share2 className="w-4 h-4 text-[#CC6F00]" />
                        <span>Bagikan Berkas</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="mt-4 space-y-4 overflow-y-auto pr-1">
                    {/* File Header */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <FileIcon extension={file.extension} mimeType={file.mime_type} className="w-8 h-8 shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{file.name}</p>
                            <p className="text-[11px] text-slate-500">{file.formatted_size}</p>
                        </div>
                    </div>

                    {/* Create New Link Form */}
                    <form onSubmit={handleGenerate} className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Buat Tautan Berbagi Baru</p>

                        {/* Permission Selection: Viewer vs Editor */}
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                <Shield className="w-3 h-3 text-slate-400" />
                                <span>Izin Akses Berbagi</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPermission('viewer')}
                                    className={`p-2.5 rounded-xl text-left border transition-all ${
                                        permission === 'viewer'
                                            ? 'border-[#F2A900] bg-[#FEF9EC] dark:bg-amber-950/40 text-slate-900 dark:text-amber-100 ring-1 ring-[#F2A900]'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 font-bold text-xs">
                                        <Eye className="w-3.5 h-3.5 text-[#CC6F00]" />
                                        <span>Viewer</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Hanya melihat & mengunduh</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPermission('editor')}
                                    className={`p-2.5 rounded-xl text-left border transition-all ${
                                        permission === 'editor'
                                            ? 'border-[#F2A900] bg-[#FEF9EC] dark:bg-amber-950/40 text-slate-900 dark:text-amber-100 ring-1 ring-[#F2A900]'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 font-bold text-xs">
                                        <Edit2 className="w-3.5 h-3.5 text-[#CC6F00]" />
                                        <span>Editor</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Dapat unggah versi baru</p>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    <Lock className="w-3 h-3 text-slate-400" />
                                    <span>Password (Opsional)</span>
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Kosongkan jika bebas"
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#F2A900] focus:border-[#F2A900] focus:outline-none text-xs"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <span>Masa Berlaku</span>
                                </label>
                                <select
                                    value={expiresInDays}
                                    onChange={(e) => setExpiresInDays(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#F2A900] focus:border-[#F2A900] focus:outline-none text-xs"
                                >
                                    <option value="1">1 Hari</option>
                                    <option value="7">7 Hari (1 Minggu)</option>
                                    <option value="30">30 Hari (1 Bulan)</option>
                                    <option value="">Selamanya</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={creating}
                            className="w-full py-2 rounded-xl font-bold text-xs text-slate-900 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white transition-all shadow-xs disabled:opacity-50"
                        >
                            {creating ? 'Membuat Tautan...' : `Generate Tautan Publik (${permission === 'editor' ? 'Editor' : 'Viewer'})`}
                        </button>
                    </form>

                    {/* Existing Links Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Tautan Berbagi Aktif ({existingLinks.length})
                            </span>
                        </div>

                        {loadingLinks ? (
                            <p className="text-xs text-slate-400 py-3 text-center">Memuat daftar tautan...</p>
                        ) : existingLinks.length === 0 ? (
                            <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                Belum ada tautan berbagi aktif untuk berkas ini.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {existingLinks.map((link) => {
                                    const isCopied = copiedToken === link.token;
                                    const isEditor = link.permission === 'editor';

                                    return (
                                        <div
                                            key={link.id}
                                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-between gap-3 text-xs"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
                                                    <LinkIcon className="w-3 h-3 text-[#CC6F00] shrink-0" />
                                                    <span className="truncate">{link.share_url}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 flex-wrap">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                        isEditor
                                                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                    }`}>
                                                        {isEditor ? 'Editor' : 'Viewer'}
                                                    </span>
                                                    <span>Kadaluwarsa: {link.expires_at}</span>
                                                    {link.has_password && (
                                                        <span className="text-amber-600 flex items-center gap-0.5 font-semibold">
                                                            <Lock className="w-2.5 h-2.5" /> Berpassword
                                                        </span>
                                                    )}
                                                    <span>Diunduh: {link.downloads_count}x</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => handleCopy(link.share_url, link.token)}
                                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                                                        isCopied
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                                                    }`}
                                                    title="Salin Tautan"
                                                >
                                                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                    <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
                                                </button>

                                                <button
                                                    onClick={() => handleRevoke(link.id)}
                                                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                    title="Hapus Tautan"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- 5. FILE PREVIEW MODAL (Enhanced with Text/Code Viewer) ---
interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: FileItem | null;
}

export function FilePreviewModal({ isOpen, onClose, file }: FilePreviewModalProps) {
    const [textContent, setTextContent] = useState<string | null>(null);
    const [loadingText, setLoadingText] = useState(false);
    const [textCopied, setTextCopied] = useState(false);

    useEffect(() => {
        if (isOpen && file && file.is_text) {
            setLoadingText(true);
            axios
                .get(route('files.content', file.id))
                .then((res) => {
                    setTextContent(res.data.content);
                })
                .catch((err) => {
                    console.error(err);
                    setTextContent('Gagal memuat isi berkas teks.');
                })
                .finally(() => setLoadingText(false));
        } else {
            setTextContent(null);
        }
    }, [isOpen, file]);

    if (!isOpen || !file) return null;

    const previewUrl = route('files.preview', file.id);
    const downloadUrl = route('files.download', file.id);

    const handleCopyText = () => {
        if (!textContent) return;
        navigator.clipboard.writeText(textContent);
        setTextCopied(true);
        setTimeout(() => setTextCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-2xs animate-fade-in font-poppins">
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3 min-w-0">
                        <FileIcon extension={file.extension} mimeType={file.mime_type} className="w-6 h-6 shrink-0" />
                        <div className="min-w-0">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate text-sm">{file.name}</h3>
                            <p className="text-[11px] text-slate-400">{file.formatted_size} • Diunggah {file.created_at}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {file.is_text && textContent && (
                            <button
                                onClick={handleCopyText}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                {textCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{textCopied ? 'Tersalin' : 'Salin Teks'}</span>
                            </button>
                        )}

                        <a
                            href={downloadUrl}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white transition-all shadow-xs"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh</span>
                        </a>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Body Viewer */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/50 dark:bg-slate-950 min-h-[400px]">
                    {file.is_image ? (
                        <img
                            src={previewUrl}
                            alt={file.name}
                            className="max-h-[72vh] max-w-full rounded-xl object-contain shadow-sm"
                        />
                    ) : file.is_pdf ? (
                        <iframe
                            src={previewUrl}
                            title={file.name}
                            className="w-full h-[72vh] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
                        />
                    ) : file.is_video ? (
                        <video
                            controls
                            src={previewUrl}
                            className="max-h-[70vh] max-w-full rounded-xl shadow-sm"
                        />
                    ) : file.is_audio ? (
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-md w-full">
                            <FileIcon extension={file.extension} mimeType={file.mime_type} className="w-14 h-14 mx-auto text-[#CC6F00]" />
                            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{file.name}</p>
                            <audio controls src={previewUrl} className="w-full" />
                        </div>
                    ) : file.is_text ? (
                        <div className="w-full h-[72vh] flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 text-slate-300 text-xs border-b border-slate-700">
                                <div className="flex items-center gap-2">
                                    <Code className="w-3.5 h-3.5 text-[#F2A900]" />
                                    <span>Pratinjau Kode / Dokumen Teks</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">UTF-8</span>
                            </div>

                            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre selection:bg-[#F2A900] selection:text-slate-900">
                                {loadingText ? (
                                    <div className="h-full flex items-center justify-center text-slate-400">
                                        Memuat konten teks...
                                    </div>
                                ) : (
                                    textContent ?? 'Tidak ada konten untuk ditampilkan.'
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-md">
                            <FileIcon extension={file.extension} mimeType={file.mime_type} className="w-14 h-14 mx-auto mb-3" />
                            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1">{file.name}</h4>
                            <p className="text-xs text-slate-500 mb-5">
                                Pratinjau langsung tidak tersedia untuk format berkas ini. Anda dapat mengunduhnya untuk membuka di perangkat Anda.
                            </p>
                            <a
                                href={downloadUrl}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-xs text-slate-900 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white transition-all shadow-xs"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Unduh Berkas ({file.formatted_size})</span>
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- 6. DELETE CONFIRM MODAL ---
interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    onConfirm: () => void;
    isPermanent?: boolean;
}

export function DeleteConfirmModal({ isOpen, onClose, title, message, onConfirm, isPermanent = false }: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-fade-in font-poppins">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400 font-bold text-base pb-2">
                    <div className={`p-2.5 rounded-xl ${isPermanent ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 ring-2 ring-red-500/30' : 'bg-amber-100 dark:bg-amber-950/40 text-[#CC6F00]'}`}>
                        {isPermanent ? <AlertTriangle className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                    </div>
                    <span>{title}</span>
                </div>

                <div className="mt-3 space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {message}
                    </p>

                    {isPermanent ? (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-[11px] text-red-800 dark:text-red-300 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <span>
                                <strong>Perhatian:</strong> Tindakan ini menghapus berkas fisik langsung dari penyimpanan server. Data tidak dapat dipulihkan kembali dengan cara apa pun.
                            </span>
                        </div>
                    ) : (
                        <p className="text-[11px] text-slate-400">
                            Item yang dipindahkan ke sampah masih dapat dipulihkan atau dikembalikan kapan saja dari menu Sampah.
                        </p>
                    )}
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors ${
                            isPermanent
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500/50'
                                : 'bg-[#CC6F00] hover:bg-[#9A5B00] focus:ring-2 focus:ring-[#CC6F00]/50'
                        }`}
                    >
                        {isPermanent ? 'Ya, Hapus Permanen' : 'Ya, Pindahkan ke Sampah'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- 8. VERSION HISTORY MODAL (Feature: Version History dengan Pemulihan) ---
interface VersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: FileItem | null;
}

export function VersionHistoryModal({ isOpen, onClose, file }: VersionHistoryModalProps) {
    const [versions, setVersions] = useState<FileVersionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [restoringId, setRestoringId] = useState<number | null>(null);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [newFile, setNewFile] = useState<File | null>(null);
    const [notes, setNotes] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const loadVersions = () => {
        if (!file) return;
        setLoading(true);
        setErrorMsg(null);
        axios
            .get(route('files.versions.index', file.id))
            .then((res) => {
                setVersions(res.data.versions || []);
            })
            .catch((err) => {
                console.error(err);
                setErrorMsg('Gagal memuat riwayat versi berkas.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (isOpen && file) {
            setShowUploadForm(false);
            setNewFile(null);
            setNotes('');
            loadVersions();
        }
    }, [isOpen, file]);

    if (!isOpen || !file) return null;

    const handleUploadVersion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFile) return;

        setUploading(true);
        setErrorMsg(null);

        const formData = new FormData();
        formData.append('file', newFile);
        if (notes.trim()) {
            formData.append('notes', notes.trim());
        }

        try {
            await axios.post(route('files.versions.store', file.id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setNewFile(null);
            setNotes('');
            setShowUploadForm(false);
            loadVersions();
            router.reload();
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Gagal mengunggah versi baru.');
        } finally {
            setUploading(false);
        }
    };

    const handleRestore = async (version: FileVersionItem) => {
        if (!confirm(`Pulihkan ke Versi ${version.version_number}? Berkas saat ini akan diperbarui dan versi sebelumnya tetap tersimpan.`)) {
            return;
        }

        setRestoringId(version.id);
        setErrorMsg(null);

        try {
            await axios.post(route('files.versions.restore', [file.id, version.id]));
            loadVersions();
            router.reload();
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Gagal memulihkan versi berkas.');
        } finally {
            setRestoringId(null);
        }
    };

    const handleDownloadVersion = (version: FileVersionItem) => {
        window.location.href = route('files.versions.download', [file.id, version.id]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-fade-in font-poppins">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-base">
                        <History className="w-4 h-4 text-[#CC6F00]" />
                        <span>Riwayat Versi Berkas</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="mt-4 space-y-4 overflow-y-auto pr-1">
                    {/* File summary */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3 min-w-0">
                            <FileIcon extension={file.extension} mimeType={file.mime_type} className="w-8 h-8 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{file.name}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Ukuran saat ini: {file.formatted_size}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowUploadForm(!showUploadForm)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F2A900] hover:bg-[#CC6F00] text-slate-950 hover:text-white transition-all flex items-center gap-1.5 shrink-0 shadow-2xs"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{showUploadForm ? 'Batal Unggah' : 'Unggah Versi Baru'}</span>
                        </button>
                    </div>

                    {errorMsg && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Upload new version form drawer */}
                    {showUploadForm && (
                        <form onSubmit={handleUploadVersion} className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-[#FEF9EC] dark:bg-amber-950/20 space-y-3">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <FileUp className="w-4 h-4 text-[#CC6F00]" />
                                <span>Unggah Versi Baru Berkas Ini</span>
                            </p>

                            <div>
                                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    Pilih File Pengganti/Revisi
                                </label>
                                <input
                                    type="file"
                                    required
                                    onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F2A900] file:text-slate-950 hover:file:bg-[#CC6F00] hover:file:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    Catatan Revisi (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Contoh: Perbaikan bab 3, revisi desain..."
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-[#F2A900] focus:border-[#F2A900] focus:outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || !newFile}
                                className="w-full py-2 rounded-xl text-xs font-bold bg-[#CC6F00] hover:bg-[#9A5B00] text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {uploading ? 'Mengunggah Versi...' : 'Simpan Sebagai Versi Baru'}
                            </button>
                        </form>
                    )}

                    {/* Versions list */}
                    <div className="space-y-2.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Daftar Versi ({versions.length})
                        </p>

                        {loading ? (
                            <p className="text-xs text-slate-400 py-6 text-center">Memuat riwayat versi...</p>
                        ) : versions.length === 0 ? (
                            <p className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                Belum ada riwayat versi untuk berkas ini.
                            </p>
                        ) : (
                            versions.map((v) => (
                                <div
                                    key={v.id}
                                    className={`p-3.5 rounded-xl border transition-all ${
                                        v.is_current
                                            ? 'border-[#F2A900]/80 bg-[#FEF9EC]/50 dark:bg-amber-950/20 ring-1 ring-[#F2A900]/30'
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-900 text-white dark:bg-slate-700">
                                                    v{v.version_number}
                                                </span>

                                                {v.is_current && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                        <span>Versi Aktif</span>
                                                    </span>
                                                )}

                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {v.formatted_size}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                                                {v.notes}
                                            </p>

                                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                                                <span>{v.created_at}</span>
                                                <span>•</span>
                                                <span>Oleh {v.creator_name}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadVersion(v)}
                                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                title="Unduh Versi Ini"
                                            >
                                                <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                            </button>

                                            {!v.is_current && (
                                                <button
                                                    type="button"
                                                    disabled={restoringId === v.id}
                                                    onClick={() => handleRestore(v)}
                                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#CC6F00] bg-amber-50 hover:bg-[#F2A900] hover:text-slate-950 border border-amber-200 transition-all flex items-center gap-1"
                                                    title="Pulihkan ke Versi Ini"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    <span>{restoringId === v.id ? 'Memulihkan...' : 'Pulihkan'}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- 9. ACTIVITY LOG MODAL (Feature: Activity Log untuk Memantau Aktivitas Pengguna) ---
interface ActivityLogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ActivityLogModal({ isOpen, onClose }: ActivityLogModalProps) {
    const [logs, setLogs] = useState<ActivityLogItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [filter, setFilter] = useState<string>('all');
    const [search, setSearch] = useState<string>('');

    const loadLogs = () => {
        setLoading(true);
        axios
            .get(route('activity-logs.index'))
            .then((res) => {
                setLogs(res.data.logs || []);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setFilter('all');
            loadLogs();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClearLogs = async () => {
        if (!confirm('Apakah Anda yakin ingin membersihkan semua riwayat log aktivitas?')) return;
        setClearing(true);
        try {
            await axios.delete(route('activity-logs.clear'));
            setLogs([]);
        } catch (err) {
            console.error(err);
        } finally {
            setClearing(false);
        }
    };

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            !search.trim() ||
            log.item_name.toLowerCase().includes(search.toLowerCase()) ||
            (log.description && log.description.toLowerCase().includes(search.toLowerCase()));

        if (!matchesSearch) return false;

        if (filter === 'all') return true;
        if (filter === 'upload') return log.action.includes('upload');
        if (filter === 'trash') return log.action.includes('trash');
        if (filter === 'restore') return log.action.includes('restore');
        if (filter === 'delete') return log.action.includes('delete');
        if (filter === 'share') return log.action.includes('share');
        if (filter === 'version') return log.action.includes('version');
        return true;
    });

    const getActionBadge = (action: string) => {
        if (action.includes('upload')) {
            return {
                icon: <Upload className="w-3.5 h-3.5 text-emerald-600" />,
                bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                label: 'Unggah',
            };
        }
        if (action.includes('trash')) {
            return {
                icon: <Trash2 className="w-3.5 h-3.5 text-amber-600" />,
                bg: 'bg-amber-50 text-amber-700 border-amber-200',
                label: 'Sampah',
            };
        }
        if (action.includes('restore')) {
            return {
                icon: <RotateCcw className="w-3.5 h-3.5 text-blue-600" />,
                bg: 'bg-blue-50 text-blue-700 border-blue-200',
                label: 'Dipulihkan',
            };
        }
        if (action.includes('delete')) {
            return {
                icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
                bg: 'bg-red-50 text-red-700 border-red-200',
                label: 'Dihapus Permanen',
            };
        }
        if (action.includes('share')) {
            return {
                icon: <Share2 className="w-3.5 h-3.5 text-purple-600" />,
                bg: 'bg-purple-50 text-purple-700 border-purple-200',
                label: 'Berbagi',
            };
        }
        if (action.includes('version')) {
            return {
                icon: <History className="w-3.5 h-3.5 text-violet-600" />,
                bg: 'bg-violet-50 text-violet-700 border-violet-200',
                label: 'Versi',
            };
        }
        if (action.includes('folder')) {
            return {
                icon: <FolderPlus className="w-3.5 h-3.5 text-[#CC6F00]" />,
                bg: 'bg-amber-50 text-[#CC6F00] border-amber-200',
                label: 'Folder',
            };
        }
        return {
            icon: <Activity className="w-3.5 h-3.5 text-slate-600" />,
            bg: 'bg-slate-50 text-slate-700 border-slate-200',
            label: action,
        };
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-fade-in font-poppins">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-base">
                        <Activity className="w-4 h-4 text-[#CC6F00]" />
                        <span>Log Aktivitas Pengguna</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {logs.length > 0 && (
                            <button
                                type="button"
                                disabled={clearing}
                                onClick={handleClearLogs}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            >
                                {clearing ? 'Membersihkan...' : 'Bersihkan Log'}
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="mt-4 space-y-2.5">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari berdasarkan nama berkas atau deskripsi aktivitas..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-[#F2A900] focus:border-[#F2A900] focus:outline-none"
                    />

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                        {[
                            { key: 'all', label: 'Semua' },
                            { key: 'upload', label: 'Unggah' },
                            { key: 'trash', label: 'Sampah' },
                            { key: 'restore', label: 'Pulihkan' },
                            { key: 'delete', label: 'Hapus' },
                            { key: 'share', label: 'Berbagi' },
                            { key: 'version', label: 'Versi' },
                        ].map((cat) => (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => setFilter(cat.key)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                                    filter === cat.key
                                        ? 'bg-[#F2A900] text-slate-950 font-bold shadow-2xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Log entries */}
                <div className="mt-3 overflow-y-auto pr-1 space-y-2 flex-1">
                    {loading ? (
                        <p className="text-xs text-slate-400 py-8 text-center">Memuat riwayat log aktivitas...</p>
                    ) : filteredLogs.length === 0 ? (
                        <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                            <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                            <p className="text-xs text-slate-500 font-medium">Belum ada catatan aktivitas yang cocok.</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => {
                            const badge = getActionBadge(log.action);

                            return (
                                <div
                                    key={log.id}
                                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 flex items-start gap-3 transition-colors"
                                >
                                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/60 shrink-0 mt-0.5">
                                        {badge.icon}
                                    </div>

                                    <div className="min-w-0 flex-1 text-xs">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                                                    {badge.label}
                                                </span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                    {log.item_name}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    ({log.item_type})
                                                </span>
                                            </div>

                                            <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                                                {log.time_ago}
                                            </span>
                                        </div>

                                        {log.description && (
                                            <p className="text-slate-600 dark:text-slate-300 mt-1 font-medium">
                                                {log.description}
                                            </p>
                                        )}

                                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                                            {log.created_at}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
