export interface TableColumn {
    id: string;
    label: string;
    level: number;
}

export interface TableRow {
    id: string;
    label: string;
    level: number;
    values: string[];
}

export interface TableData {
    caption?: string;
    raw_html?: string;   // Present for complex tables (multi-level headers / colspan / rowspan)
    columns: TableColumn[];
    rows: TableRow[];
}

export interface Block {
    id: string;
    type: 'paragraph' | 'heading' | 'list' | 'code' | 'image' | 'quote' | 'table' | 'caption' | 'metadata';
    content: string | string[] | TableData; // string for most, string[] for list, TableData for table
    attrs?: Record<string, any>;
}

export interface Section {
    id: string;
    title: string;
    level: number;
    blocks: Block[];
    is_implicit?: boolean;
}

export interface SemanticDocument {
    id: string;
    title: string;
    sections: Section[];
    meta?: {
        version: string;
        generator: string;
        [key: string]: any;
    };
}
