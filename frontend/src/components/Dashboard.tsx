import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Avatar,
    LinearProgress,
    Chip,
    Paper
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate } from 'react-router-dom';
import { pdfApi } from '../api/pdf';
import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress';

function CircularProgressWithLabel(props: CircularProgressProps & { value: number }) {
    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress variant="determinate" {...props} />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="caption" component="div" color="text.secondary">
                    {`${Math.round(props.value)}%`}
                </Typography>
            </Box>
        </Box>
    );
}

export const Dashboard = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadDocuments();
        // Poll for updates every 3 seconds
        const interval = setInterval(loadDocuments, 3000);
        return () => clearInterval(interval);
    }, []);

    const loadDocuments = async () => {
        try {
            const { data } = await pdfApi.list();
            setDocuments(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { data } = await pdfApi.upload(file);
            // Redirect to processing view
            navigate(`/processing/${data.id}`);
        } catch (err) {
            console.error('Upload failed', err);
            setIsUploading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
            <Box textAlign="center" mb={6}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                    Library
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" paragraph>
                    Manage and read your processed documents
                </Typography>

                <Box mt={4}>
                    <input
                        accept="application/pdf"
                        style={{ display: 'none' }}
                        id="raised-button-file"
                        type="file"
                        onChange={handleUpload}
                    />
                    <label htmlFor="raised-button-file">
                        <Button
                            variant="contained"
                            component="span"
                            size="large"
                            startIcon={<UploadFileIcon />}
                            disabled={isUploading}
                            sx={{ borderRadius: 8, px: 4, py: 1.5, textTransform: 'none', fontSize: '1.1rem' }}
                        >
                            {isUploading ? 'Uploading...' : 'Upload New PDF'}
                        </Button>
                    </label>
                </Box>
                {isUploading && <LinearProgress sx={{ mt: 3, maxWidth: 300, mx: 'auto', borderRadius: 4 }} />}
            </Box>

            <Typography variant="h5" gutterBottom sx={{ mt: 6, mb: 3, fontWeight: 600 }}>
                Processed Documents
            </Typography>

            <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
                {documents.map((doc) => (
                    <ListItem key={doc.id} disablePadding sx={{ mb: 2, display: 'block' }}>
                        <ListItemButton
                            onClick={() => doc.status === 'COMPLETED' ? navigate(`/reader/${doc.id}`) : null}
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 2
                                },
                            }}
                        >
                            <ListItemIcon>
                                <Avatar sx={{
                                    bgcolor: doc.status === 'COMPLETED' ? 'primary.light' : 'grey.200',
                                    color: doc.status === 'COMPLETED' ? 'primary.main' : 'grey.500'
                                }}>
                                    <PictureAsPdfIcon />
                                </Avatar>
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        {doc.title || 'Untitled Document'}
                                    </Typography>
                                }
                                secondary={
                                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </Typography>
                                        {doc.status !== 'COMPLETED' && (
                                            <Chip
                                                label={doc.status}
                                                size="small"
                                                color={doc.status === 'FAILED' ? 'error' : 'warning'}
                                                sx={{ height: 20, fontSize: '0.65rem' }}
                                            />
                                        )}
                                    </Box>
                                }
                            />

                            {doc.status === 'COMPLETED' ? (
                                <Button size="small" variant="outlined" sx={{ borderRadius: 4 }}>
                                    Read
                                </Button>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', width: 140 }}>
                                    <Box sx={{ width: '100%', mr: 1 }}>
                                        <LinearProgress variant="determinate" value={doc.progress || 0} sx={{ borderRadius: 4, height: 6 }} />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">{Math.round(doc.progress || 0)}%</Typography>
                                </Box>
                            )}
                        </ListItemButton>
                    </ListItem>
                ))}
                {documents.length === 0 && (
                    <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: 'grey.50' }}>
                        <Typography color="text.secondary">
                            No documents found. Upload a PDF to get started!
                        </Typography>
                    </Paper>
                )}
            </List>
        </Container>
    );
};
