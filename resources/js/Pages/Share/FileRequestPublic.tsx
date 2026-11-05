import React, { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    Upload,
    CheckCircle2,
    AlertCircle,
    FileUp,
    Folder,
    User,
    Clock,
    X,
    FileText,
    ArrowRight
} from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';

interface FileRequestPublicProps {
    fileRequest: {
        token: string;
        title: string;
        description: string | null;
        requester_name: string;
        folder_name?: string;
        expires_at: string | null;
    };
}

export default function FileRequestPublic({ fileRequest }: FileRequestPublicProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploaderName, setUploaderName] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files);
        setSelectedFiles((prev) => [...prev, ...newFiles]);
        setError(null);
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFiles.length === 0) {
            setError('Pilih minimal satu berkas untuk dikirimkan.');
            return;
        }

        setUploading(true);
        setProgress(0);
        setError(null);

        const formData = new FormData();
        selectedFiles.forEach((file) => {
            formData.append('files[]', file);
        });
        if (uploaderName.trim()) {
            formData.append('uploader_name', uploaderName.trim());
        }

        try {
            const response = await axios.post(
                route('file-requests.upload', fileRequest.token),
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setProgress(percent);
                        }
                    },
                }
            );

            setIsSuccess(true);
            setSuccessMessage(response.data.message || 'Berkas berhasil dikirimkan.');
            setSelectedFiles([]);
        } catch (err: any) {
            const errorMsg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Gagal mengunggah berkas. Silakan coba lagi.';
            setError(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-poppins text-slate-800">
            <Head>
                <title>{`Kirim Berkas: ${fileRequest.title} - CloudVault`}</title>
                <meta name="robots" content="noindex, nofollow" />
                <meta name="description" content="Tautan permintaan pengunggahan berkas CloudVault." />
            </Head>

            {/* Ambient Lighting */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute -top-32 right-1/4 w-[600px] h-[400px] bg-gradient-to-br from-amber-200/25 via-amber-100/15 to-transparent blur-3xl rounded-full" />
                <div className="absolute top-10 -left-20 w-[480px] h-[360px] bg-gradient-to-tr from-slate-200/40 via-amber-100/10 to-transparent blur-3xl rounded-full" />
                <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_15%,#000_65%,transparent_100%)] opacity-30" />
            </div>

            {/* Brand Header */}
            <div className="mb-6">
                <ApplicationLogo />
            </div>

            <div className="w-full max-w-lg bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200/80">
                {isSuccess ? (
                    <div className="text-center py-6 animate-fade-in">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Pengiriman Berhasil!</h2>
                        <p className="text-xs text-slate-600 mb-6 font-medium leading-relaxed">
                            {successMessage}
                        </p>
                        <button
                            onClick={() => {
                                setIsSuccess(false);
                                setProgress(0);
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-900 bg-[#F2A900] hover:bg-[#E09800] transition-colors shadow-xs"
                        >
                            <FileUp className="w-4 h-4" />
                            <span>Kirim Berkas Lain</span>
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* Request Info Header */}
                        <div className="text-center pb-6 border-b border-slate-100">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#CC6F00] bg-[#FEF9EC] border border-[#F2A900]/30 mb-3">
                                <FileUp className="w-3.5 h-3.5" />
                                <span>Permintaan Berkas</span>
                            </div>
                            <h1 className="text-lg font-bold text-slate-900 mb-1.5">
                                {fileRequest.title}
                            </h1>
                            {fileRequest.description && (
                                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                                    {fileRequest.description}
                                </p>
                            )}

                            <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium flex-wrap">
                                <div className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Pemohon: <strong className="text-slate-700">{fileRequest.requester_name}</strong></span>
                                </div>
                                {fileRequest.folder_name && (
                                    <div className="flex items-center gap-1">
                                        <Folder className="w-3.5 h-3.5 text-[#CC6F00]" />
                                        <span>Folder: <strong className="text-slate-700">{fileRequest.folder_name}</strong></span>
                                    </div>
                                )}
                                {fileRequest.expires_at && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Batas: {fileRequest.expires_at}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            {/* Uploader Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Nama Anda (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={uploaderName}
                                    onChange={(e) => setUploaderName(e.target.value)}
                                    placeholder="Contoh: Budi Santoso (Departemen HR)"
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-[#F2A900]/20 focus:border-[#F2A900] focus:outline-none"
                                />
                            </div>

                            {/* Dropzone */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                                    isDragging
                                        ? 'border-[#F2A900] bg-amber-50/50 scale-[1.01]'
                                        : 'border-slate-200 hover:border-[#F2A900]/70 hover:bg-slate-50/60'
                                }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    multiple
                                    onChange={(e) => handleFiles(e.target.files)}
                                    className="hidden"
                                />
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-[#F2A900]/30 text-[#CC6F00] flex items-center justify-center mx-auto mb-3">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-semibold text-slate-800">
                                    Tarik & lepaskan berkas ke sini, atau <span className="text-[#CC6F00] underline">jelajahi file</span>
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Bisa memilih lebih dari satu berkas sekaligus
                                </p>
                            </div>

                            {/* Selected Files List */}
                            {selectedFiles.length > 0 && (
                                <div className="space-y-2 max-h-48 overflow-y-auto pt-1">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                        <span>Berkas Terpilih ({selectedFiles.length})</span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFiles([])}
                                            className="text-red-500 hover:underline text-[11px]"
                                        >
                                            Hapus Semua
                                        </button>
                                    </div>
                                    {selectedFiles.map((f, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="font-medium text-slate-800 truncate">{f.name}</span>
                                                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                                                    ({formatBytes(f.size)})
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(i)}
                                                className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-200/60 transition-colors ml-2"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Progress bar */}
                            {uploading && (
                                <div className="space-y-1.5 pt-2">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-slate-600">Mengunggah ke CloudVault...</span>
                                        <span className="text-[#CC6F00] font-mono">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-[#F2A900] to-[#CC6F00] h-2 rounded-full transition-all duration-200"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={uploading || selectedFiles.length === 0}
                                className="w-full py-3 rounded-xl font-bold text-xs text-slate-900 bg-[#F2A900] hover:bg-[#E09800] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Upload className="w-4 h-4" />
                                <span>
                                    {uploading
                                        ? `Mengunggah (${progress}%)...`
                                        : `Kirim ${selectedFiles.length > 0 ? `${selectedFiles.length} Berkas` : 'Berkas'}`}
                                </span>
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <p className="mt-6 text-xs text-slate-400 font-medium">
                CloudVault Storage &bull; Berkas diunggah dengan aman ke server pribadi
            </p>
        </div>
    );
}

