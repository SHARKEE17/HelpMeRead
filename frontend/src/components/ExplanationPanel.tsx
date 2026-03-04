
import React from 'react';
import { Box, Typography, IconButton, CircularProgress, Paper, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

interface ExplanationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    content: string | null;
    error: string | null;
}

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ isOpen, onClose, isLoading, content, error }) => {
    if (!isOpen) return null;

    return (
        <Paper
            elevation={3}
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: '40vh',
                bgcolor: 'background.paper',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                boxShadow: '0px -4px 12px rgba(0,0,0,0.1)',
                zIndex: 1300,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'transform 0.3s ease-in-out',
                transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoFixHighIcon />
                    <Typography variant="subtitle1" fontWeight="bold">
                        Teacher says...
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <Divider />

            {/* Content Body */}
            <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, flexDirection: 'column', gap: 2 }}>
                        <CircularProgress size={30} />
                        <Typography variant="body2" color="text.secondary">
                            Consulting the teacher...
                        </Typography>
                    </Box>
                ) : error ? (
                    <Typography color="error" align="center">
                        {error}
                    </Typography>
                ) : (
                    <Typography variant="body1" sx={{ lineHeight: 1.6, fontSize: '1.1rem' }}>
                        {content}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

export default ExplanationPanel;
