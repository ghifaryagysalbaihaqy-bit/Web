import { HTMLAttributes } from 'react';
import { Cloud } from 'lucide-react';

interface ApplicationLogoProps extends HTMLAttributes<HTMLDivElement> {
    isDark?: boolean;
}

export default function ApplicationLogo({ isDark = false, className = '', ...props }: ApplicationLogoProps) {
    return (
        <div className={`flex items-center gap-2.5 select-none ${className}`} {...props}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] via-[#F2A900] to-[#D97706] flex items-center justify-center text-white shadow-xs shrink-0">
                <Cloud className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div className="flex items-center tracking-tight leading-none whitespace-nowrap">
                <span className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    CloudVault
                </span>
                <span className={`font-medium text-base ml-1.5 ${isDark ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>
                    Storage
                </span>
            </div>
        </div>
    );
}
