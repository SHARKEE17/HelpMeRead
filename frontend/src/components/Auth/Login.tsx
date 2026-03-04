import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    Tab,
    Tabs,
    TextField,
    Typography,
    Alert,
    Stack
} from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import PasswordIcon from '@mui/icons-material/Password';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [method, setMethod] = useState<'passkey' | 'password'>('passkey');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (mode === 'login') {
                await login(method, email, password);
            } else {
                await signup(method, email, password);
            }
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Authentication failed');
        }
    };

    return (
        <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
                    {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </Typography>

                <Tabs
                    value={method}
                    onChange={(_, v) => setMethod(v)}
                    variant="fullWidth"
                    sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab icon={<FingerprintIcon />} label="Passkey" value="passkey" />
                    <Tab icon={<PasswordIcon />} label="Password" value="password" />
                </Tabs>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        <TextField
                            label="Email Address"
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        {method === 'password' && (
                            <TextField
                                label="Password"
                                type="password"
                                fullWidth
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={method === 'passkey' ? <FingerprintIcon /> : undefined}
                        >
                            {mode === 'login'
                                ? (method === 'passkey' ? 'Sign in with Passkey' : 'Sign In')
                                : (method === 'passkey' ? 'Register with Passkey' : 'Sign Up')
                            }
                        </Button>
                    </Stack>
                </form>

                <Box mt={3} textAlign="center">
                    <Button
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        sx={{ textTransform: 'none' }}
                    >
                        {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};
