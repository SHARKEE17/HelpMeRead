import React from 'react';
import { Section } from '../../types/semantic';
import { BlockRenderer } from './BlockRenderer';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface SectionProps {
    section: Section;
    defaultExpanded?: boolean;
}

export const SectionRenderer: React.FC<SectionProps> = ({ section }) => {
    // Kindle style: Continuous scrolling, no collapse.
    return (
        <section id={section.id}>
            {!section.is_implicit && (
                <h2 className="reader-h2">
                    {section.title}
                </h2>
            )}

            <div>
                {section.blocks.map((block) => (
                    <BlockRenderer key={block.id} block={block} />
                ))}
            </div>
        </section>
    );
};
