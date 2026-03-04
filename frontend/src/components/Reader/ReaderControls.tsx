import React from 'react';
import { Box, IconButton, Slider, ToggleButton, ToggleButtonGroup, Popover, Tooltip } from '@mui/material';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useReader } from './ReaderContext';
import { ReaderTheme } from './types';
import { useNavigate } from 'react-router-dom';

export const ReaderControls = () => {
    const { fontSize, setFontSize, theme, setTheme } = useReader();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    // Dynamic contrast for buttons based on theme
    const iconColor = theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';

    return (
        <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 100,
            background: 'transparent',
            pointerEvents: 'none' // Let clicks pass through to page
        }}>
            <Box sx={{ pointerEvents: 'auto' }}>
                <Tooltip title="Back to Library">
                    <IconButton onClick={() => navigate('/dashboard')} sx={{ color: iconColor }}>
                        <ArrowBackIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Box sx={{ pointerEvents: 'auto' }}>
                <Tooltip title="Appearance Settings">
                    <IconButton onClick={handleClick} sx={{ color: iconColor }}>
                        <FormatSizeIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: { p: 2, width: 300 }
                }}
            >
                <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <FormatSizeIcon fontSize="small" />
                        <Slider
                            value={fontSize}
                            min={14}
                            max={32}
                            step={2}
                            onChange={(_, val) => setFontSize(val as number)}
                            sx={{ mx: 2, flexGrow: 1 }}
                        />
                        <FormatSizeIcon fontSize="large" />
                    </Box>
                </Box>

                <Box display="flex" justifyContent="center">
                    <ToggleButtonGroup
                        value={theme}
                        exclusive
                        onChange={(_, newTheme) => {
                            if (newTheme) setTheme(newTheme as ReaderTheme);
                        }}
                        aria-label="text alignment"
                        size="small"
                    >
                        <ToggleButton value="light" aria-label="light mode">
                            Light
                        </ToggleButton>
                        <ToggleButton value="sepia" aria-label="sepia mode">
                            Sepia
                        </ToggleButton>
                        <ToggleButton value="dark" aria-label="dark mode">
                            Dark
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Popover>
        </Box>
    );
};
