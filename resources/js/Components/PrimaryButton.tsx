import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-xl border border-transparent bg-[#F2A900] hover:bg-[#CC6F00] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#4D2A00] hover:text-white transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#F2A900] shadow-md shadow-[#F2A900]/25 font-poppins ${
                    disabled ? 'opacity-40 cursor-not-allowed' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
