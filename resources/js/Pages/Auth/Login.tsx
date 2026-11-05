import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Lock, Mail, ArrowLeft, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head>
                <title>Masuk ke CloudVault - Cloud Storage Mandiri</title>
                <meta
                    name="description"
                    content="Masuk ke akun CloudVault Anda untuk mengelola berkas, folder hirarkis, dan dokumen pribadi secara aman."
                />
            </Head>

            {/* Header Badge & Title */}
            <div className="mb-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FEF9EC] to-amber-100/90 border border-[#F2A900]/30 text-[#CC6F00] flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Lock className="w-5 h-5 text-[#CC6F00]" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Selamat Datang Kembali</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                    Masuk dengan akun yang telah didaftarkan Administrator.
                </p>
            </div>

            {status && (
                <div className="mb-4 text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{status}</span>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4 font-poppins">
                {/* Email Field with Icon */}
                <div>
                    <InputLabel htmlFor="email" value="Alamat Email" className="text-xs font-semibold text-slate-700 mb-1" />

                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4" />
                        </div>
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border-slate-300 focus:border-[#CC6F00] focus:ring-[#F2A900]/40 text-xs"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="nama@perusahaan.com"
                            required
                        />
                    </div>

                    <InputError message={errors.email} className="mt-1.5 text-xs font-medium" />
                </div>

                {/* Password Field with Icon & Eye Toggle */}
                <div>
                    <InputLabel htmlFor="password" value="Kata Sandi (Password)" className="text-xs font-semibold text-slate-700 mb-1" />

                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                        </div>
                        <TextInput
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="block w-full pl-10 pr-10 py-2.5 rounded-xl border-slate-300 focus:border-[#CC6F00] focus:ring-[#F2A900]/40 text-xs"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                            tabIndex={-1}
                            title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <InputError message={errors.password} className="mt-1.5 text-xs font-medium" />
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center cursor-pointer select-none">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData(
                                    'remember',
                                    (e.target.checked || false) as false,
                                )
                            }
                        />
                        <span className="ms-2 text-xs font-medium text-slate-600">
                            Ingat sesi saya
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-xs font-semibold text-[#CC6F00] hover:text-[#9A5B00] hover:underline transition-colors"
                        >
                            Lupa password?
                        </Link>
                    )}
                </div>

                {/* Action Buttons: Submit & Cancel */}
                <div className="pt-3 space-y-2.5">
                    <PrimaryButton
                        className="w-full py-3 bg-gradient-to-r from-[#F2A900] to-[#E59B00] hover:from-[#CC6F00] hover:to-[#B55F00] text-slate-950 hover:text-white shadow-lg shadow-[#F2A900]/25 transition-all text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
                        disabled={processing}
                    >
                        <LogIn className="w-4 h-4" />
                        <span>{processing ? 'Memproses Masuk...' : 'Masuk ke CloudVault'}</span>
                    </PrimaryButton>

                    {/* Dedicated Cancel / Back Button requested by user */}
                    <Link
                        href="/"
                        className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex items-center justify-center gap-1.5"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                        <span>Batal &amp; Kembali ke Halaman Utama</span>
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
