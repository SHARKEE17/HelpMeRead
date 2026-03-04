export interface ReadingUnit {
    unit_id: number;
    heading?: string;
    content: string | string[];
}

export interface ReadingContent {
    title: string;
    readingUnits: ReadingUnit[];
}

export type ReaderTheme = 'light' | 'dark' | 'sepia';

export interface ReaderState {
    currentUnitIndex: number;
    fontSize: number;
    theme: ReaderTheme;
    isLoading: boolean;
    error: string | null;
    documentTitle: string;
    units: ReadingUnit[];
}

export interface ReaderContextType extends ReaderState {
    nextPage: () => void;
    prevPage: () => void;
    jumpTo: (index: number) => void;
    setFontSize: (size: number) => void;
    setTheme: (theme: ReaderTheme) => void;
    setData: (data: any) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}
