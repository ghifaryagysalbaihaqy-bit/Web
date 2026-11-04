import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Poppins', ...defaultTheme.fontFamily.sans],
                poppins: ['Poppins', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    50: '#FDFBF4',
                    100: '#FAF4E1',
                    200: '#F9E6A8', // F9E6A8
                    300: '#F6CD62',
                    400: '#F4BA28',
                    500: '#F2A900', // F2A900
                    600: '#CC6F00', // CC6F00
                    700: '#A35300',
                    800: '#7A3B00',
                    900: '#4D2A00', // 4D2A00
                    950: '#2E1900',
                    light: '#F9E6A8',
                    primary: '#F2A900',
                    deep: '#CC6F00',
                    dark: '#4D2A00',
                },
            },
        },
    },

    plugins: [forms],
};
