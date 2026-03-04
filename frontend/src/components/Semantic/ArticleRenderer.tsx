import React from 'react';
import { SemanticDocument } from '../../types/semantic';
import { SectionRenderer } from './SectionRenderer';
import './reader.css';

interface DocumentReaderProps {
    document: SemanticDocument;
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({ document }) => {
    const cleanTitle = (title: string) => {
        // Remove .pdf extension
        let cleaned = title.replace(/\.pdf$/i, '');
        // Remove trailing ID (underscore + alphanumeric at end)
        cleaned = cleaned.replace(/_[a-zA-Z0-9]{5,}$/, '');
        // Replace underscores with spaces
        cleaned = cleaned.replace(/_/g, ' ');
        return cleaned;
    };

    return (
        <article className="reader-container reader-body">
            <header>
                <h1 className="reader-h1">
                    {cleanTitle(document.title)}
                </h1>
                {/* Metadata removed as per user request */}
            </header>

            <main>
                {document.sections && document.sections.length > 0 ? (
                    document.sections.map((section) => (
                        <SectionRenderer key={section.id} section={section} />
                    ))
                ) : (
                    <div className="text-center text-gray-500 mt-20">No content available.</div>
                )}
            </main>

            <footer className="mt-24 pt-12 border-t border-gray-100 text-center text-gray-400 font-sans text-sm pb-12">
                <p>End of Document</p>
            </footer>
        </article>
    );
};
