import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded-md border-slate-300 dark:border-slate-700 text-[#CC6F00] shadow-xs focus:ring-[#F2A900] dark:bg-slate-900 ' +
                className
            }
        />
    );
}
