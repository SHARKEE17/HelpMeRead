import React from 'react';
import { Block } from '../../types/semantic';
import { MathRenderer } from './MathRenderer';
import { TableRenderer } from './TableRenderer';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface BlockProps {
    block: Block;
}

// Renders inline markdown: bold, italic, links, math — without wrapping in a <p>
const mdComponents = {
    p: ({ children }: any) => <>{children}</>,
    a: ({ href, children }: any) => (
        <a href={href} className="reader-a" target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    ),
};

const InlineContent: React.FC<{ content: string }> = ({ content }) => (
    <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={mdComponents as any}
    >
        {content.replace(/\n/g, '  \n')}
    </ReactMarkdown>
);

export const BlockRenderer: React.FC<BlockProps> = ({ block }) => {
    switch (block.type) {
        case 'heading': {
            const level = block.attrs?.level || 1;
            const Tag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
            const className = `reader-h${Math.min(level, 4)}`;
            return (
                <Tag className={`${className} scroll-mt-20`} id={block.id} data-block-id={block.id}>
                    {block.content as string}
                </Tag>
            );
        }

        case 'paragraph':
            return (
                <p className="reader-p" id={block.id} data-block-id={block.id}>
                    <InlineContent content={block.content as string} />
                </p>
            );

        case 'caption':
            return (
                <p className="reader-caption" id={block.id} data-block-id={block.id}>
                    <InlineContent content={block.content as string} />
                </p>
            );

        case 'list': {
            const isOrdered = block.attrs?.style === 'ordered';
            const ListTag = isOrdered ? 'ol' : 'ul';
            const items = block.content as string[];
            return (
                <ListTag className={`reader-list ${isOrdered ? 'list-decimal' : 'list-disc'}`} id={block.id} data-block-id={block.id}>
                    {items.map((item, idx) => (
                        <li key={idx} className="reader-li">
                            <InlineContent content={item} />
                        </li>
                    ))}
                </ListTag>
            );
        }

        case 'code':
            return (
                <div className="reader-pre" id={block.id} data-block-id={block.id}>
                    <code className="reader-code">
                        {block.content as string}
                    </code>
                </div>
            );

        case 'quote':
            return (
                <blockquote className="reader-blockquote" id={block.id} data-block-id={block.id}>
                    <InlineContent content={block.content as string} />
                </blockquote>
            );

        case 'image':
            return (
                <figure className="my-10 text-center" id={block.id} data-block-id={block.id}>
                    <img
                        src={block.attrs?.src}
                        alt={block.content as string}
                        className="block mx-auto max-w-full h-auto rounded-sm"
                        loading="lazy"
                    />
                    {block.content && (
                        <figcaption className="text-center text-sm text-gray-500 mt-3 italic font-sans">
                            {block.content as string}
                        </figcaption>
                    )}
                </figure>
            );

        case 'table':
            return <TableRenderer block={block} />;

        case 'math':
            return (
                <div className="math-block" id={block.id} data-block-id={block.id}>
                    <MathRenderer content={block.content as string} block={true} />
                </div>
            );

        default:
            console.warn('Unknown block type:', block.type);
            return null;
    }
};
