import React from 'react';
import {
    FileText,
    Image as ImageIcon,
    Music,
    Video,
    Archive,
    Code,
    FileSpreadsheet,
    Presentation,
    BookOpen,
    File,
    Folder as FolderIcon
} from 'lucide-react';

interface FileIconProps {
    extension?: string | null;
    mimeType?: string | null;
    className?: string;
}

export function FileIcon({ extension, mimeType, className = 'w-6 h-6' }: FileIconProps) {
    const ext = (extension || '').toLowerCase();
    const mime = (mimeType || '').toLowerCase();

    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico', 'heic'].includes(ext)) {
        return <ImageIcon className={`${className} text-[#CC6F00]`} />;
    }

    if (mime === 'application/pdf' || ext === 'pdf') {
        return <FileText className={`${className} text-[#E11D48]`} />;
    }

    // Word processing documents (Word, OpenOffice, Apple Pages, WPS Writer, RTF)
    if (['doc', 'docx', 'docm', 'dot', 'dotx', 'odt', 'pages', 'rtf', 'wps'].includes(ext)) {
        return <FileText className={`${className} text-[#2563EB]`} />;
    }

    // Spreadsheets & Tabular Data (Excel, ODS, Numbers, CSV, TSV, WPS Spreadsheets)
    if (['xls', 'xlsx', 'xlsm', 'xlsb', 'xltx', 'ods', 'csv', 'tsv', 'numbers', 'et'].includes(ext)) {
        return <FileSpreadsheet className={`${className} text-[#059669]`} />;
    }

    // Presentations (PowerPoint, Keynote, ODP, WPS Presentation)
    if (['ppt', 'pptx', 'pptm', 'potx', 'ppsx', 'odp', 'key', 'dps'].includes(ext)) {
        return <Presentation className={`${className} text-[#EA580C]`} />;
    }

    // eBooks & Digital Publications
    if (['epub', 'mobi', 'djvu', 'azw', 'azw3', 'fb2', 'cbr', 'cbz'].includes(ext)) {
        return <BookOpen className={`${className} text-[#7C3AED]`} />;
    }

    // Plain text / Markdown / Notes / TeX
    if (['txt', 'text', 'md', 'markdown', 'tex', 'log'].includes(ext)) {
        return <FileText className={`${className} text-[#0284C7]`} />;
    }

    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'].includes(ext)) {
        return <Music className={`${className} text-[#9333EA]`} />;
    }

    if (mime.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv', 'flv'].includes(ext)) {
        return <Video className={`${className} text-[#F2A900]`} />;
    }

    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
        return <Archive className={`${className} text-[#D97706]`} />;
    }

    if (['js', 'ts', 'jsx', 'tsx', 'php', 'py', 'html', 'css', 'json', 'sql', 'sh', 'xml', 'yaml', 'yml'].includes(ext)) {
        return <Code className={`${className} text-[#4D2A00] dark:text-[#F9E6A8]`} />;
    }

    return <File className={`${className} text-[#4D2A00]/40`} />;
}

interface CustomFolderIconProps {
    color?: string | null;
    className?: string;
}

export function CustomFolderIcon({ color = '#F2A900', className = 'w-6 h-6' }: CustomFolderIconProps) {
    const fillColor = color || '#F2A900';
    return (
        <FolderIcon
            className={className}
            style={{
                color: fillColor,
                fill: fillColor,
                fillOpacity: 0.28,
            }}
        />
    );
}
