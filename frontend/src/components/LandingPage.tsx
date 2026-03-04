import React, { useState, useMemo, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Container,
    IconButton,
    useMediaQuery,
    CssBaseline,
    ThemeProvider,
    createTheme,
    Paper,
    Stack,
    Switch,
    styled,
    alpha,
    Avatar,
    Tooltip,
    Fade
} from '@mui/material';
import {
    Brightness4,
    Brightness7,
    Highlight as HighlightIcon,
    Note as NoteIcon,
    Search as SearchIcon,
    ContentCopy as CopyIcon,
    CloudUpload as CloudUploadIcon,
    AutoAwesome as AutoAwesomeIcon,
    MenuBook as MenuBookIcon,
    PictureAsPdf as PdfIcon,
    Menu as MenuIcon,
    Check as CheckIcon,
    Settings as SettingsIcon,
    Battery90 as BatteryIcon,
    Wifi as WifiIcon,
    BookmarkBorder as BookmarkIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// --- Styled Components for Layout & Polish ---

const FullViewportSection = styled(Box)(({ theme }) => ({
    minHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '18vh',
    paddingBottom: theme.spacing(15),
    position: 'relative',
    [theme.breakpoints.down('md')]: {
        paddingTop: '15vh',
        paddingBottom: theme.spacing(10),
        minHeight: 'auto',
    },
}));

const FeatureBlock = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    paddingTop: theme.spacing(12),
    paddingBottom: theme.spacing(12),
    gap: theme.spacing(15),
    minHeight: '70vh',
    [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
        gap: theme.spacing(8),
        paddingTop: theme.spacing(8),
        paddingBottom: theme.spacing(8),
        textAlign: 'center',
    },
}));

const VisualBox = styled(Paper)(({ theme }) => ({
    flex: 1.2,
    height: 520,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(theme.palette.action.hover, 0.05),
    border: 'none',
    boxShadow: 'none',
    overflow: 'visible',
    position: 'relative',
    borderRadius: theme.shape.borderRadius * 4,
}));

// --- Realistic "App" CSS Components ---

const MacWindow = styled(Box)(({ theme }) => ({
    width: '90%',
    height: '85%',
    backgroundColor: theme.palette.background.paper,
    borderRadius: 12,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: `1px solid ${theme.palette.divider}`,
    position: 'relative',
    transition: 'transform 0.4s ease',
    '&:hover': {
        transform: 'translateY(-5px) scale(1.02)'
    }
}));

const KindleDevice = styled(Box)(({ theme }) => ({
    width: '85%',
    height: '88%',
    backgroundColor: '#111', // Black bezel
    borderRadius: 24,
    boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    padding: 16, // Bezel width
    position: 'relative',
    transition: 'transform 0.4s ease',
    '&:hover': {
        transform: 'translateY(-5px) scale(1.01)'
    }
}));

const KindleScreen = styled(Box)(({ theme }) => ({
    backgroundColor: '#fbf0d9', // E-ink warm paper
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    color: '#333',
    fontFamily: '"Bookerly", "Georgia", serif',
    display: 'flex',
    flexDirection: 'column',
}));

const KindleHeader = styled(Box)({
    height: 40,
    borderBottom: '1px solid rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    fontSize: 12,
    fontWeight: 500
});

const KindleFooter = styled(Box)({
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    fontSize: 11,
    opacity: 0.7
});

const AppHeader = styled(Box)<{ color?: string }>(({ theme, color }) => ({
    height: 48,
    backgroundColor: color || '#2c3e50',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: 12
}));

const WindowControls = styled(Box)({
    display: 'flex',
    gap: 8,
    '& > div': {
        width: 12,
        height: 12,
        borderRadius: '50%',
    }
});

const AppSidebar = styled(Box)(({ theme }) => ({
    width: 60,
    backgroundColor: theme.palette.mode === 'dark' ? '#222' : '#f5f7fa',
    borderRight: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 16,
    gap: 20
}));

const DocPaper = styled(Box)(({ theme }) => ({
    backgroundColor: 'white',
    width: '80%',
    height: '120%',
    marginTop: 20,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    margin: '24px auto',
    padding: 32,
}));

const SkeletonLine = styled(Box)<{ width?: string }>(({ theme, width }) => ({
    height: 12,
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
    borderRadius: 4,
    width: width || '100%'
}));


