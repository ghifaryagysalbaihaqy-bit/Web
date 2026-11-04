import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="relative min-h-screen flex flex-col justify-center items-center bg-white font-poppins text-slate-800 p-4 sm:p-6 overflow-hidden">
            {/* Ambient Lighting Orbs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] pointer-events-none">
                <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[400px] bg-gradient-to-b from-[#F2A900]/20 via-[#F9E6A8]/20 to-transparent blur-3xl rounded-full" />
                <div className="absolute top-20 -left-16 w-60 h-60 bg-amber-100/40 rounded-full blur-2xl" />
                <div className="absolute top-28 -right-16 w-60 h-60 bg-yellow-100/50 rounded-full blur-2xl" />
            </div>

            {/* Subtle Tech Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_35%,#000_65%,transparent_100%)] pointer-events-none opacity-60" />

            {/* Top Navigation Bar: Back Button */}
            <div className="relative w-full max-w-md mb-6 flex items-center justify-between z-10">
                <Link
                    href="/"
                    className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/90 hover:bg-slate-50 border border-slate-200/80 shadow-xs transition-all backdrop-blur-xs"
                    title="Kembali ke halaman utama"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-[#CC6F00]" />
                    <span>Kembali ke Beranda</span>
                </Link>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Server Aman</span>
                </div>
            </div>

            {/* Logo */}
            <div className="relative mb-5 z-10">
                <Link href="/" className="inline-block transition-transform hover:scale-105 duration-200">
                    <ApplicationLogo />
                </Link>
            </div>

            {/* Card Form */}
            <div className="relative w-full sm:max-w-md bg-white/95 backdrop-blur-md p-7 sm:p-9 shadow-2xl shadow-slate-300/60 border border-slate-200/90 rounded-3xl z-10 ring-1 ring-slate-900/5">
                {children}
            </div>

            {/* Footnote */}
            <div className="relative mt-8 text-center text-xs text-slate-400 font-medium z-10 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>CloudVault Enterprise • Private Cloud Infrastructure</span>
            </div>
        </div>
    );
}
