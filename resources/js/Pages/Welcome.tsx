import React from 'react';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    HardDrive,
    UploadCloud,
    FolderKanban,
    Share2,
    Eye,
    Archive,
    ArrowRight,
    ShieldCheck,
    CheckCircle2,
    History,
    Activity,
    FileText,
    Image as ImageIcon,
    Video,
    Lock,
    Sparkles,
    Clock,
    Server,
    Shield,
    FileUp,
    Zap,
    RotateCcw,
    Folder,
    Check
} from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Welcome({ auth }: PageProps) {
    return (
        <div className="min-h-screen bg-white text-slate-800 font-poppins selection:bg-[#F2A900] selection:text-slate-900 relative overflow-x-clip scroll-smooth">
            <Head title="CloudVault - Private Enterprise Cloud Storage" />

            {/* Top Navigation / Header Permanently Anchored (Fixed) at the Top */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl shadow-slate-950/20 transition-all">
                <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ApplicationLogo isDark={true} />
                    </div>

                    <nav className="flex items-center gap-3">
                        {auth.user ? (
                            <Link
                                href={route('drive.index')}
                                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white shadow-md shadow-[#F2A900]/25 transition-all"
                            >
                                <span>Buka Drive Saya</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2.5">
                                <Link
                                    href={route('login')}
                                    className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white shadow-md shadow-[#F2A900]/25 transition-all"
                                >
                                    <span>Masuk ke Akun</span>
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>
                {/* Subtle Gold Accent Divider */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#F2A900]/50 to-transparent" />
            </header>

            {/* Header Spacer to prevent content jump under fixed header */}
            <div className="h-[68px] sm:h-[72px]" />

            {/* Ambient Lighting & Geometric Patterns - Positioned strictly below header */}
            <div className="absolute top-[72px] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[950px] h-[400px] bg-gradient-to-b from-[#F2A900]/20 via-[#F9E6A8]/15 to-transparent blur-3xl rounded-full" />
                <div className="absolute top-24 -left-20 w-72 h-72 bg-amber-100/40 rounded-full blur-2xl" />
                <div className="absolute top-36 -right-20 w-72 h-72 bg-yellow-100/50 rounded-full blur-2xl" />
            </div>

            {/* Subtle Tech Grid overlay - Positioned strictly below header */}
            <div className="absolute inset-0 top-[72px] bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_65%,transparent_100%)] pointer-events-none opacity-60" />

            {/* Hero Section */}
            <main className="relative max-w-7xl mx-auto px-6 pt-12 sm:pt-16 pb-20">
                {/* Badge Tag */}
                <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-amber-200/90 shadow-sm shadow-amber-100 text-xs font-semibold text-slate-800 mb-8 backdrop-blur-sm animate-fade-in">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-slate-600 font-medium">Server Pribadi Aktif •</span>
                        <span className="text-[#CC6F00] font-bold">100% Mandiri & Aman di Server Sendiri</span>
                    </div>
                </div>

                {/* Main Headline */}
                <div className="text-center max-w-4xl mx-auto space-y-6">
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-950 tracking-tight leading-[1.12]">
                        Penyimpanan Cloud Mandiri Berkecepatan Tinggi dengan{' '}
                        <span className="relative inline-block">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CC6F00] via-[#F2A900] to-[#CC6F00]">
                                CloudVault
                            </span>
                            <span className="absolute left-0 bottom-1 w-full h-2 bg-[#F2A900]/20 -z-10 rounded-full" />
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
                        Kelola, bagikan, dan amankan berkas berharga Anda di server privat sendiri. Dilengkapi kendali izin <strong className="text-slate-900 font-semibold">Viewer & Editor</strong>, pelacakan <strong className="text-slate-900 font-semibold">Riwayat Versi</strong>, dan <strong className="text-slate-900 font-semibold">Log Aktivitas</strong> real-time.
                    </p>

                    {/* Action Buttons */}
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                        {auth.user ? (
                            <Link
                                href={route('drive.index')}
                                className="group w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm text-slate-950 bg-gradient-to-r from-[#F2A900] to-[#E59B00] hover:from-[#CC6F00] hover:to-[#B55F00] hover:text-white shadow-xl shadow-[#F2A900]/30 transition-all flex items-center justify-center gap-2 transform active:scale-98"
                            >
                                <HardDrive className="w-4 h-4 text-slate-900 group-hover:text-white transition-colors" />
                                <span>Buka Dashboard Drive</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="group w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm text-slate-950 bg-gradient-to-r from-[#F2A900] to-[#E59B00] hover:from-[#CC6F00] hover:to-[#B55F00] hover:text-white shadow-xl shadow-[#F2A900]/30 transition-all flex items-center justify-center gap-2 transform active:scale-98"
                            >
                                <Zap className="w-4 h-4 text-slate-900 group-hover:text-white transition-colors" />
                                <span>Masuk ke CloudVault</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}

                        <a
                            href="#features"
                            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-semibold text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-4 h-4 text-[#CC6F00]" />
                            <span>Jelajahi Fitur Lengkap</span>
                        </a>
                    </div>

                    {/* Trust Proof Points */}
                    <div className="pt-6 flex items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Tanpa Kuota Bulanan Pihak Ketiga</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Enkripsi Tautan Sandi</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Multi-Perangkat Cepat</span>
                        </div>
                    </div>
                </div>

                {/* APP INTERFACE SHOWCASE (Interactive Mockup Window) */}
                <div className="mt-16 sm:mt-20 relative max-w-5xl mx-auto">
                    {/* Floating Feature Tags around the Preview */}
                    <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white shadow-xl shadow-slate-200/60 border border-slate-200/80 absolute -top-5 -left-8 z-20 animate-bounce duration-1000">
                        <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
                            <FileUp className="w-4 h-4 text-[#CC6F00]" />
                        </div>
                        <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-900">Upload Manager</p>
                            <p className="text-[10px] text-slate-500">Drag & Drop + Progress Bar</p>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white shadow-xl shadow-slate-200/60 border border-slate-200/80 absolute -top-5 -right-8 z-20">
                        <div className="p-1.5 rounded-xl bg-purple-100 text-purple-700">
                            <Share2 className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-900">Viewer & Editor Share</p>
                            <p className="text-[10px] text-slate-500">Izin Berbagi Fleksibel</p>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white shadow-xl shadow-slate-200/60 border border-slate-200/80 absolute -bottom-5 right-12 z-20">
                        <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                            <History className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-900">Version History</p>
                            <p className="text-[10px] text-slate-500">Pemulihan Versi Sekali Klik</p>
                        </div>
                    </div>

                    {/* Window Container */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-300/60 overflow-hidden ring-1 ring-slate-900/5">
                        {/* Browser Window Bar */}
                        <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-400/90 inline-block" />
                                <span className="w-3 h-3 rounded-full bg-amber-400/90 inline-block" />
                                <span className="w-3 h-3 rounded-full bg-emerald-400/90 inline-block" />
                            </div>

                            <div className="px-4 py-1 rounded-xl bg-white border border-slate-200/70 text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                                <Lock className="w-3 h-3 text-emerald-600" />
                                <span>cloudvault.internal/drive</span>
                            </div>

                            <div className="text-[11px] font-semibold text-slate-400">
                                Cloud Explorer v2.4
                            </div>
                        </div>

                        {/* Simulated Cloud App Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px] bg-white text-left">
                            {/* Left Mini Sidebar */}
                            <div className="hidden md:block md:col-span-3 border-r border-slate-100 p-4 space-y-4 bg-slate-50/40">
                                <div className="space-y-1">
                                    <div className="px-3 py-2 rounded-xl bg-[#FEF9EC] border border-[#F2A900]/30 text-[#9A5B00] font-bold text-xs flex items-center gap-2">
                                        <HardDrive className="w-3.5 h-3.5 text-[#CC6F00]" />
                                        <span>My Drive</span>
                                    </div>
                                    <div className="px-3 py-2 text-slate-600 text-xs font-medium flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Terbaru (Recent)</span>
                                    </div>
                                    <div className="px-3 py-2 text-slate-600 text-xs font-medium flex items-center gap-2">
                                        <History className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Riwayat Versi</span>
                                    </div>
                                    <div className="px-3 py-2 text-slate-600 text-xs font-medium flex items-center gap-2">
                                        <Activity className="w-3.5 h-3.5 text-[#CC6F00]" />
                                        <span>Log Aktivitas</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200/70 space-y-2">
                                    <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                                        <span>Kapasitas Cloud</span>
                                        <span className="font-bold text-slate-900">24.5%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                                        <div className="w-[45%] h-full bg-[#F2A900]" />
                                        <div className="w-[30%] h-full bg-blue-500" />
                                        <div className="w-[15%] h-full bg-purple-500" />
                                    </div>
                                    <p className="text-[10px] text-slate-400">1.22 GB dari 5.00 GB terpakai</p>
                                </div>
                            </div>

                            {/* Main Explorer View */}
                            <div className="col-span-1 md:col-span-9 p-5 sm:p-6 space-y-5">
                                {/* Top Toolbar */}
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                        <span>Drive Utama</span>
                                        <span className="text-slate-300">/</span>
                                        <span className="text-[#CC6F00]">Dokumen Kerja</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                                            ● Tersinkron Real-time
                                        </span>
                                    </div>
                                </div>

                                {/* Folder Grid */}
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                                        Folder Utama (3)
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 hover:border-[#F2A900] transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-[#CC6F00]">
                                                <Folder className="w-4 h-4 fill-[#F2A900]" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-slate-800 truncate">Laporan Keuangan</p>
                                                <p className="text-[10px] text-slate-400">14 Berkas</p>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 hover:border-blue-400 transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                                <Folder className="w-4 h-4 fill-blue-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-slate-800 truncate">Desain & Media</p>
                                                <p className="text-[10px] text-slate-400">28 Berkas</p>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 hover:border-purple-400 transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                                                <Folder className="w-4 h-4 fill-purple-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-slate-800 truncate">Arsip Cadangan</p>
                                                <p className="text-[10px] text-slate-400">9 Berkas</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* File Items Cards */}
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                                        Berkas Terbaru
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold text-[10px]">
                                                    PDF
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 truncate">Proposal_Final_Proyek.pdf</p>
                                                    <p className="text-[11px] text-slate-400 flex items-center gap-2">
                                                        <span>2.4 MB</span>
                                                        <span>•</span>
                                                        <span className="text-purple-600 font-semibold flex items-center gap-0.5">
                                                            <History className="w-2.5 h-2.5" /> v3 Aktif
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                                Editor
                                            </span>
                                        </div>

                                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-[10px]">
                                                    PNG
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 truncate">Mockup_Design_Vite.png</p>
                                                    <p className="text-[11px] text-slate-400">4.8 MB • Hari ini</p>
                                                </div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                                Viewer
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Simulated Active Upload Dock */}
                                <div className="p-3 rounded-2xl bg-white border-2 border-[#F2A900] shadow-lg shadow-amber-500/10 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-1.5 rounded-lg bg-[#FEF9EC] text-[#CC6F00]">
                                            <UploadCloud className="w-4 h-4 animate-bounce" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 truncate">Mengunggah: Video_Dokumentasi_4K.mp4</p>
                                            <p className="text-[10px] text-slate-500">18.4 MB / 22.0 MB • Kecepatan tinggi (Lokal)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold text-[#CC6F00]">84%</span>
                                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                            <div className="w-[84%] h-full bg-[#F2A900] rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Strip */}
                <div className="mt-20 py-8 px-6 rounded-3xl bg-slate-50/80 border border-slate-200/80 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">100%</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">Privat Tanpa Sensor Pihak Luar</p>
                    </div>
                    <div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">&lt; 0.1 ms</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">Latensi Server Lokal / Mandiri</p>
                    </div>
                    <div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">Viewer &amp; Editor</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">Izin Berbagi Kolaboratif</p>
                    </div>
                    <div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">Multi-Version</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">Pemulihan Riwayat Berkas Aman</p>
                    </div>
                </div>

                {/* Features Bento Grid Section */}
                <section id="features" className="mt-28">
                    <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                        <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#FEF9EC] text-[#CC6F00] border border-[#F2A900]/30 uppercase tracking-wider">
                            Fitur Lengkap Generasi Baru
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                            Semua yang Anda Butuhkan untuk Mengelola Berkas
                        </h2>
                        <p className="text-slate-600 text-sm">
                            Dibangun dengan standar keamanan modern, privasi total, dan kecepatan eksekusi tinggi.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        {/* 1. File Sharing (Viewer & Editor) */}
                        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 hover:border-[#F2A900] hover:shadow-xl transition-all shadow-xs group">
                            <div className="w-12 h-12 rounded-2xl bg-[#FEF9EC] border border-[#F2A900]/20 text-[#CC6F00] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <Share2 className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Izin Fleksibel
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">File Sharing (Viewer &amp; Editor)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Bagikan tautan ke rekan dengan izin akses <strong>Viewer</strong> (hanya melihat/mengunduh) atau <strong>Editor</strong> (dapat mengunggah revisi berkas baru). Dilindungi password dan tanggal kedaluwarsa.
                            </p>
                        </div>

                        {/* 2. Version History */}
                        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 hover:border-[#F2A900] hover:shadow-xl transition-all shadow-xs group">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200/60 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <History className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                    Riwayat Revisi
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Version History &amp; Pemulihan</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Lacak setiap kali berkas diperbarui (v1, v2, v3...) lengkap dengan catatan revisi, pembuat, dan ukuran. Pulihkan versi sebelumnya kapan saja tanpa pernah kehilangan berkas saat ini.
                            </p>
                        </div>

                        {/* 3. Activity Log */}
                        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 hover:border-[#F2A900] hover:shadow-xl transition-all shadow-xs group">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Audit Trail
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Activity Log (Pantau Aktivitas)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Pantau seluruh riwayat aktivitas akun secara kronologis: upload berkas, buat folder, hapus ke tempat sampah, pemulihan, hingga pembuatan tautan berbagi.
                            </p>
                        </div>

                        {/* 4. Instant Multi-Format Preview */}
                        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 hover:border-[#F2A900] hover:shadow-xl transition-all shadow-xs group">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <Eye className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                    Tanpa Unduh
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">File Preview Multi-Format</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Buka pratinjau instan langsung di peramban untuk dokumen PDF, gambar resolusi tinggi, video HTML5, audio player, serta editor teks/kode (JS, PHP, TXT, JSON, MD).
                            </p>
                        </div>

                        {/* 5. Upload Manager Drag & Drop */}
                        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 hover:border-[#F2A900] hover:shadow-xl transition-all shadow-xs group">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 text-[#CC6F00] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Real-time Dock
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Upload Manager Canggih</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Cukup seret & letakkan (drag and drop) berkas ke browser. Dilengkapi progress dock mengambang dengan persentase real-time dan tombol pembatalan upload sewaktu-waktu.
                            </p>
                        </div>

                        {/* 6. Folder Hierarki & Unduh ZIP */}
                        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 hover:border-[#F2A900] hover:shadow-xl transition-all shadow-xs group">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <Archive className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                    Otomatisasi ZIP
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Folder Hirarkis &amp; Unduh ZIP</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Susun folder bertingkat dengan penanda warna kustom dan navigasi remah roti (*breadcrumbs*). Unduh seluruh isi folder dalam kemasan arsip .ZIP otomatis dengan 1 klik.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Bottom Call to Action Card */}
                <div className="mt-28 relative rounded-3xl overflow-hidden p-8 sm:p-12 text-center bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#F2A900]/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#F2A900] text-xs font-semibold backdrop-blur-xs">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Akses Privat Dikelola Penuh Administrator</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            Siap Mengamankan Seluruh Berkas Penting Anda?
                        </h2>

                        <p className="text-sm sm:text-base text-slate-300">
                            Nikmati kebebasan penyimpanan data pribadi berkecepatan tinggi tanpa khawatir kebocoran data atau batasan langganan komersial.
                        </p>

                        <div className="pt-2">
                            {auth.user ? (
                                <Link
                                    href={route('drive.index')}
                                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-slate-950 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white transition-all shadow-xl shadow-[#F2A900]/30"
                                >
                                    <span>Masuk ke Dashboard Drive</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-slate-950 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white transition-all shadow-xl shadow-[#F2A900]/30"
                                >
                                    <span>Mulai Sekarang — Masuk ke Akun</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative border-t border-slate-100 py-8 bg-slate-50/50">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                        <ApplicationLogo />
                    </div>
                    <p>&copy; {new Date().getFullYear()} CloudVault. Private Enterprise Cloud Storage Solution.</p>
                </div>
            </footer>
        </div>
    );
}
