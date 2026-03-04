import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress, Box, IconButton, Fab } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

import { ReaderProvider, useReader } from './ReaderContext';
import { ReaderLayout } from './ReaderLayout';
import { ReaderPage } from './ReaderPage';
import { ReaderControls } from './ReaderControls';
import { pdfApi } from '../../api/pdf';

const ReaderContent = () => {
    const { id } = useParams();
    const { isLoading, setData, setLoading, setError, nextPage, prevPage, currentUnitIndex, units } = useReader();

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        pdfApi.getStatus(id)
            .then(({ data }) => {
                setData(data);
            })
            .catch(err => {
                console.error(err);
                setError("Failed to load document.");
                setLoading(false);
            });
    }, [id]);

    if (isLoading) {
        return (
            <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
                <CircularProgress />
            </Box>
        );
    }

    const hasNext = currentUnitIndex < units.length - 1;
    const hasPrev = currentUnitIndex > 0;

    return (
        <ReaderLayout>
            <ReaderControls />
            <ReaderPage />

            {/* Navigation Overlay (Side Hit Areas) */}
            <Box sx={{
                position: 'fixed', top: '50%', left: 20, transform: 'translateY(-50%)',
                zIndex: 50, display: { xs: 'none', md: 'block' }
            }}>
                <Fab
                    color="primary"
                    disabled={!hasPrev}
                    onClick={prevPage}
                    aria-label="previous page"
                    size="medium"
                    sx={{ opacity: hasPrev ? 0.8 : 0, transition: 'opacity 0.2s' }}
                >
                    <NavigateBeforeIcon />
                </Fab>
            </Box>

            <Box sx={{
                position: 'fixed', top: '50%', right: 20, transform: 'translateY(-50%)',
                zIndex: 50, display: { xs: 'none', md: 'block' }
            }}>
                <Fab
                    color="primary"
                    disabled={!hasNext}
                    onClick={nextPage}
                    aria-label="next page"
                    size="medium"
                    sx={{ opacity: hasNext ? 0.8 : 0, transition: 'opacity 0.2s' }}
                >
                    <NavigateNextIcon />
                </Fab>
            </Box>
        </ReaderLayout>
    );
};

export const Reader = () => {
    return (
        <ReaderProvider>
            <ReaderContent />
        </ReaderProvider>
    );
};
