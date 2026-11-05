import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import {
    X,
    Palette,
    Tag,
    Plus,
    Check,
    Lock,
    Unlock,
    Files,
    Trash2,
    Search,
    SlidersHorizontal,
    HardDrive,
    BarChart3,
    PieChart,
    Download,
    RefreshCw,
    FileUp,
    Copy,
    ExternalLink,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    FileText,
    Folder as FolderIcon,
    MessageSquare,
    Smartphone,
    Send,
    Terminal,
    Link2
} from 'lucide-react';
import { FileItem, FolderItem, StorageInfo, FileRequestItem } from '@/types';

export const PRESET_FOLDER_COLORS = [
    '#F2A900', // Gold / Amber
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#64748B', // Slate
];

const PRESET_TAG_SUGGESTIONS = [
    'Penting',
    'Finansial',
    'Desain',
    'Dokumen Kerja',
    'Draft',
    'Pribadi',
    'Proyek',
    'Arsip',
];

// ==========================================
// 1. FOLDER COLOR MODAL
// ==========================================
interface FolderColorModalProps {
    isOpen: boolean;
    onClose: () => void;
    folder: { id: number; name: string; color: string | null } | null;
}

export function FolderColorModal({ isOpen, onClose, folder }: FolderColorModalProps) {
    const [selectedColor, setSelectedColor] = useState('#F2A900');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (folder) {
            setSelectedColor(folder.color || '#F2A900');
        }
    }, [folder]);

    if (!isOpen || !folder) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.patch(
            route('folders.color', folder.id),
            { color: selectedColor },
            {
                onSuccess: () => onClose(),
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-fade-in font-poppins">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-base">
                        <Palette className="w-5 h-5 text-[#CC6F00]" />
                        <span>Warna Folder</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <p className="text-xs text-slate-500 mb-3">
                            Ubah warna penanda untuk folder <strong className="text-slate-800 dark:text-slate-100">"{folder.name}"</strong>:
                        </p>

                        <div className="grid grid-cols-5 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            {PRESET_FOLDER_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setSelectedColor(c)}
                                    className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center transition-transform shadow-xs ${
                                        selectedColor === c
                                            ? 'ring-3 ring-offset-2 ring-slate-400 scale-110'
                                            : 'hover:scale-105 opacity-80'
                                    }`}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                >
                                    {selectedColor === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                                </button>
                            ))}
                        </div>
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
                            disabled={processing}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] disabled:opacity-50 transition-all shadow-xs"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Warna'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ==========================================
// 2. FILE TAG MODAL
// ==========================================
interface FileTagModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: FileItem | null;
}

export function FileTagModal({ isOpen, onClose, file }: FileTagModalProps) {
    const [tags, setTags] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (file) {
            setTags(file.tags || []);
            setInputValue('');
        }
    }, [file]);

    if (!isOpen || !file) return null;

    const handleAddTag = (newTag: string) => {
        const clean = newTag.trim();
        if (clean && !tags.includes(clean)) {
            setTags([...tags, clean]);
        }
        setInputValue('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.patch(
            route('files.tags', file.id),
            { tags },
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
                        <Tag className="w-5 h-5 text-[#CC6F00]" />
                        <span>Kelola Label / Tag Berkas</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <p className="text-xs text-slate-500 mb-2">
                            Label untuk berkas: <strong className="text-slate-800 dark:text-slate-100">{file.name}</strong>
                        </p>

                        {/* Current Tags */}
                        <div className="flex items-center gap-1.5 flex-wrap min-h-[42px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 mb-3">
                            {tags.length === 0 ? (
                                <span className="text-xs text-slate-400 italic">Belum ada label disematkan</span>
                            ) : (
                                tags.map((t) => (
                                    <span
                                        key={t}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FEF9EC] dark:bg-amber-950/50 text-[#9A5B00] dark:text-amber-200 border border-[#F2A900]/30"
                                    >
                                        <span>{t}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(t)}
                                            className="hover:text-red-500 transition-colors ml-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))
                            )}
                        </div>

                        {/* Add Input */}
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTag(inputValue);
                                    }
                                }}
                                placeholder="Ketik label baru lalu tekan Enter..."
                                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#F2A900]/20 focus:border-[#F2A900] focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => handleAddTag(inputValue)}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Preset suggestions */}
                    <div>
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
                            Rekomendasi Label:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {PRESET_TAG_SUGGESTIONS.map((sug) => (
                                <button
                                    key={sug}
                                    type="button"
                                    onClick={() => handleAddTag(sug)}
                                    disabled={tags.includes(sug)}
                                    className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                                        tags.includes(sug)
                                            ? 'opacity-40 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#F2A900]'
                                    }`}
                                >
                                    + {sug}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] disabled:opacity-50 transition-all shadow-xs"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Label'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ==========================================
