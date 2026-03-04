import React, { createContext, useContext, useState, useEffect } from 'react';
import { ReaderContextType, ReaderTheme, ReadingUnit } from './types';

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export const useReader = () => {
    const context = useContext(ReaderContext);
    if (!context) {
        throw new Error('useReader must be used within a ReaderProvider');
    }
    return context;
};

export const ReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
    const [fontSize, setFontSize] = useState(18); // Default font size
    const [theme, setTheme] = useState<ReaderTheme>('light');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [documentTitle, setDocumentTitle] = useState('');
    const [units, setUnits] = useState<ReadingUnit[]>([]);

    const nextPage = () => {
        if (currentUnitIndex < units.length - 1) {
            setCurrentUnitIndex(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const prevPage = () => {
        if (currentUnitIndex > 0) {
            setCurrentUnitIndex(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    const jumpTo = (index: number) => {
        if (index >= 0 && index < units.length) {
            setCurrentUnitIndex(index);
            window.scrollTo(0, 0);
        }
    };

    const setData = (data: any) => {
        if (data.title) setDocumentTitle(data.title);

        // Handle different data structures for backward compatibility
        const contentObj = data.processedContent || data.processed_content;
        const rawUnits = contentObj?.readingUnits || contentObj?.reading_units;
        const pages = contentObj?.pages;

        if (rawUnits && Array.isArray(rawUnits)) {
            setUnits(rawUnits);
        } else if (pages && Array.isArray(pages)) {
            // Convert old pages format to units
            const convertedUnits = pages.map((p: any, idx: number) => ({
                unit_id: idx,
                heading: p.title,
                content: p.content
            }));
            setUnits(convertedUnits);
        } else {
            // Fallback for raw text
            setUnits([{
                unit_id: 0,
                heading: "Document Content",
                content: "Could not parse document structure."
            }]);
        }
        setIsLoading(false);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentUnitIndex, units.length]);

    return (
        <ReaderContext.Provider value={{
            currentUnitIndex,
            fontSize,
            theme,
            isLoading,
            error,
            documentTitle,
            units,
            nextPage,
            prevPage,
            jumpTo,
            setFontSize,
            setTheme,
            setData,
            setLoading: setIsLoading,
            setError
        }}>
            {children}
        </ReaderContext.Provider>
    );
};
