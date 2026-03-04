import React, { useEffect, useState } from 'react';
import { Box, Container, CircularProgress, Typography, Fade, LinearProgress } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useParams, useNavigate } from 'react-router-dom';
import { pdfApi } from '../api/pdf';

export const ProcessingView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('PENDING');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                const { data } = await pdfApi.getStatusOnly(id!);
                setStatus(data.status);
                setProgress(data.progress || 0);
                setMessage(data.status_message || '');

                if (data.status === 'COMPLETED') {
                    clearInterval(poll);
                    setProgress(100);
                    // Add a small delay for effect
                    setTimeout(() => navigate(`/reader/${id}`), 1000);
                }
                if (data.status === 'FAILED') {
                    clearInterval(poll);
                    alert('Processing failed');
                    navigate('/dashboard');
                }
            } catch (err) {
                console.error(err);
            }
        }, 1000); // Poll every 1 second for smoother updates

        return () => clearInterval(poll);
    }, [id, navigate]);

    return (
        <Container maxWidth="sm" sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
        }}>
            <Box position="relative" display="inline-flex" mb={4}>
                <CircularProgress variant="determinate" value={status === 'img' ? 0 : progress} size={80} thickness={2} />
                <Box
                    top={0}
                    left={0}
                    bottom={0}
                    right={0}
                    position="absolute"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Typography variant="caption" component="div" color="text.secondary" fontSize={20}>
                        {`${Math.round(progress)}%`}
                    </Typography>
                </Box>
            </Box>

            <Typography variant="h5" fontWeight="bold" gutterBottom>
                {status === 'PENDING' ? 'Initiating...' : 'Analyzing Document'}
            </Typography>

            <Fade in={true} key={message || status}>
                <Typography variant="body1" color="text.secondary">
                    {message || (status === 'PENDING' ? "Uploading..." : "Processing...")}
                </Typography>
            </Fade>

            <Box width="100%" mt={2}>
                <LinearProgress variant="determinate" value={progress} />
            </Box>
        </Container>
    );
};
