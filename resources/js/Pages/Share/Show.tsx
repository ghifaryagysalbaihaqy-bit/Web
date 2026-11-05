import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Download,
    Eye,
    Lock,
    Clock,
    User as UserIcon,
    HardDrive,
    ShieldAlert,
    Shield,
    Edit2,
    Upload,
    CheckCircle2
} from 'lucide-react';
import { FileIcon } from '@/Components/FileIcon';
import ApplicationLogo from '@/Components/ApplicationLogo';

interface ShareShowProps {
    token: string;
    fileName: string;
    formattedSize: string;
    extension: string | null;
    mimeType: string | null;
    permission?: 'viewer' | 'editor';
    canEdit?: boolean;
    isImage: boolean;
    isPdf: boolean;
    isAudio: boolean;
    isVideo: boolean;
    isText: boolean;
    sharedBy: string;
    createdAt: string;
    downloadsCount: number;
    hasPassword: boolean;
    isUnlocked: boolean;
    errors?: { password?: string };
}

export default function ShareShow({
    token,
    fileName,
    formattedSize,
    extension,
    mimeType,
    permission = 'viewer',
    canEdit = false,
    isImage,
    isPdf,
    isAudio,
    isVideo,
    isText,
    sharedBy,
    createdAt,
    downloadsCount,
    hasPassword,
    isUnlocked,
    errors,
}: ShareShowProps) {
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [editorFile, setEditorFile] = useState<File | null>(null);
    const [uploadingVersion, setUploadingVersion] = useState(false);
    const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
    const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(
            route('share.unlock', token),
            { password },
            {
                onFinish: () => setSubmitting(false),
            }
        );
    };

    const handleEditorUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editorFile) return;

        setUploadingVersion(true);
        setUploadSuccessMsg(null);
        setUploadErrorMsg(null);

        const formData = new FormData();
        formData.append('file', editorFile);

        try {
            const res = await axios.post(route('share.upload-version', token), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploadSuccessMsg(res.data.message || 'Versi baru berhasil diunggah.');
            setEditorFile(null);
            setShowUploadForm(false);
            router.reload();
        } catch (err: any) {
            setUploadErrorMsg(err.response?.data?.message || 'Gagal mengunggah versi baru.');
        } finally {
            setUploadingVersion(false);
        }
    };

    const downloadUrl = route('share.download', token);
    const previewUrl = route('share.preview', token);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-poppins text-slate-800">
            <Head>
                <title>{`Unduh & Pratinjau Berkas: ${fileName} - CloudVault`}</title>
                <meta name="robots" content="noindex, nofollow" />
                <meta name="description" content="Tautan berbagi berkas CloudVault terproteksi." />
            </Head>

            {/* Brand Header */}
            <div className="mb-8">
                <ApplicationLogo />
            </div>

            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
                {!isUnlocked ? (
                    /* PASSWORD PROMPT */
                    <div className="p-5 sm:p-8 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#FEF9EC] text-[#CC6F00] border border-[#F2A900]/30 flex items-center justify-center mx-auto mb-4 shadow-xs">
                            <Lock className="w-7 h-7" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 mb-2">Tautan Dilindungi Kata Sandi</h2>
                        <p className="text-xs text-slate-500 mb-6 font-medium">
                            Masukkan kata sandi untuk membuka dan mengunduh berkas ini.
                        </p>

                        <form onSubmit={handleUnlock} className="space-y-4">
                            <div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                    autoFocus
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#F2A900]/40 focus:border-[#CC6F00] focus:outline-none text-sm transition-colors"
                                />
                                {errors?.password && (
                                    <p className="text-xs text-red-600 mt-2 flex items-center justify-center gap-1 font-semibold">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        <span>{errors.password}</span>
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !password}
                                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-900 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white disabled:opacity-50 transition-all shadow-md shadow-[#F2A900]/20"
                            >
                                {submitting ? 'Membuka...' : 'Buka Berkas'}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* FILE CARD */
                    <div className="p-5 sm:p-8 space-y-6">
                        {/* Permission & Status Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                permission === 'editor'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                                <Shield className="w-3.5 h-3.5" />
                                <span>Izin: {permission === 'editor' ? 'Editor (Dapat Mengedit)' : 'Viewer (Hanya Lihat)'}</span>
                            </span>

                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={() => setShowUploadForm(!showUploadForm)}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-slate-900 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white transition-all shadow-2xs"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>{showUploadForm ? 'Tutup Form' : 'Unggah Versi Baru'}</span>
                                </button>
                            )}
                        </div>

                        {uploadSuccessMsg && (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{uploadSuccessMsg}</span>
                            </div>
                        )}

                        {uploadErrorMsg && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 font-medium">
                                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                                <span>{uploadErrorMsg}</span>
                            </div>
                        )}

                        {/* Editor Upload Drawer */}
                        {showUploadForm && canEdit && (
                            <form onSubmit={handleEditorUpload} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Edit2 className="w-3.5 h-3.5 text-[#CC6F00]" />
                                    <span>Unggah Revisi / Versi Baru Berkas</span>
                                </p>
                                <input
                                    type="file"
                                    required
                                    onChange={(e) => setEditorFile(e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F2A900] file:text-slate-950 hover:file:bg-[#CC6F00] hover:file:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={uploadingVersion || !editorFile}
                                    className="w-full py-2 rounded-xl text-xs font-bold bg-[#CC6F00] hover:bg-[#9A5B00] text-white transition-all disabled:opacity-50"
                                >
                                    {uploadingVersion ? 'Mengunggah Revisi...' : 'Kirim Versi Baru'}
                                </button>
                            </form>
                        )}

                        {/* File Details */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                            <FileIcon extension={extension} mimeType={mimeType} className="w-12 h-12 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate" title={fileName}>
                                    {fileName}
                                </h2>
                                <p className="text-xs text-[#9A5B00] dark:text-amber-400 font-semibold mt-1">{formattedSize}</p>
                            </div>
                        </div>

                        {/* Metadata row */}
                        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                                <UserIcon className="w-4 h-4 text-[#CC6F00]" />
                                <span className="truncate font-medium">{sharedBy}</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                                <Clock className="w-4 h-4 text-[#CC6F00]" />
                                <span className="font-medium">{createdAt}</span>
                            </div>
                        </div>

                        {/* Inline Preview Toggle */}
                        {showPreview && (
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950 p-2">
                                {isImage ? (
                                    <img src={previewUrl} alt={fileName} className="max-h-80 mx-auto rounded-xl object-contain" />
                                ) : isPdf ? (
                                    <iframe src={previewUrl} title={fileName} className="w-full h-80 rounded-xl" />
                                ) : isVideo ? (
                                    <video controls src={previewUrl} className="w-full max-h-80 rounded-xl" />
                                ) : isAudio ? (
                                    <audio controls src={previewUrl} className="w-full p-4" />
                                ) : (
                                    <p className="text-xs text-center text-slate-400 py-6">Pratinjau tidak didukung untuk format ini.</p>
                                )}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="space-y-3 pt-2">
                            <a
                                href={downloadUrl}
                                className="w-full py-3.5 px-4 rounded-xl font-bold text-slate-950 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white transition-all shadow-md shadow-[#F2A900]/20 flex items-center justify-center gap-2 text-sm"
                            >
                                <Download className="w-4 h-4" />
                                <span>Unduh Berkas ({formattedSize})</span>
                            </a>

                            {(isImage || isPdf || isAudio || isVideo) && (
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-4 h-4 text-[#CC6F00]" />
                                    <span>{showPreview ? 'Sembunyikan Pratinjau' : 'Pratinjau Berkas'}</span>
                                </button>
                            )}
                        </div>

                        {downloadsCount > 0 && (
                            <p className="text-center text-[11px] text-slate-500 font-medium">
                                Telah diunduh {downloadsCount} kali
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