// 3. ADVANCED SEARCH MODAL
// ==========================================
interface AdvancedSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilters: {
        search?: string;
        search_type?: string;
        size_range?: string;
        date_range?: string;
        tag?: string;
    };
    allTags: string[];
    onApply: (filters: {
        search?: string;
        search_type?: string;
        size_range?: string;
        date_range?: string;
        tag?: string;
    }) => void;
}

export function AdvancedSearchModal({
    isOpen,
    onClose,
    currentFilters,
    allTags,
    onApply,
}: AdvancedSearchModalProps) {
    const [name, setName] = useState(currentFilters.search || '');
    const [fileType, setFileType] = useState(currentFilters.search_type || 'all');
    const [sizeRange, setSizeRange] = useState(currentFilters.size_range || '');
    const [dateRange, setDateRange] = useState(currentFilters.date_range || '');
    const [selectedTag, setSelectedTag] = useState(currentFilters.tag || '');

    useEffect(() => {
        setName(currentFilters.search || '');
        setFileType(currentFilters.search_type || 'all');
        setSizeRange(currentFilters.size_range || '');
        setDateRange(currentFilters.date_range || '');
        setSelectedTag(currentFilters.tag || '');
    }, [currentFilters, isOpen]);

    if (!isOpen) return null;

    const handleReset = () => {
        setName('');
        setFileType('all');
        setSizeRange('');
        setDateRange('');
        setSelectedTag('');
        onApply({});
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onApply({
            search: name.trim() || undefined,
            search_type: fileType !== 'all' ? fileType : undefined,
            size_range: sizeRange || undefined,
            date_range: dateRange || undefined,
            tag: selectedTag || undefined,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-fade-in font-poppins">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 font-bold text-base">
                        <SlidersHorizontal className="w-5 h-5 text-[#CC6F00]" />
                        <span>Pencarian Tingkat Lanjut (Advanced Search)</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* 1. Name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Nama Berkas atau Kata Kunci
                        </label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Contoh: Laporan, Desain, Dokumen..."
                                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#F2A900]/20 focus:border-[#F2A900] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* 2. File Type */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Tipe Berkas
                        </label>
                        <select
                            value={fileType}
                            onChange={(e) => setFileType(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#F2A900]/20 focus:border-[#F2A900] focus:outline-none"
                        >
                            <option value="all">Semua Tipe Berkas</option>
                            <option value="document">Dokumen (PDF, Word, Excel, PowerPoint, Text)</option>
                            <option value="image">Gambar (JPG, PNG, GIF, SVG, WebP)</option>
                            <option value="media">Video & Audio (MP4, MKV, MP3, WAV)</option>
                            <option value="archive">Arsip (ZIP, RAR, 7Z, TAR)</option>
                            <option value="code">Kode & Skrip (JS, TS, PHP, Python, HTML)</option>
                        </select>
                    </div>

                    {/* 3. Size Range */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Ukuran Berkas
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { key: '', label: 'Semua Ukuran' },
                                { key: 'small', label: '< 1 MB (Kecil)' },
                                { key: 'medium', label: '1 - 10 MB' },
                                { key: 'large', label: '10 - 100 MB' },
                                { key: 'xlarge', label: '> 100 MB' },
                            ].map((s) => (
                                <button
                                    key={s.key}
                                    type="button"
                                    onClick={() => setSizeRange(s.key)}
                                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                                        sizeRange === s.key
                                            ? 'bg-[#FEF9EC] dark:bg-amber-950/50 text-[#9A5B00] dark:text-amber-200 border-[#F2A900]'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4. Date Range */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Waktu Diperbarui
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                                { key: '', label: 'Kapan Saja' },
                                { key: 'today', label: 'Hari Ini' },
                                { key: 'last_7_days', label: '7 Hari Terakhir' },
                                { key: 'last_30_days', label: '30 Hari Terakhir' },
                                { key: 'this_year', label: 'Tahun Ini' },
                            ].map((d) => (
                                <button
                                    key={d.key}
                                    type="button"
                                    onClick={() => setDateRange(d.key)}
                                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                                        dateRange === d.key
                                            ? 'bg-[#FEF9EC] dark:bg-amber-950/50 text-[#9A5B00] dark:text-amber-200 border-[#F2A900]'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 5. Tag Filter */}
                    {allTags && allTags.length > 0 && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Berdasarkan Label / Tag
                            </label>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setSelectedTag('')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                        !selectedTag
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                                    }`}
                                >
                                    Semua Label
                                </button>
                                {allTags.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setSelectedTag(t === selectedTag ? '' : t)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                            selectedTag === t
                                                ? 'bg-[#FEF9EC] dark:bg-amber-950/50 text-[#9A5B00] dark:text-amber-200 border-[#F2A900] font-bold'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                                        }`}
                                    >
                                        #{t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                            Reset Filter
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] transition-colors shadow-xs"
                            >
                                Terapkan Filter
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ==========================================
// 4. STORAGE ANALYTICS MODAL
// ==========================================
interface StorageAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    storage: StorageInfo;
}

export function StorageAnalyticsModal({ isOpen, onClose, storage }: StorageAnalyticsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-fade-in font-poppins">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 font-bold text-base">
                        <PieChart className="w-5 h-5 text-[#CC6F00]" />
                        <span>Analisis Penyimpanan (Storage Analytics)</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Capacity Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                    <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-[#F2A900]/30 text-center">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Terpakai</p>
                        <p className="text-base font-extrabold text-[#CC6F00] mt-0.5">{storage.formatted_used}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{storage.percentage}% kuota</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Batas Kuota</p>
                        <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{storage.formatted_limit}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Kapasitas Maksimal</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Berkas</p>
                        <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{storage.total_files ?? 0}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Item Tersimpan</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Folder</p>
                        <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{storage.total_folders ?? 0}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Direktori Aktif</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                        <span className="text-slate-700 dark:text-slate-200">Distribusi Pemakaian Berdasarkan Kategori</span>
                        <span className="font-mono text-[#CC6F00]">{storage.formatted_used} / {storage.formatted_limit}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 flex overflow-hidden">
                        {storage.categories?.map((cat) => (
                            <div
                                key={cat.key}
                                style={{
                                    width: `${cat.percentage_of_used}%`,
                                    backgroundColor: cat.color,
                                }}
                                title={`${cat.label}: ${cat.formatted} (${cat.percentage_of_used}%)`}
                                className="h-full transition-all duration-300"
                            />
                        ))}
                    </div>

                    {/* Category Legend list */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700 text-xs">
                        {storage.categories?.map((cat) => (
                            <div key={cat.key} className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: cat.color }} />
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate text-[11px]">{cat.label}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{cat.formatted} ({cat.percentage_of_used}%)</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Largest Files Table */}
                {storage.largest_files && storage.largest_files.length > 0 && (
                    <div className="mt-5">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                            Berkas Terbesar di Drive ({storage.largest_files.length})
                        </h4>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden text-xs">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px] uppercase">
                                    <tr>
                                        <th className="py-2.5 px-3">Nama Berkas</th>
                                        <th className="py-2.5 px-3">Ukuran</th>
                                        <th className="py-2.5 px-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {storage.largest_files.map((file) => (
                                        <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="py-2.5 px-3 flex items-center gap-2 truncate max-w-xs font-medium text-slate-800 dark:text-slate-100">
                                                <FileText className="w-4 h-4 text-[#CC6F00] shrink-0" />
                                                <span className="truncate">{file.name}</span>
                                            </td>
                                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-600 dark:text-slate-300">
                                                {file.formatted_size}
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <a
                                                    href={route('files.download', file.id)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#CC6F00] hover:underline"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    <span>Unduh</span>
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-5">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 5. DUPLICATE DETECTION MODAL
// ==========================================
interface DuplicateDetectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DuplicateDetectionModal({ isOpen, onClose }: DuplicateDetectionModalProps) {
    const [loading, setLoading] = useState(false);
    const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
    const [totalWasted, setTotalWasted] = useState('0 B');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const loadDuplicates = async () => {
        setLoading(true);
        try {
            const res = await axios.get(route('files.duplicates'));
            setDuplicateGroups(res.data.duplicate_groups || []);
            setTotalWasted(res.data.formatted_total_wasted || '0 B');
        } catch (err) {
            console.error('Failed to detect duplicates', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadDuplicates();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDeleteDuplicate = (fileId: number) => {
        setDeletingId(fileId);
        router.delete(route('files.destroy', fileId), {
            preserveScroll: true,
            onSuccess: () => {
                // Update local list
                loadDuplicates();
            },
            onFinish: () => setDeletingId(null),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-fade-in font-poppins">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 font-bold text-base">
                        <Files className="w-5 h-5 text-[#CC6F00]" />
                        <span>Deteksi Berkas Duplikat (Duplicate Detection)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadDuplicates}
                            disabled={loading}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Pindai Ulang"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 text-center space-y-3">
                        <RefreshCw className="w-8 h-8 text-[#CC6F00] animate-spin mx-auto" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Sedang memindai berkas duplikat di CloudVault Anda...
                        </p>
                        <p className="text-[11px] text-slate-400">
                            Memeriksa checksum hash dan kesamaan ukuran file
                        </p>
                    </div>
                ) : duplicateGroups.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            Tidak Ditemukan Berkas Duplikat!
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Semua berkas di CloudVault Anda unik. Tidak ada kapasitas penyimpanan yang terbuang sia-sia.
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 space-y-4">
                        {/* Wasted Summary banner */}
                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-[#F2A900]/40 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-[#CC6F00] shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-slate-800">
                                        Ditemukan {duplicateGroups.length} Kelompok Berkas Duplikat
                                    </p>
                                    <p className="text-[11px] text-slate-600 mt-0.5">
                                        Total ruang yang bisa dihemat: <strong className="text-[#CC6F00] font-mono">{totalWasted}</strong>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Duplicate Group List */}
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                            {duplicateGroups.map((group, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-[#CC6F00]" />
                                            <span className="font-bold text-slate-800 dark:text-slate-100">{group.file_name}</span>
                                            <span className="text-slate-400 font-mono text-[11px]">({group.formatted_size})</span>
                                        </div>
                                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                                            +{group.duplicates.length} salinan ({group.formatted_wasted})
                                        </span>
                                    </div>

                                    {/* Original Item */}
                                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 mb-1.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                ASLI
                                            </span>
                                            <span className="text-slate-600 dark:text-slate-300 truncate">
                                                Di: {group.original.folder_name} &bull; {group.original.created_at}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-slate-400 font-medium">Pertahankan</span>
                                    </div>

                                    {/* Duplicate Items */}
                                    <div className="space-y-1 pl-4 border-l-2 border-amber-200">
                                        {group.duplicates.map((dup: any) => (
                                            <div
                                                key={dup.id}
                                                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
                                            >
                                                <div className="truncate flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                    <span className="text-red-500 font-bold text-[10px] uppercase">Salinan:</span>
                                                    <span className="truncate">{dup.name} ({dup.folder_name})</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteDuplicate(dup.id)}
                                                    disabled={deletingId === dup.id || dup.is_locked}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-800 transition-colors shrink-0 disabled:opacity-50"
                                                    title={dup.is_locked ? 'Berkas terkunci' : 'Pindahkan ke tempat sampah'}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    <span>{deletingId === dup.id ? 'Menghapus...' : 'Hapus Salinan'}</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 6. DOWNLOAD MANAGER MODAL
// ==========================================
export interface DownloadItem {
    id: string;
    name: string;
    size?: string;
    downloaded_at: string;
    url: string;
    type?: string;
}

interface DownloadManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    downloads: DownloadItem[];
    onClear: () => void;
}

export function DownloadManagerModal({ isOpen, onClose, downloads, onClear }: DownloadManagerModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-fade-in font-poppins">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 font-bold text-base">
                        <Download className="w-5 h-5 text-[#CC6F00]" />
                        <span>Manajer Unduhan (Download Manager)</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    {downloads.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                                <Download className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Belum ada riwayat unduhan</p>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Setiap berkas atau folder yang Anda unduh akan tercatat di sini.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {downloads.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {item.size ? `${item.size} • ` : ''}Selesai diunduh &bull; {item.downloaded_at}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={item.url}
                                        className="ml-3 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition-colors shrink-0 shadow-2xs"
                                        title="Unduh kembali berkas ini"
                                    >
                                        Unduh Lagi
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    {downloads.length > 0 ? (
                        <button
                            type="button"
                            onClick={onClear}
                            className="text-xs font-semibold text-red-500 hover:underline"
                        >
                            Bersihkan Riwayat Unduhan
                        </button>
                    ) : <span />}

                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 7. FILE REQUEST MODAL
// ==========================================
interface FileRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableFolders: Array<{ id: number; name: string }>;
}

export function FileRequestModal({ isOpen, onClose, availableFolders }: FileRequestModalProps) {
    const [requests, setRequests] = useState<FileRequestItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [folderId, setFolderId] = useState<string>('');
    const [expiresDays, setExpiresDays] = useState<number>(7);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const res = await axios.get(route('file-requests.index'));
            setRequests(res.data.fileRequests || []);
        } catch (err) {
            console.error('Failed to load file requests', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadRequests();
            setIsCreating(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            await axios.post(route('file-requests.store'), {
                title: title.trim(),
                description: description.trim() || undefined,
                folder_id: folderId ? parseInt(folderId, 10) : undefined,
                expires_in_days: expiresDays,
            });
            setTitle('');
            setDescription('');
            setFolderId('');
            setIsCreating(false);
            loadRequests();
        } catch (err) {
            console.error('Failed to create file request', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus tautan permintaan berkas ini?')) return;
        try {
            await axios.delete(route('file-requests.destroy', id));
            loadRequests();
        } catch (err) {
            console.error('Failed to delete file request', err);
        }
    };

    const copyToClipboard = (url: string, token: string) => {
        navigator.clipboard.writeText(url);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-fade-in font-poppins">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 font-bold text-base">
                        <FileUp className="w-5 h-5 text-[#CC6F00]" />
                        <span>Minta Berkas (File Request)</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    {isCreating ? (
                        <form onSubmit={handleCreateSubmit} className="space-y-4 animate-fade-in">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                                Buat Tautan Permintaan Berkas Baru
                            </h4>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Judul Permintaan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Contoh: Kirim Foto Kegiatan Workshop, Laporan Pajak 2026..."
                                    required
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#F2A900]/20 focus:border-[#F2A900] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Instruksi / Catatan Pengirim (Opsional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Petunjuk berkas yang dibutuhkan (format PDF/gambar, resolusi, nama berkas)..."
                                    rows={2}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#F2A900]/20 focus:border-[#F2A900] focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Simpan ke Folder
                                    </label>
                                    <select
                                        value={folderId}
                                        onChange={(e) => setFolderId(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#F2A900]/20 focus:border-[#F2A900] focus:outline-none"
                                    >
                                        <option value="">Root (My Drive)</option>
                                        {availableFolders.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Masa Berlaku
                                    </label>
                                    <select
                                        value={expiresDays}
                                        onChange={(e) => setExpiresDays(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#F2A900]/20 focus:border-[#F2A900] focus:outline-none"
                                    >
                                        <option value={1}>1 Hari</option>
                                        <option value={7}>7 Hari</option>
                                        <option value={30}>30 Hari</option>
                                        <option value={90}>90 Hari</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2 rounded-xl text-xs font-bold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] transition-colors shadow-xs"
                                >
                                    {loading ? 'Membuat...' : 'Buat Tautan Permintaan'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500">
                                    Siapa saja yang memiliki tautan dapat mengunggah berkas langsung ke akun CloudVault Anda tanpa perlu memiliki akun.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(true)}
                                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Minta Berkas Baru</span>
                                </button>
                            </div>

                            {requests.length === 0 ? (
                                <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                                    <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Belum ada tautan permintaan aktif</p>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Klik "Minta Berkas Baru" untuk membuat tautan unggah bagi orang lain.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {requests.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h5 className="font-bold text-slate-800 dark:text-slate-100">{item.title}</h5>
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FEF9EC] text-[#CC6F00] border border-[#F2A900]/30">
                                                        {item.uploads_count} berkas diterima
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1 rounded-md text-slate-400 hover:text-red-500 transition-colors"
                                                    title="Hapus Permintaan"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {item.description && (
                                                <p className="text-slate-600 dark:text-slate-300 text-[11px] font-medium">{item.description}</p>
                                            )}

                                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                                                <span>Tujuan: <strong className="text-slate-700 dark:text-slate-200">{item.folder_name}</strong></span>
                                                {item.expires_at && <span>Batas: {item.expires_at}</span>}
                                            </div>

                                            {/* Link & Copy button */}
                                            <div className="flex items-center gap-2 pt-1">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={item.url}
                                                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-mono select-all focus:outline-none"
                                                />
                                                <button
                                                    onClick={() => copyToClipboard(item.url, item.token)}
                                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] transition-colors flex items-center gap-1.5 shrink-0"
                                                >
                                                    {copiedToken === item.token ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 text-slate-900" />
                                                            <span>Disalin!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3.5 h-3.5" />
                                                            <span>Salin Link</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-3.5 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 8. WHATSAPP & EXTERNAL APPS INTEGRATION MODAL
// ==========================================
interface WhatsAppIntegrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToken?: string;
    onTokenRegenerated?: (newToken: string) => void;
}

export function WhatsAppIntegrationModal({
    isOpen,
    onClose,
    userToken: initialToken = '',
    onTokenRegenerated,
}: WhatsAppIntegrationModalProps) {
    const [token, setToken] = useState(initialToken);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedCurl, setCopiedCurl] = useState(false);
    const [activeTab, setActiveTab] = useState<'test' | 'guide' | 'curl'>('test');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isSendingTest, setIsSendingTest] = useState(false);

    // Test form states
    const [testSender, setTestSender] = useState('+62 812-3456-7890');
    const [testCaption, setTestCaption] = useState('Foto dokumentasi & kuitansi belanja');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        if (initialToken) setToken(initialToken);
    }, [initialToken]);

    if (!isOpen) return null;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const webhookUrl = `${origin}/api/v1/inbound/${token}`;

    const curlSnippet = `curl -X POST "${webhookUrl}" \\
  -F "file=@foto_struk.jpg" \\
  -F "sender=6281234567890" \\
  -F "caption=Foto kuitansi dari WhatsApp"`;

    const handleCopy = (text: string, type: 'url' | 'curl') => {
        navigator.clipboard.writeText(text);
        if (type === 'url') {
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        } else {
            setCopiedCurl(true);
            setTimeout(() => setCopiedCurl(false), 2000);
        }
    };

    const handleRegenerateToken = async () => {
        if (!confirm('Apakah Anda yakin ingin memperbarui token integrasi? URL webhook lama tidak akan dapat menerima file lagi.')) {
            return;
        }

        setIsRegenerating(true);
        try {
            const res = await axios.post('/integrations/regenerate-token');
            if (res.data?.token) {
                setToken(res.data.token);
                if (onTokenRegenerated) onTokenRegenerated(res.data.token);
            }
        } catch (err) {
            console.error('Gagal memperbarui token', err);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleRunTest = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSendingTest(true);
        setTestResult(null);

        const formData = new FormData();
        if (selectedImage) {
            formData.append('image', selectedImage);
        }
        formData.append('sender', testSender);
        formData.append('caption', testCaption);

        try {
            await axios.post('/integrations/simulate-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setTestResult({
                success: true,
                message: 'Foto berhasil disimulasikan dari WhatsApp dan masuk ke folder "WhatsApp Media"!',
            });

            setTimeout(() => {
                onClose();
                router.visit('/drive', { preserveState: false });
            }, 1400);
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.response?.data?.message || 'Gagal mengirim simulasi foto WhatsApp.',
            });
        } finally {
            setIsSendingTest(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in font-poppins">
            <div className="w-full max-w-xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-50/50 via-white to-amber-50/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-amber-950/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-[#25D366]/30 shrink-0">
                            <MessageSquare className="w-5 h-5 fill-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                                    Integrasi WhatsApp & Aplikasi Luar
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#25D366]/15 text-[#075E54] dark:text-[#25D366]">
                                    Aktif
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Simpan foto & berkas otomatis dari WhatsApp langsung ke CloudVault
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content body */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
                    {/* Webhook URL Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-[#25D366]" />
                                <span>URL Webhook Pribadi Anda</span>
                            </label>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                <span>Folder:</span>
                                <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    WhatsApp Media
                                </strong>
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={webhookUrl}
                                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-mono select-all focus:outline-none"
                            />
                            <button
                                onClick={() => handleCopy(webhookUrl, 'url')}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1EBE5D] transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                                title="Salin Webhook URL"
                            >
                                {copiedUrl ? (
                                    <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Tersalin!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Salin URL</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                            <span>Setiap foto yang dikirim ke URL ini otomatis masuk ke CloudVault Anda.</span>
                            <button
                                type="button"
                                onClick={handleRegenerateToken}
                                disabled={isRegenerating}
                                className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                                <span>Perbarui Token</span>
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('test')}
                            className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
                                activeTab === 'test'
                                    ? 'text-[#25D366] border-b-2 border-[#25D366]'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                        >
                            Uji Coba Kirim Foto WA
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('guide')}
                            className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
                                activeTab === 'guide'
                                    ? 'text-[#25D366] border-b-2 border-[#25D366]'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                        >
                            Cara Sambungkan WhatsApp
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('curl')}
                            className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
                                activeTab === 'curl'
                                    ? 'text-[#25D366] border-b-2 border-[#25D366]'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                        >
                            API & Script cURL
                        </button>
                    </div>

                    {/* TAB 1: LIVE TEST FORM */}
                    {activeTab === 'test' && (
                        <form onSubmit={handleRunTest} className="space-y-4">
                            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                                <Smartphone className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Simulasikan Foto Masuk dari WhatsApp</p>
                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                                        Anda bisa langsung mengunggah foto uji coba atau membiarkan CloudVault membuat sampel foto tanda terima WhatsApp otomatis.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Nomor Pengirim WhatsApp
                                    </label>
                                    <input
                                        type="text"
                                        value={testSender}
                                        onChange={(e) => setTestSender(e.target.value)}
                                        placeholder="+62 812-xxxx-xxxx"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Pilih Foto (Opsional)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Keterangan / Caption Chat
                                </label>
                                <input
                                    type="text"
                                    value={testCaption}
                                    onChange={(e) => setTestCaption(e.target.value)}
                                    placeholder="Contoh: Bukti transfer pembayaran proyek"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] outline-none"
                                />
                            </div>

                            {testResult && (
                                <div
                                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                                        testResult.success
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                            : 'bg-red-50 text-red-800 border border-red-200'
                                    }`}
                                >
                                    {testResult.success ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                                    )}
                                    <span>{testResult.message}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSendingTest}
                                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#1EBE5D] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#25D366]/25 disabled:opacity-50"
                            >
                                <Send className={`w-4 h-4 ${isSendingTest ? 'animate-pulse' : ''}`} />
                                <span>{isSendingTest ? 'Mengirim Foto ke CloudVault...' : 'Kirim Simulasi Foto WA Sekarang'}</span>
                            </button>
                        </form>
                    )}

                    {/* TAB 2: STEP BY STEP GUIDE */}
                    {activeTab === 'guide' && (
                        <div className="space-y-4 text-xs">
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center text-[10px]">1</span>
                                    <span>Menggunakan WhatsApp Gateway (Fonnte, Wablas, UltraMsg)</span>
                                </h4>
                                <p className="text-slate-600 dark:text-slate-400 pl-7 text-[11px] leading-relaxed">
                                    Buka pengaturan Webhook di dashboard provider WhatsApp Anda, lalu tempelkan <strong>URL Webhook Pribadi</strong> di atas. Setiap ada pengguna yang mengirim foto ke bot WhatsApp Anda, gateway akan meneruskannya dan CloudVault otomatis menyimpannya ke folder <strong>WhatsApp Media</strong>.
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center text-[10px]">2</span>
                                    <span>Meta WhatsApp Cloud API (Developer Resmi)</span>
                                </h4>
                                <div className="text-slate-600 dark:text-slate-400 pl-7 text-[11px] space-y-1">
                                    <p>• <strong>Callback URL:</strong> <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">{webhookUrl}</code></p>
                                    <p>• <strong>Verify Token:</strong> <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">{token}</code></p>
                                    <p>CloudVault mendukung proses verifikasi otomatis (hub.challenge) dari Meta.</p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center text-[10px]">3</span>
                                    <span>Apple iOS Shortcuts / Android / Zapier / Make / n8n</span>
                                </h4>
                                <p className="text-slate-600 dark:text-slate-400 pl-7 text-[11px] leading-relaxed">
                                    Buat pintasan di iPhone atau Android: saat Anda membagikan foto dari WhatsApp, pilih pintasan yang mengirim file dengan metode <code>POST</code> ke URL Webhook Anda.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: CURL & DEVELOPER API */}
                    {activeTab === 'curl' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Contoh cURL Perintah Terminal:</span>
                                </span>
                                <button
                                    onClick={() => handleCopy(curlSnippet, 'curl')}
                                    className="text-xs font-semibold text-[#25D366] hover:underline flex items-center gap-1"
                                >
                                    {copiedCurl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedCurl ? 'Tersalin' : 'Salin Perintah'}</span>
                                </button>
                            </div>

                            <pre className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 select-all">
                                {curlSnippet}
                            </pre>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500 space-y-1">
                                <p className="font-semibold text-slate-700 dark:text-slate-300">Format yang Didukung:</p>
                                <p>• <strong>Multipart Form:</strong> field <code>file</code>, <code>image</code>, <code>photo</code>, atau <code>media</code>.</p>
                                <p>• <strong>Direct URL (JSON):</strong> <code>{`{"url": "https://...", "caption": "..."}`}</code> (CloudVault akan mengunduh langsung dari link).</p>
                                <p>• <strong>Base64 Data (JSON):</strong> <code>{`{"data": "data:image/jpeg;base64,...", "name": "foto.jpg"}`}</code>.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] transition-colors"
                    >
                        Selesai
                    </button>
                </div>
            </div>
        </div>
    );
}


