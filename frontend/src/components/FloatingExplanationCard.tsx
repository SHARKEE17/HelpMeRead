
import React, { useState, useEffect } from 'react';
import {
    Paper,
    Box,
    Typography,
    IconButton,
    CircularProgress,
    Fade,
    Slide,
    Collapse
} from '@mui/material';
import {
    Close as CloseIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    AutoFixHigh as MagicIcon // Using a generic 'magic' icon as a subtle cue
} from '@mui/icons-material';

interface FloatingExplanationCardProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    content: string | null;
    error: string | null;
}

const FloatingExplanationCard: React.FC<FloatingExplanationCardProps> = ({ isOpen, onClose, isLoading, content, error }) => {
    // Default state: expanded
    const [isExpanded, setIsExpanded] = useState(true);

    // Auto-expand when new content loads or panel opens
    useEffect(() => {
        if (isOpen && isLoading) {
            setIsExpanded(true);
        }
    }, [isOpen, isLoading]);

    const handleToggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
            <Paper
                elevation={0}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    width: 380, // Slightly wider for better readability
                    maxWidth: 'calc(100vw - 48px)',
                    zIndex: 1300,
                    borderRadius: 2, // 8px
                    bgcolor: '#FAFAF7', // Warm paper-like off-white
                    // Very subtle shadow
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05)',
                    border: '1px solid #E6E6E0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                }}
            >
                {/* Header - Always visible, acts as toggle */}
                <Box
                    onClick={handleToggleExpand}
                    sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{
                            color: '#3F4A5A',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            letterSpacing: '0.01em',
                            fontFamily: '"Inter", sans-serif'
                        }}>
                            Simplified!
                        </Typography>
                        {/* Minimal Icon - Subtle Gray */}
                        <MagicIcon sx={{ color: '#3F4A5A', fontSize: 18, opacity: 0.7 }} />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleToggleExpand(); }} sx={{ color: '#9CA3AF' }}>
                            {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onClose(); }} sx={{ color: '#9CA3AF' }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                {/* Collapsible Content */}
                <Collapse in={isExpanded}>
                    <Box sx={{ px: 3, pb: 2 }}>{/* Padding bottom 24px/3rem equivalent? No, px:3 is 24px. */}
                        {isLoading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, color: '#6B7280' }}>
                                <CircularProgress size={16} thickness={4} sx={{ color: '#6B7280' }} />
                                <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif' }}>
                                    Thinking...
                                </Typography>
                            </Box>
                        ) : error ? (
                            <Typography variant="body2" color="error" sx={{ py: 2 }}>
                                {error}
                            </Typography>
                        ) : (
                            <Fade in={!isLoading}>
                                <Box sx={{ py: 1 }}>
                                    {/* Typography Update: Readability prioritized */}
                                    <Typography variant="body1" sx={{
                                        color: '#2E2E2E', // Darker gray/black for body
                                        lineHeight: 1.6,
                                        fontSize: '0.95rem',
                                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                        pb: 2
                                    }}>
                                        {content}
                                    </Typography>

                                    {/* Optional: Add a "Copy" text button instead of icon for calmer feel? 
                                        Or keep invisible. The user didn't ask for actions. 
                                        "Limit icons". I'll skip the copy button to keep it clean unless requested.
                                    */}
                                </Box>
                            </Fade>
                        )}
                    </Box>
                </Collapse>
            </Paper>
        </Slide>
    );
};

export default FloatingExplanationCard;
