import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';
import { Shield } from 'lucide-react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="relative min-h-screen bg-[#F8FAFC] text-slate-800 font-poppins selection:bg-[#F2A900]/30 selection:text-slate-900 overflow-x-clip">
            {/* Ambient Subtle Background Elements */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                {/* Soft warm amber glow near top right */}
                <div className="absolute -top-32 right-1/4 w-[600px] h-[400px] bg-gradient-to-br from-amber-200/25 via-amber-100/15 to-transparent blur-3xl rounded-full" />
                {/* Soft slate-amber glow near top left */}
                <div className="absolute top-10 -left-20 w-[480px] h-[360px] bg-gradient-to-tr from-slate-200/40 via-amber-100/10 to-transparent blur-3xl rounded-full" />
                {/* Ultra subtle engineering dot grid with radial fade mask */}
                <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_15%,#000_65%,transparent_100%)] opacity-30" />
            </div>

            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <div className="flex items-center">
                            <div className="flex shrink-0 items-center">
                                <Link href={route('drive.index')}>
                                    <ApplicationLogo />
                                </Link>
                            </div>

                            <div className="hidden space-x-6 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink
                                    href={route('drive.index')}
                                    active={route().current('drive.index')}
                                >
                                    Cloud Drive
                                </NavLink>

                                {user.is_admin && (
                                    <NavLink
                                        href={route('admin.users.index')}
                                        active={route().current('admin.users.*')}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Shield className="w-4 h-4 text-[#CC6F00]" />
                                            <span>Kelola Pengguna</span>
                                        </div>
                                    </NavLink>
                                )}
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center gap-3">
                            {user.is_admin && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FEF9EC] text-[#9A5B00] border border-[#F2A900]/30">
                                    <Shield className="w-3.5 h-3.5 text-[#CC6F00]" />
                                    <span>Administrator</span>
                                </span>
                            )}

                            <div className="relative ms-1">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-xl">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition duration-150 ease-in-out hover:border-slate-300 hover:bg-slate-50 focus:outline-none shadow-xs"
                                            >
                                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#F2A900] to-[#CC6F00] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="max-w-[130px] truncate">{user.name}</span>

                                                <svg
                                                    className="h-3.5 w-3.5 text-slate-400"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('profile.edit')}>
                                            Profil Saya
                                        </Dropdown.Link>
                                        {user.is_admin && (
                                            <Dropdown.Link href={route('admin.users.index')}>
                                                Kelola Pengguna
                                            </Dropdown.Link>
                                        )}
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Keluar (Log Out)
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Hamburger */}
                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Responsive Navigation Menu */}
                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden border-t border-slate-200 bg-white'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route('drive.index')}
                            active={route().current('drive.index')}
                        >
                            Cloud Drive
                        </ResponsiveNavLink>

                        {user.is_admin && (
                            <ResponsiveNavLink
                                href={route('admin.users.index')}
                                active={route().current('admin.users.*')}
                            >
                                Kelola Pengguna
                            </ResponsiveNavLink>
                        )}
                    </div>

                    <div className="border-t border-slate-200 pb-1 pt-4 px-4">
                        <div className="text-sm font-semibold text-slate-800">
                            {user.name}
                        </div>
                        <div className="text-xs text-slate-500">{user.email}</div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Profil Saya
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Keluar
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white/70 backdrop-blur-md border-b border-slate-200/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
                    <div className="mx-auto max-w-full px-4 py-3 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main className="relative">{children}</main>
        </div>
    );
}
