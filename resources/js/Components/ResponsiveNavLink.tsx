import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active?: boolean }) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 text-base font-medium transition duration-150 ease-in-out focus:outline-none ${
                active
                    ? 'border-[#CC6F00] bg-[#FDF8EC] text-slate-900 font-semibold dark:border-[#F2A900] dark:bg-slate-800 dark:text-slate-100'
                    : 'border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            } ${className}`}
        >
            {children}
        </Link>
    );
}