const VisionPill = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1.8, 4.5),
    border: `1px solid ${alpha(theme.palette.text.primary, 0.15)}`,
    borderRadius: 100,
    fontSize: '1.1rem',
    fontWeight: 500,
    display: 'inline-block',
    cursor: 'default',
    transition: 'all 0.3s ease',
    backgroundColor: 'transparent',
    '&:hover': {
        borderColor: theme.palette.text.primary,
        backgroundColor: alpha(theme.palette.text.primary, 0.03),
        transform: 'translateY(-3px)',
    },
}));

const UseCaseCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(8, 5),
    textAlign: 'center',
    height: '100%',
    minHeight: 280,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    fontWeight: 400,
    lineHeight: 1.4,
    borderRadius: theme.shape.borderRadius * 3,
    border: `1px solid ${theme.palette.divider}`,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: theme.palette.background.paper,
    boxShadow: 'none',
    '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
        borderColor: 'transparent',
    },
}));

const StickyAppBar = styled(AppBar)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.background.default, 0.85),
    backdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
    boxShadow: 'none',
}));

// --- Main Component ---

interface LandingPageProps {
    onUpload: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onUpload }) => {
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    // State for interactive mockups
    const [clickedIcon, setClickedIcon] = useState<string | null>(null);
    const [showNotes, setShowNotes] = useState(false);
    const [eli5Mode, setEli5Mode] = useState(false);

    const toggleColorMode = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    const handleMockupRefClick = (action: string) => {
        setClickedIcon(action);
        if (action === 'note') {
            setShowNotes(true);
        }
        setTimeout(() => setClickedIcon(null), 2500);
    };

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    primary: {
                        main: mode === 'dark' ? '#ffffff' : '#111111',
                    },
                    secondary: {
                        main: '#555555',
                    },
                    background: {
                        default: mode === 'dark' ? '#0a0a0a' : '#ffffff',
                        paper: mode === 'dark' ? '#111111' : '#f9f9f9',
                    },
                    text: {
                        primary: mode === 'dark' ? '#ededed' : '#111111',
                        secondary: mode === 'dark' ? '#a0a0a0' : '#555555',
                    },
                    divider: mode === 'dark' ? '#333' : '#eaeaea',
                },
                typography: {
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                    h1: {
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 700,
                        fontSize: '4.5rem',
                        lineHeight: 1.05,
                        letterSpacing: '-0.03em',
                    },
                    h2: {
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 500,
                        fontSize: '3.5rem',
                        lineHeight: 1.15,
                        letterSpacing: '-0.025em',
                    },
                    h3: {
                        fontWeight: 500,
                        fontSize: '2.5rem',
                        lineHeight: 1.2,
                        letterSpacing: '-0.015em',
                    },
                    subtitle1: {
                        fontSize: '1.5rem',
                        lineHeight: 1.5,
                        fontWeight: 400,
                        letterSpacing: '-0.01em',
                    },
                },
                components: {
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                borderRadius: 100,
                                padding: '14px 32px',
                                fontSize: '1.1rem',
                                transition: 'all 0.2s ease',
                            },
                            contained: {
                                backgroundColor: mode === 'dark' ? '#ffffff' : '#111111',
                                color: mode === 'dark' ? '#000000' : '#ffffff',
                                boxShadow: '0 4px 14px 0 rgba(0,0,0,0.08)',
                                '&:hover': {
                                    backgroundColor: mode === 'dark' ? '#f0f0f0' : '#000000',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                                },
                            },
                        },
                    },
                },
            }),
        [mode]
    );

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                {/* Navbar */}
                <StickyAppBar position="sticky">
                    <Container maxWidth="xl">
                        <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: 90 }}>
                            <Typography variant="h5" component="div" sx={{ fontFamily: 'Newsreader, serif', fontWeight: 600, letterSpacing: '-0.02em', fontSize: '1.8rem' }}>
                                Reader.
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <IconButton onClick={toggleColorMode} color="inherit" sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'rotate(15deg)' } }}>
                                    {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                                </IconButton>
                                <Button variant="contained" onClick={onUpload}>
                                    Get Started
                                </Button>
                            </Box>
                        </Toolbar>
                    </Container>
                </StickyAppBar>

                {/* Hero Section */}
                <FullViewportSection>
                    <Container maxWidth="lg">
                        <Box sx={{ maxWidth: 950, mx: { xs: 'auto', md: 0 } }}>
                            <Typography variant="h1" gutterBottom sx={{ mb: 5 }}>
                                Turn PDFs into something<br />
                                you actually <Box component="span" sx={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', color: 'text.secondary' }}>want to read.</Box>
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 680, mb: 7 }}>
                                Upload any PDF—book, paper, report, notes.<br />
                                We transform it into a clean, interactive web article designed for thinking, not scrolling.
                            </Typography>
                            <Typography variant="overline" display="block" sx={{ fontWeight: 600, mb: 5, letterSpacing: '0.2em', opacity: 0.5, fontSize: '0.85rem' }}>
                                READ. HIGHLIGHT. SEARCH. REMEMBER.
                            </Typography>
                            <Stack direction="row" spacing={3} alignItems="center">
                                <Button variant="contained" size="large" onClick={onUpload} sx={{ px: 6, py: 2.2, fontSize: '1.2rem' }}>
                                    Upload a PDF
                                </Button>
                                <Button color="inherit" size="large" sx={{ opacity: 0.5, fontSize: '1.2rem' }} disableRipple>
                                    See how it works →
                                </Button>
                            </Stack>
                        </Box>
                    </Container>
                </FullViewportSection>

                {/* Sub Hero / Philosophy */}
                <Box sx={{ bgcolor: 'background.paper', py: 20 }}>
                    <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
                        <Typography variant="h2" sx={{ fontWeight: 300, lineHeight: 1.3, maxWidth: 1000, mx: 'auto' }}>
                            PDFs were built to be printed.<br />
                            <Box component="span" sx={{ fontWeight: 600, borderBottom: `3px solid ${theme.palette.text.primary}` }}>We rebuilt them for the web.</Box>
                        </Typography>
                    </Container>
                </Box>

                {/* Value Blocks */}
                <Box sx={{ py: 15 }}>
                    <Container maxWidth="xl" sx={{ px: { md: 10 } }}>
                        {/* Block 1: Readability (Kindle Visual) */}
                        <FeatureBlock>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>Read like a book.<br />Think like the web.</Typography>
                                <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.4rem', maxWidth: 500, lineHeight: 1.6 }}>
                                    Your PDF becomes a flowing, distraction-free article—more Kindle than file viewer. Typography that breathes. Sections that make sense.
                                </Typography>
                            </Box>
                            <VisualBox elevation={0}>
                                {/* Kindle Style Device */}
                                <KindleDevice>
                                    <KindleScreen>
                                        <KindleHeader>
                                            <Stack direction="row" alignItems="center" spacing={1}><BookmarkIcon fontSize="small" /> <Typography variant="caption">Library</Typography></Stack>
                                            <Typography variant="caption" fontWeight="bold">The Design of Everyday Things</Typography>
                                            <Stack direction="row" alignItems="center" spacing={1}><SettingsIcon fontSize="small" /> <BatteryIcon fontSize="small" /></Stack>
                                        </KindleHeader>
                                        <Box sx={{ p: 4, flex: 1 }}>
                                            <Typography variant="h5" gutterBottom sx={{ fontFamily: 'Bookerly, serif', fontWeight: 'bold' }}>Chapter 1: The Psychopathology of Everyday Things</Typography>
                                            <Typography paragraph sx={{ fontFamily: 'Bookerly, serif', fontSize: '1.1rem', lineHeight: 1.6, mt: 2 }}>
                                                If I were a plant, I would wonder why the sun is so bright today. But I am not a plant, so I just put on my sunglasses.
                                                The world is filled with objects, designed objects, that we interact with every day.
                                            </Typography>
                                            <Typography paragraph sx={{ fontFamily: 'Bookerly, serif', fontSize: '1.1rem', lineHeight: 1.6 }}>
                                                Some serve us well, others frustrate us. Good design is actually a lot harder to notice than poor design, in part because good designs fit our needs so well that the design is invisible.
                                            </Typography>
                                        </Box>
                                        <KindleFooter>
                                            <Typography variant="caption">Loc 302</Typography>
                                            <Typography variant="caption">14%</Typography>
                                        </KindleFooter>
                                    </KindleScreen>
                                </KindleDevice>
                            </VisualBox>
                        </FeatureBlock>

                        {/* Block 2: Highlighting (Interactive Kindle Notes) */}
                        <FeatureBlock sx={{ flexDirection: { md: 'row-reverse' } }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>Highlight anything.<br />Turn it into knowledge.</Typography>
                                <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.4rem', maxWidth: 500, lineHeight: 1.6 }}>
                                    Select any sentence or paragraph. Highlight it. Add a note. Come back later. Your thoughts stay attached to the text.
                                </Typography>
                            </Box>
                            <VisualBox elevation={0}>
                                <KindleDevice>
                                    <KindleScreen sx={{ flexDirection: 'row' }}>
                                        {/* Sidebar for Notes (Conditionally Visible) */}
                                        <Fade in={showNotes} timeout={500}>
                                            <Box sx={{
                                                width: showNotes ? '40%' : 0,
                                                bgcolor: '#f2f2f2',
                                                borderRight: '1px solid #ddd',
                                                display: showNotes ? 'flex' : 'none',
                                                flexDirection: 'column',
                                                p: 2,
                                                overflow: 'hidden',
                                                transition: 'width 0.3s ease'
                                            }}>
                                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                                    <IconButton size="small" onClick={() => setShowNotes(false)}>
                                                        <ArrowBackIcon fontSize="small" />
                                                    </IconButton>
                                                    <Typography variant="overline" color="text.secondary" fontWeight="bold" sx={{ lineHeight: 1 }}>
                                                        My Notes
                                                    </Typography>
                                                </Stack>
                                                <Paper sx={{ p: 2, mt: 1, bgcolor: '#fff', borderRadius: 2 }} elevation={0}>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>Just now</Typography>
                                                    <Box sx={{ borderLeft: '3px solid #f1c40f', pl: 1, mb: 1 }}>
                                                        <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.8rem', color: '#555' }}>
                                                            "The quick brown fox jumps over the lazy dog."
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" fontWeight="500">
                                                        Deep thought about foxes.
                                                    </Typography>
                                                </Paper>
                                            </Box>
                                        </Fade>

                                        {/* Main Text Area */}
                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <KindleHeader>
                                                <Stack direction="row" alignItems="center" spacing={1}><BookmarkIcon fontSize="small" /> <Typography variant="caption">Library</Typography></Stack>
                                                <Typography variant="caption" fontWeight="bold">Typography & Layout</Typography>
                                                <Stack direction="row" alignItems="center" spacing={1}><SettingsIcon fontSize="small" /> <BatteryIcon fontSize="small" /></Stack>
                                            </KindleHeader>

                                            <Box sx={{ p: 4, flex: 1, position: 'relative' }}>
                                                <Typography paragraph sx={{ fontFamily: 'Bookerly, serif', fontSize: '1.1rem', lineHeight: 1.6, color: '#999' }}>
                                                    <SkeletonLine width="60%" />
                                                </Typography>

                                                <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                                                    <Box sx={{ bgcolor: showNotes ? 'transparent' : '#fff3cd', px: 0.5, transition: 'background 0.3s' }}>
                                                        <Typography sx={{ fontSize: '1.1rem', color: 'text.primary', fontFamily: 'Bookerly, serif', lineHeight: 1.6 }}>
                                                            "The quick brown fox jumps over the lazy dog."
                                                        </Typography>
                                                    </Box>

                                                    {/* Popover Menu - Hide when sidebar is open to reduce clutter */}
                                                    <Fade in={!showNotes}>
                                                        <Paper elevation={4} sx={{
                                                            position: 'absolute', top: -60, left: '50%', transform: 'translate(-50%, 0)',
                                                            display: 'flex', gap: 1, p: 1, borderRadius: 2, zIndex: 5
                                                        }}>
                                                            <Tooltip title="Highlight">
                                                                <IconButton size="small" sx={{ color: '#f1c40f' }}>
                                                                    <HighlightIcon />
                                                                </IconButton>
                                                            </Tooltip>

                                                            <Tooltip title={clickedIcon === 'note' ? "Saved!" : "Save to Notes"}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleMockupRefClick('note')}
                                                                    color={clickedIcon === 'note' ? "success" : "default"}
                                                                >
                                                                    {clickedIcon === 'note' ? <CheckIcon /> : <NoteIcon />}
                                                                </IconButton>
                                                            </Tooltip>

                                                            <Tooltip title={clickedIcon === 'copy' ? "I have copied it to clipboard" : "Copy Text"}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleMockupRefClick('copy')}
                                                                    color={clickedIcon === 'copy' ? "success" : "default"}
                                                                >
                                                                    {clickedIcon === 'copy' ? <CheckIcon /> : <CopyIcon />}
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Paper>
                                                    </Fade>
                                                </Box>

                                                <Typography paragraph sx={{ mt: 2 }}>
                                                    <SkeletonLine width="90%" />
                                                    <SkeletonLine width="50%" />
                                                </Typography>
                                            </Box>
                                            <KindleFooter>
                                                <Typography variant="caption">Loc 52</Typography>
                                                <Typography variant="caption">5%</Typography>
                                            </KindleFooter>
                                        </Box>
                                    </KindleScreen>
                                </KindleDevice>
                            </VisualBox>
                        </FeatureBlock>

                        {/* Block 3: Context (Search Highlight In-Text) */}
                        <FeatureBlock>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>Instant context,<br />without leaving the page.</Typography>
                                <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.4rem', maxWidth: 500, lineHeight: 1.6 }}>
                                    Curious about a term? Select it. Search the web. Get context instantly—without breaking your reading flow.
                                </Typography>
                            </Box>
                            <VisualBox elevation={0}>
                                {/* Kindle Style Device for Context */}
                                <KindleDevice>
                                    <KindleScreen>
                                        <KindleHeader>
                                            <Stack direction="row" alignItems="center" spacing={1}><BookmarkIcon fontSize="small" /> <Typography variant="caption">Library</Typography></Stack>
                                            <Typography variant="caption" fontWeight="bold">Introduction to Philosophy</Typography>
                                            <Stack direction="row" alignItems="center" spacing={1}><SettingsIcon fontSize="small" /> <BatteryIcon fontSize="small" /></Stack>
                                        </KindleHeader>
                                        <Box sx={{ p: 4, flex: 1, position: 'relative' }}>
                                            <Typography paragraph sx={{ fontFamily: 'Bookerly, serif', fontSize: '1.1rem', lineHeight: 1.8 }}>
                                                In exploring the nature of human knowledge, we must first address the foundational concepts.
                                                <Box component="span" sx={{
                                                    borderBottom: '2px solid #FFD54F', // Underline style
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}> Epistemology </Box>
                                                is the branch of philosophy concerned with the nature and scope of knowledge.
                                            </Typography>

                                            {/* Popover Card */}
                                            <Fade in={true} timeout={1000}>
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: '55%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, 0)',
                                                    bgcolor: 'background.paper',
                                                    border: 1,
                                                    borderColor: 'divider',
                                                    px: 3, py: 3,
                                                    borderRadius: 3,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 2,
                                                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                                                    width: 280,
                                                    zIndex: 10
                                                }}>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <SearchIcon color="primary" />
                                                        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>Epistemology</Typography>
                                                    </Stack>
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                                                        {eli5Mode
                                                            ? "Think of it like being a detective for your own brain! It helps you figure out if what you think is true, is actually true. Like, how do you KNOW the sky is blue?"
                                                            : "The theory of knowledge, especially with regard to its methods, validity, and scope."}
                                                    </Typography>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        fullWidth
                                                        onClick={() => setEli5Mode(!eli5Mode)}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontSize: '0.85rem',
                                                            borderRadius: 2,
                                                            mt: 1,
                                                            borderColor: 'primary.main',
                                                            color: 'primary.main',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {eli5Mode ? "Show formal definition" : "Explain it to me like a 5 year old!"}
                                                    </Button>
                                                </Box>
                                            </Fade>
                                        </Box>
                                        <KindleFooter>
                                            <Typography variant="caption">Loc 104</Typography>
                                            <Typography variant="caption">3%</Typography>
                                        </KindleFooter>
                                    </KindleScreen>
                                </KindleDevice>
                            </VisualBox>
                        </FeatureBlock>
                    </Container>
                </Box>

                {/* How It Works Section */}
                <Box sx={{ bgcolor: 'background.default', py: 15, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Container maxWidth="xl">
                        <Typography variant="overline" display="block" align="center" sx={{ mb: 8, letterSpacing: '0.2em', color: 'text.secondary', fontWeight: 600 }}>
                            HOW IT WORKS
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 8, textAlign: 'center' }}>
                            {/* Step 1 */}
                            <Box>
                                <Avatar sx={{ width: 80, height: 80, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, mx: 'auto', mb: 4 }}>
                                    <CloudUploadIcon fontSize="large" />
                                </Avatar>
                                <Typography variant="h5" gutterBottom>1. Upload PDF</Typography>
                                <Typography color="text.secondary">Drag and drop any PDF file.<br />We process it securely in seconds.</Typography>
                            </Box>

                            {/* Step 2 */}
                            <Box>
                                <Avatar sx={{ width: 80, height: 80, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, mx: 'auto', mb: 4 }}>
                                    <AutoAwesomeIcon fontSize="large" />
                                </Avatar>
                                <Typography variant="h5" gutterBottom>2. AI Analysis</Typography>
                                <Typography color="text.secondary">Our engine extracts text, layout,<br />and structure into a web-native format.</Typography>
                            </Box>

                            {/* Step 3 */}
                            <Box>
                                <Avatar sx={{ width: 80, height: 80, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, mx: 'auto', mb: 4 }}>
                                    <MenuBookIcon fontSize="large" />
                                </Avatar>
                                <Typography variant="h5" gutterBottom>3. Read Better</Typography>
                                <Typography color="text.secondary">Enjoy a flowing reading experience<br />with powerful tools at your fingertips.</Typography>
                            </Box>
                        </Box>
                    </Container>
                </Box>


                {/* Vision Section */}
                <FullViewportSection sx={{ alignItems: 'center', justifyContent: 'center', pt: 0, pb: 0 }}>
                    <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
                        <Typography variant="h2" gutterBottom sx={{ mb: 6 }}>
                            PDFs trap information. <br />
                            <Box component="span" sx={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', color: 'primary.main' }}>We set it free.</Box>
                        </Typography>
                        <Typography variant="body1" sx={{ maxWidth: 800, mx: 'auto', mb: 10, fontSize: '1.5rem', color: 'text.secondary', lineHeight: 1.8 }}>
                            Most of the world’s knowledge still lives in static files—hard to read, harder to remember.
                            We believe reading should be:
                        </Typography>
                        <Stack direction="row" spacing={4} justifyContent="center" sx={{ mb: 10, flexWrap: 'wrap' }}>
                            {['Interactive', 'Context-aware', 'Personal'].map((text) => (
                                <VisionPill key={text}>{text}</VisionPill>
                            ))}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.6, fontSize: '1rem' }}>So we built a place where documents behave like modern content—not dead files.</Typography>
                    </Container>
                </FullViewportSection>

                {/* Use Cases */}
                <Box sx={{ bgcolor: 'background.paper', py: 20 }}>
                    <Container maxWidth="xl">
                        <Typography variant="overline" display="block" align="center" sx={{ mb: 12, letterSpacing: '0.25em', color: 'text.secondary', fontWeight: 600 }}>
                            BUILT FOR
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 5 }}>
                            {[
                                'Researchers annotating papers',
                                'Founders reading reports',
                                'Students studying textbooks',
                                'Writers collecting ideas',
                                'Anyone tired of fighting PDFs'
                            ].map((text, i) => (
                                <Box key={i} sx={{ minHeight: 280 }}>
                                    <UseCaseCard elevation={0} sx={i === 4 ? { bgcolor: 'transparent', border: '2px dashed' + theme.palette.divider, fontWeight: 600 } : {}}>
                                        {text}
                                    </UseCaseCard>
                                </Box>
                            ))}
                        </Box>
                    </Container>
                </Box>

                {/* Final CTA */}
                <FullViewportSection sx={{ alignItems: 'center', justifyContent: 'center', pt: 0, pb: 0 }}>
                    <Container maxWidth="md" sx={{ textAlign: 'center' }}>
                        <Typography variant="h2" gutterBottom sx={{ mb: 3 }}>Your documents deserve<br />better than a viewer.</Typography>
                        <Typography variant="h5" color="text.secondary" sx={{ mb: 10, fontWeight: 400, fontSize: '1.5rem' }}>Turn your next PDF into a living article.</Typography>
                        <Button variant="contained" size="large" onClick={onUpload} sx={{ px: 10, py: 3, fontSize: '1.4rem', borderRadius: 100 }}>
                            Upload your first PDF
                        </Button>
                    </Container>
                </FullViewportSection>

            </Box>
        </ThemeProvider >
    );
};
