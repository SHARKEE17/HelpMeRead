import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pdfApi } from '../api/pdf';
import { DocumentReader } from './Semantic/ArticleRenderer';
import { ErrorBoundary } from './ErrorBoundary';
import FloatingExplanationCard from './FloatingExplanationCard';
import {
    Box,
    Typography,
    Paper,
    Popper,
    Fade,
    IconButton,
    Tooltip,
    Divider,
    Stack,
    AppBar,
    Toolbar
} from '@mui/material';
import {
    Highlight as HighlightIcon,
    Search as SearchIcon,
    ArrowBack as ArrowBackIcon,
    Share as ShareIcon,
    MoreHoriz as MoreIcon,
    ContentCopy as ContentCopyIcon
} from '@mui/icons-material';

interface ReaderViewProps {
    onBack?: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ onBack }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [article, setArticle] = useState<any>(null);
    const [anchorEl, setAnchorEl] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [highlights, setHighlights] = useState<any[]>([]);

    // Explanation State
    const [explainPanel, setExplainPanel] = useState<{
        isOpen: boolean;
        isLoading: boolean;
        content: string | null;
        error: string | null;
    }>({
        isOpen: false,
        isLoading: false,
        content: null,
        error: null
    });

    const handleExplain = async () => {
        if (!selectedText) return;
        setExplainPanel({ isOpen: true, isLoading: true, content: null, error: null });
        setOpen(false);

        try {
            const res = await pdfApi.explainText(selectedText, "");
            setExplainPanel({ isOpen: true, isLoading: false, content: res.data.text, error: null });
        } catch (err) {
            console.error("Explain failed:", err);
            setExplainPanel({ isOpen: true, isLoading: false, content: null, error: "Failed to get explanation. Please try again." });
        }
    };

    const contentRef = useRef<HTMLDivElement>(null);

    const handleBack = () => {
        if (onBack) onBack();
        else navigate('/dashboard');
    };

    useEffect(() => {
        if (!id) return;
        const loadContent = async () => {
            try {
                const statusRes = await pdfApi.getStatus(id);
                const { data } = statusRes;
                const contentObj = data.processedContent || data.processed_content;

                // Check for new Semantic structure (has 'sections')
                if (contentObj && contentObj.sections) {
                    setArticle({
                        title: data.title,
                        doc: contentObj,
                        footnotes: contentObj.footnotes || []
                    });
                } else if (contentObj && contentObj.doc) {
                    setArticle({
                        title: data.title,
                        doc: contentObj.doc,
                        footnotes: contentObj.footnotes
                    });
                } else {
                    setArticle({
                        title: data.title,
                        doc: null
                    });
                }

                try {
                    const highlightsRes = await pdfApi.getHighlights(id);
                    if (Array.isArray(highlightsRes.data)) {
                        setHighlights(highlightsRes.data);
                    } else if (highlightsRes.data && Array.isArray(highlightsRes.data.results)) {
                        setHighlights(highlightsRes.data.results);
                    }
                } catch (hlErr) {
                    console.warn('Failed to load highlights:', hlErr);
                }

            } catch (err) {
                console.error('Failed to load document content:', err);
            }
        };
        loadContent();
    }, [id, navigate]);

    // ... Selection Logic ...
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed || !selection.toString().trim()) {
                if (open) setOpen(false);
                return;
            }
            if (contentRef.current && !contentRef.current.contains(selection.anchorNode)) {
                return;
            }

            const text = selection.toString();
            if (text !== selectedText || !open) {
                setSelectedText(text);

                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    if (rect.top > 0 && rect.width > 0) {
                        let contextEl = selection.anchorNode;
                        if (contextEl && contextEl.nodeType === Node.TEXT_NODE) {
                            contextEl = contextEl.parentElement;
                        }
                        setAnchorEl({
                            getBoundingClientRect: () => rect,
                            contextElement: contextEl as Element,
                        });
                        setOpen(true);
                    }
                }
            }
        };

        const onMouseUp = () => requestAnimationFrame(() => handleSelection());
        const onKeyUp = (e: KeyboardEvent) => {
            if ((e.key === 'a' && (e.ctrlKey || e.metaKey)) || e.key === 'Shift') {
                requestAnimationFrame(() => handleSelection());
            }
        };

        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('keyup', onKeyUp);
        return () => {
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('keyup', onKeyUp);
        };
    }, [open, selectedText]);

    const handleHighlight = async () => {
        // ... (Highlight Logic - Adjusted for new structure if needed, but data-block-id presence is key) ...
        // Re-using simplified logic for brevity, assuming data-block-id is present on blocks
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !id) return;

        const text = selection.toString();
        // Finding block ID logic (same as before)
        let node: Node | null = selection.anchorNode;
        let blockId: string | null = null;
        while (node && node !== document.body) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as Element;
                if (el.hasAttribute('data-block-id')) {
                    blockId = el.getAttribute('data-block-id');
                    break;
                }
            }
            node = node.parentNode;
        }

        if (blockId) {
            try {
                // Naive offset calculation (0 for now to keep simple, we can refine later)
                const startOffset = 0;
                const endOffset = text.length;

                const newHighlight = {
                    document: id,
                    block_id: blockId,
                    start_offset: startOffset,
                    end_offset: endOffset,
                    color: '#ffeb3b',
                    text: text
                };
                const res = await pdfApi.createHighlight(newHighlight);
                setHighlights([...highlights, res.data]);
                setOpen(false);
                selection.removeAllRanges();
            } catch (err) {
                console.error('Failed to create highlight:', err);
            }
        }
    };

    const handleCopy = async () => {
        if (selectedText) {
            try {
                await navigator.clipboard.writeText(selectedText);
                setOpen(false);
            } catch (err) { console.error(err); }
        }
    };

    if (!article) return <Box p={4} textAlign="center"><Typography>Loading Article...</Typography></Box>;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#ffffff' }}>
            <AppBar position="fixed" color="inherit" elevation={0} sx={{
                borderBottom: '1px solid transparent',
                bgcolor: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
            }}>
                <Toolbar sx={{ justifyContent: 'space-between', maxWidth: '1000px', mx: 'auto', width: '100%' }}>
                    <IconButton edge="start" onClick={handleBack} sx={{ color: '#333' }}>
                        <ArrowBackIcon />
                    </IconButton>

                    <Stack direction="row" spacing={1}>
                        <IconButton sx={{ color: '#333' }}><ShareIcon /></IconButton>
                        <IconButton sx={{ color: '#333' }}><MoreIcon /></IconButton>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* Main Content - Centered Single Column */}
            <Box sx={{ minHeight: '100vh' }} ref={contentRef}>
                <ErrorBoundary>
                    {article.doc ? (
                        <DocumentReader document={article.doc} />
                    ) : (
                        <Box p={8} textAlign="center" mt={10}>
                            <Typography color="textSecondary">Document format not supported or empty.</Typography>
                        </Box>
                    )}
                </ErrorBoundary>
            </Box>

            {/* Selection Menu */}
            <Popper open={open} anchorEl={anchorEl} placement="top" transition style={{ zIndex: 1300, pointerEvents: 'none' }}>
                {({ TransitionProps }) => (
                    <Fade {...TransitionProps} timeout={200}>
                        <Paper elevation={4} sx={{ borderRadius: 8, overflow: 'hidden', bgcolor: '#202124', color: '#fff', display: 'flex', pointerEvents: 'auto' }}>
                            <Tooltip title="Highlight">
                                <IconButton onClick={handleHighlight} onMouseDown={(e) => e.preventDefault()} sx={{ color: '#ffeb3b', p: 1.5 }}><HighlightIcon fontSize="small" /></IconButton>
                            </Tooltip>
                            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                            <Tooltip title="Copy"><IconButton onClick={handleCopy} sx={{ color: '#fff', p: 1.5 }}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
                            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                            <Tooltip title="Explain"><IconButton onClick={handleExplain} onMouseDown={(e) => e.preventDefault()} sx={{ color: '#fff', p: 1.5 }}><SearchIcon fontSize="small" /></IconButton></Tooltip>
                        </Paper>
                    </Fade>
                )}
            </Popper>

            <FloatingExplanationCard
                isOpen={explainPanel.isOpen}
                onClose={() => setExplainPanel(prev => ({ ...prev, isOpen: false }))}
                isLoading={explainPanel.isLoading}
                content={explainPanel.content}
                error={explainPanel.error}
            />
        </Box>
    );
};
