import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathRendererProps {
    content: string;
    block?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, block = false }) => {
    try {
        return (
            <span className={block ? "block my-6 text-center" : "inline-math mx-1"}>
                {block ? <BlockMath math={content} /> : <InlineMath math={content} />}
            </span>
        );
    } catch (error) {
        console.error("Math rendering error:", error);
        return <span className="text-red-500 font-mono text-sm">{content}</span>;
    }
};
