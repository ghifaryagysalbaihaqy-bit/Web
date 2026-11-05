import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Users,
    UserPlus,
    Shield,
    Trash2,
    Edit3,
    X,
    CheckCircle,
    AlertCircle,
    AlertTriangle
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';

interface ManagedUser {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    storage_limit_bytes: number;
    storage_limit_gb: number;
    storage_used_bytes: number;
    storage_used_formatted: string;
    storage_limit_formatted: string;
    storage_percentage: number;
    files_count: number;
    folders_count: number;
    created_at: string;
}

interface AdminUsersProps extends PageProps {
    users: ManagedUser[];
}

export default function AdminUsers({ auth, users, flash }: AdminUsersProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        user: ManagedUser | null;
    }>({
        isOpen: false,
        user: null,
    });

    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        storage_limit_gb: '5',
        is_admin: false,
    });

    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        storage_limit_gb: '5',
        is_admin: false,
    });

    const handleOpenEdit = (user: ManagedUser) => {
        setEditingUser(user);
        editForm.setData({
            name: user.name,
            email: user.email,
            password: '',
            storage_limit_gb: String(user.storage_limit_gb),
            is_admin: user.is_admin,
        });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.users.store'), {
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        editForm.patch(route('admin.users.update', editingUser.id), {
            onSuccess: () => {
                setEditingUser(null);
                editForm.reset();
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!deleteModal.user) return;
        router.delete(route('admin.users.destroy', deleteModal.user.id), {
            onSuccess: () => setDeleteModal({ isOpen: false, user: null }),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-poppins">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-[#FEF9EC] dark:bg-[#4D2A00]/40 text-[#CC6F00] border border-[#F2A900]/30 shadow-xs">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                Manajemen Pengguna Cloud
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Hanya Administrator yang memiliki hak akses untuk menambah dan mengelola akun pengguna.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-900 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white shadow-sm transition-all"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Tambah Pengguna</span>
                    </button>
                </div>
            }
        >
            <Head title="Manajemen Pengguna - Admin" />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-poppins">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-xs">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center gap-2 shadow-xs">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Users Table */}
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar bg-white dark:bg-slate-900 shadow-xs">
                    <table className="w-full min-w-[640px] sm:min-w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-800/40">
                                <th className="py-3.5 px-6">Pengguna</th>
                                <th className="py-3.5 px-6">Hak Akses</th>
                                <th className="py-3.5 px-6">Kapasitas Kuota</th>
                                <th className="py-3.5 px-6 hidden sm:table-cell">Berkas & Folder</th>
                                <th className="py-3.5 px-6 hidden md:table-cell">Tanggal Terdaftar</th>
                                <th className="py-3.5 px-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                            {users.map((u) => {
                                const isCurrentUser = u.id === auth.user.id;

                                return (
                                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F2A900] to-[#CC6F00] text-slate-900 font-bold flex items-center justify-center shrink-0 shadow-xs text-sm">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                                                            {u.name}
                                                        </span>
                                                        {isCurrentUser && (
                                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-[#FEF9EC] text-[#9A5B00] border border-[#F2A900]/40">
                                                                Anda
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-6">
                                            {u.is_admin ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF9EC] dark:bg-amber-950/40 text-[#9A5B00] dark:text-amber-300 border border-[#F2A900]/30">
                                                    <Shield className="w-3.5 h-3.5 text-[#CC6F00]" />
                                                    <span>Admin</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
                                                    Pengguna
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-4 px-6">
                                            <div className="space-y-1.5 max-w-xs">
                                                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                                                    <span>{u.storage_used_formatted}</span>
                                                    <span className="text-[#9A5B00] dark:text-amber-400 font-semibold">{u.storage_limit_formatted} ({u.storage_percentage}%)</span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${
                                                            u.storage_percentage > 90
                                                                ? 'bg-red-500'
                                                                : 'bg-gradient-to-r from-[#F2A900] to-[#CC6F00]'
                                                        }`}
                                                        style={{ width: `${u.storage_percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell font-medium">
                                            {u.files_count} berkas • {u.folders_count} folder
                                        </td>

                                        <td className="py-4 px-6 text-xs text-slate-400 dark:text-slate-500 hidden md:table-cell">
                                            {u.created_at}
                                        </td>

                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(u)}
                                                    className="p-1.5 rounded-xl text-slate-400 hover:text-[#CC6F00] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                    title="Edit Pengguna"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>

                                                {!isCurrentUser && (
                                                    <button
                                                        onClick={() => setDeleteModal({ isOpen: true, user: u })}
                                                        className="p-1.5 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                        title="Hapus Pengguna"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE USER MODAL */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in font-poppins">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 font-bold text-lg">
                                <div className="p-2 rounded-xl bg-[#FEF9EC] dark:bg-[#4D2A00]/40 text-[#CC6F00] border border-[#F2A900]/30">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <span>Tambah Pengguna Baru</span>
                            </div>
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="Contoh: Rian Pratama"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#F2A900]/40 focus:border-[#CC6F00] focus:outline-none transition-colors"
                                />
                                {createForm.errors.name && (
                                    <p className="text-xs text-red-500 mt-1">{createForm.errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                    Alamat Email
                                </label>
                                <input
                                    type="email"
                                    value={createForm.data.email}
                                    onChange={(e) => createForm.setData('email', e.target.value)}
                                    placeholder="rian@example.com"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#F2A900]/40 focus:border-[#CC6F00] focus:outline-none transition-colors"
                                />
                                {createForm.errors.email && (
                                    <p className="text-xs text-red-500 mt-1">{createForm.errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                    Password Awal
                                </label>
                                <input
                                    type="password"
                                    value={createForm.data.password}
                                    onChange={(e) => createForm.setData('password', e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#F2A900]/40 focus:border-[#CC6F00] focus:outline-none transition-colors"
                                />
                                {createForm.errors.password && (
                                    <p className="text-xs text-red-500 mt-1">{createForm.errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                    Batas Kuota Penyimpanan (GB)
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.1"
                                    max="5000"
                                    value={createForm.data.storage_limit_gb}
                                    onChange={(e) => createForm.setData('storage_limit_gb', e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#F2A900]/40 focus:border-[#CC6F00] focus:outline-none transition-colors"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">Default: 5 GB (dapat disesuaikan sesuai kebutuhan)</p>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="create_is_admin"
                                    checked={createForm.data.is_admin}
                                    onChange={(e) => createForm.setData('is_admin', e.target.checked)}
                                    className="rounded border-slate-300 text-[#CC6F00] focus:ring-[#F2A900] w-4 h-4"
                                />
                                <label htmlFor="create_is_admin" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Jadikan pengguna ini sebagai Administrator
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white disabled:opacity-50 transition-all shadow-sm"
                                >
                                    {createForm.processing ? 'Menyimpan...' : 'Simpan Pengguna'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT USER MODAL */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in font-poppins">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 font-bold text-lg">
                                <div className="p-2 rounded-xl bg-[#FEF9EC] dark:bg-[#4D2A00]/40 text-[#CC6F00] border border-[#F2A900]/30">
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <span>Edit Pengguna</span>
                            </div>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#F2A900]/40 focus:border-[#CC6F00] focus:outline-none transition-colors"
                                />
                                {editForm.errors.name && (
                                    <p className="text-xs text-red-500 mt-1">{editForm.errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                    Alamat Email
                                </label>
                                <input
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#F2A900]/40 focus:border-[#CC6F00] focus:outline-none transition-colors"
                                />
                                {editForm.errors.email && (
                                    <p className="text-xs text-red-500 mt-1">{editForm.errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                    Ganti Password (Opsional)
                                </label>
                                <input
                                    type="password"
                                    value={editForm.data.password}
                                    onChange={(e) => editForm.setData('password', e.target.value)}
                                    placeholder="Kosongkan jika tidak ingin mengubah password"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#F2A900]/40 focus:border-[#CC6F00] focus:outline-none transition-colors"
                                />
                                {editForm.errors.password && (
                                    <p className="text-xs text-red-500 mt-1">{editForm.errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                    Batas Kuota Penyimpanan (GB)
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.1"
                                    max="5000"
                                    value={editForm.data.storage_limit_gb}
                                    onChange={(e) => editForm.setData('storage_limit_gb', e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#F2A900]/40 focus:border-[#CC6F00] focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="edit_is_admin"
                                    checked={editForm.data.is_admin}
                                    onChange={(e) => editForm.setData('is_admin', e.target.checked)}
                                    className="rounded border-slate-300 text-[#CC6F00] focus:ring-[#F2A900] w-4 h-4"
                                />
                                <label htmlFor="edit_is_admin" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Hak Akses Administrator
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-[#F2A900] hover:bg-[#CC6F00] hover:text-white disabled:opacity-50 transition-all shadow-sm"
                                >
                                    {editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE USER MODAL */}
            {deleteModal.isOpen && deleteModal.user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in font-poppins">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400 font-bold text-lg pb-3">
                            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <span>Hapus Akun Pengguna?</span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 mb-6 leading-relaxed">
                            Apakah Anda yakin ingin menghapus akun <strong>{deleteModal.user.name}</strong> ({deleteModal.user.email})?
                            <br />
                            <span className="text-red-600 font-semibold text-xs mt-2 block">
                                Peringatan: Seluruh {deleteModal.user.files_count} berkas dan {deleteModal.user.folders_count} folder milik pengguna ini di server akan dihapus permanen!
                            </span>
                        </p>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteModal({ isOpen: false, user: null })}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                            >
                                Hapus Pengguna
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
