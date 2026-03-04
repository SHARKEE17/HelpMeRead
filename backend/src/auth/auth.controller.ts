import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UserModel } from './auth.storage';

// --- Cookies Config ---
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: false, // Set to true in prod (requires HTTPS)
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const AuthController = {
    // --- Password Auth ---
    registerPassword: async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const user = await AuthService.registerPassword(email, password);
            const tokens = AuthService.generateTokens(user!);

            res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
            res.json({ accessToken: tokens.accessToken, user: { id: user?.id, email: user?.email } });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    loginPassword: async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const tokens = await AuthService.loginPassword(email, password);

            res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
            res.json({ accessToken: tokens.accessToken });
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    },

    // --- WebAuthn Registration ---
    registerOptions: async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            const options = await AuthService.generateRegisterOptions(email);
            res.json(options);
        } catch (error: any) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    },

    verifyRegister: async (req: Request, res: Response) => {
        try {
            const { email, response } = req.body;
            const tokens = await AuthService.verifyRegister(email, response);

            res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
            res.json({ accessToken: tokens.accessToken });
        } catch (error: any) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    },

    // --- WebAuthn Login ---
    loginOptions: async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            const options = await AuthService.generateLoginOptions(email);
            res.json(options);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    verifyLogin: async (req: Request, res: Response) => {
        try {
            const { email, response } = req.body;
            const tokens = await AuthService.verifyLogin(email, response);

            res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
            res.json({ accessToken: tokens.accessToken });
        } catch (error: any) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    },

    // --- Session Management ---
    refresh: (req: Request, res: Response) => {
        const token = req.cookies.refreshToken;
        if (!token) return res.status(401).json({ error: 'No refresh token' });

        const payload = AuthService.verifyRefreshToken(token);
        if (!payload) return res.status(403).json({ error: 'Invalid refresh token' });

        const user = UserModel.findById(payload.id);
        if (!user) return res.status(403).json({ error: 'User not found' });

        const tokens = AuthService.generateTokens(user);
        // Rotate refresh token? Optional. For now, just issue new access token.
        return res.json({ accessToken: tokens.accessToken });
    },

    logout: (_req: Request, res: Response) => {
        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out' });
    },

    me: (req: Request, res: Response) => {
        // @ts-ignore - configured in middleware
        const user = req.user;
        res.json({ user });
    }
};
