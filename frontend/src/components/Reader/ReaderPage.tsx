import React from 'react';
import { Box, Typography } from '@mui/material';
import { useReader } from './ReaderContext';

export const ReaderPage = () => {
    const { units, currentUnitIndex, fontSize } = useReader();
    const unit = units[currentUnitIndex];

    if (!unit) return null;

    return (
        <Box sx={{
            fontFamily: '"Bookerly", "Georgia", serif', // Fallback to Georgia if Bookerly isn't available
            fontSize: `${fontSize}px`,
            lineHeight: 1.6
        }}>
            {unit.heading && (
                <Typography variant="h4" component="h2" gutterBottom sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 700,
                    mb: 4,
                    mt: 2
                }}>
                    {unit.heading}
                </Typography>
            )}

            {Array.isArray(unit.content) ? (
                unit.content.map((para, idx) => (
                    <Typography
                        key={idx}
                        variant="body1"
                        component="div"
                        paragraph
                        sx={{
                            fontSize: 'inherit',
                            lineHeight: 'inherit',
                            mb: 2,
                            textAlign: 'justify',
                            // Rich Text Styling
                            '& a': {
                                color: 'primary.main',
                                textDecoration: 'underline',
                                textUnderlineOffset: '3px',
                                cursor: 'pointer'
                            },
                            '& sup': {
                                fontSize: '0.7em',
                                verticalAlign: 'super',
                                opacity: 0.8
                            },
                            '& table': {
                                width: '100%',
                                borderCollapse: 'collapse',
                                my: 2,
                                fontSize: '0.9em',
                                display: 'block',
                                overflowX: 'auto'
                            },
                            '& th, & td': {
                                border: '1px solid currentColor',
                                padding: '8px',
                                textAlign: 'left'
                            },
                            '& th': {
                                fontWeight: 700,
                                opacity: 0.9,
                                bgcolor: 'action.hover'
                            }
                        }}
                        dangerouslySetInnerHTML={{ __html: para }}
                    />
                ))
            ) : (
                <div dangerouslySetInnerHTML={{ __html: unit.content }} />
            )}

            <Box sx={{ mt: 8, textAlign: 'center', opacity: 0.5, fontSize: '0.8rem', fontFamily: 'sans-serif' }}>
                {currentUnitIndex + 1} / {units.length}
            </Box>
        </Box>
    );
};
