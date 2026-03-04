import React from 'react';
import { Box, Container, GlobalStyles } from '@mui/material';
import { useReader } from './ReaderContext';

interface LayoutProps {
    children: React.ReactNode;
}

const themeStyles = {
    light: {
        bg: '#ffffff',
        text: '#111111',
        dim: '#666666'
    },
    sepia: {
        bg: '#f4ecd8',
        text: '#5b4636',
        dim: '#7d6655'
    },
    dark: {
        bg: '#1a1a1a',
        text: '#cccccc',
        dim: '#888888'
    }
};

export const ReaderLayout: React.FC<LayoutProps> = ({ children }) => {
    const { theme } = useReader();
    const currentTheme = themeStyles[theme];

    return (
        <>
            <GlobalStyles styles={{
                body: {
                    backgroundColor: currentTheme.bg,
                    color: currentTheme.text,
                    transition: 'background-color 0.3s ease, color 0.3s ease',
                }
            }} />
            <Box sx={{
                minHeight: '100vh',
                bgcolor: currentTheme.bg,
                color: currentTheme.text,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <Container maxWidth="md" sx={{
                    flexGrow: 1,
                    py: 8,
                    maxWidth: '700px !important' // Force Kindle-like width
                }}>
                    {children}
                </Container>
            </Box>
        </>
    );
};
