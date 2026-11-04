import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function ShareExpired() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-poppins text-slate-800">
            <Head title="Tautan Kedaluwarsa - CloudVault" />

            <div className="mb-8">
                <ApplicationLogo />
            </div>

            <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-200/80 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-2">Tautan Berbagi Telah Kedaluwarsa</h2>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed font-medium">
                    Tautan berbagi ini sudah melewati batas waktu aktif atau telah dinonaktifkan oleh pemilik berkas.
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-bold text-xs text-slate-900 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white transition-all shadow-md shadow-[#F2A900]/20"
                >
                    Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}
