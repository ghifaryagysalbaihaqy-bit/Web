import React, { useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { MessageSquare, Copy, Check, ExternalLink, Link2 } from 'lucide-react';
import { PageProps } from '@/types';

export default function WhatsAppIntegrationForm({ className = '' }: { className?: string }) {
    const user = usePage<PageProps>().props.auth.user;
    const [copied, setCopied] = useState(false);

    const token = user?.webhook_token || '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const webhookUrl = `${origin}/api/v1/inbound/${token}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section className={className}>
            <header className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-sm">
                    <MessageSquare className="w-5 h-5 fill-white" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span>Integrasi WhatsApp & Webhook</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#25D366]/15 text-[#075E54] dark:text-[#25D366]">
                            Aktif
                        </span>
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                        Hubungkan bot WhatsApp, Apple Shortcuts, atau aplikasi luar untuk menyimpan foto secara otomatis ke CloudVault.
                    </p>
                </div>
            </header>

            <div className="mt-5 space-y-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        URL Webhook Pribadi Anda
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            readOnly
                            value={webhookUrl}
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-xs font-mono select-all focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1EBE5D] transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                        >
                            {copied ? (
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
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span>Folder Tujuan Otomatis:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">WhatsApp Media</strong>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Status Layanan:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Siap Menerima Foto</span>
                        </span>
                    </div>
                </div>

                <div className="pt-2">
                    <Link
                        href={route('drive.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CC6F00] hover:underline"
                    >
                        <span>Buka Drive & Uji Coba WhatsApp di Sidebar Drive</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
