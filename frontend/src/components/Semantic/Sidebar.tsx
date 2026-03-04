import React from 'react';
import { Section } from '../../types/semantic';
import { AlignLeft } from 'lucide-react';

interface SidebarProps {
    sections: Section[];
}

export const Sidebar: React.FC<SidebarProps> = ({ sections }) => {
    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <nav className="w-64 h-screen sticky top-0 border-r border-gray-200 bg-gray-50/50 p-6 overflow-y-auto hidden lg:block">
            <div className="flex items-center space-x-2 mb-8 text-gray-500 uppercase text-xs font-bold tracking-wider">
                <AlignLeft size={16} />
                <span>Contents</span>
            </div>

            <ul className="space-y-1">
                {sections.map((section) => (
                    <li key={section.id}>
                        <button
                            onClick={() => scrollToSection(section.id)}
                            className="text-left w-full px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-white hover:text-primary-600 hover:shadow-sm transition-all truncate"
                            title={section.title}
                        >
                            <span className="mr-2 opacity-50 text-xs">#</span>
                            {section.title}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};
