import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { UserModel, User } from './auth.storage';
import { v4 as uuidv4 } from 'uuid';

const { RP_ID, RP_NAME, ORIGIN, JWT_SECRET, REFRESH_SECRET } = process.env;

if (!JWT_SECRET || !REFRESH_SECRET) {
    throw new Error('Missing JWT Secrets in .env');
}

export class AuthService {
    // --- JWT Management ---
    static generateTokens(user: User) {
        const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET!, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET!, { expiresIn: '7d' });
        return { accessToken, refreshToken };
    }

    static verifyRefreshToken(token: string) {
        try {
            return jwt.verify(token, REFRESH_SECRET!) as { id: string };
        } catch (e) {
            return null;
        }
    }

    // --- Password Auth ---
    static async registerPassword(email: string, passwordPlain: string) {
        const existing = UserModel.findByEmail(email);
        if (existing) throw new Error('User already exists');

        const hashedPassword = await bcrypt.hash(passwordPlain, 10);
        const newUser: User = {
            id: uuidv4(),
            email,
            password: hashedPassword,
            passkeys: [],
        };
        return UserModel.create(newUser);
    }

    static async loginPassword(email: string, passwordPlain: string) {
        const user = UserModel.findByEmail(email);
        if (!user || !user.password) throw new Error('Invalid credentials');

        const match = await bcrypt.compare(passwordPlain, user.password);
        if (!match) throw new Error('Invalid credentials');

        return this.generateTokens(user);
    }

    // --- WebAuthn: Registration ---
    static async generateRegisterOptions(email: string) {
        let user = UserModel.findByEmail(email);

        if (!user) {
            user = {
                id: uuidv4(),
                email,
                passkeys: []
            };
            UserModel.create(user);
        }

        const options = await generateRegistrationOptions({
            rpName: RP_NAME || 'HelpMeRead',
            rpID: RP_ID || 'localhost',
            userID: user.id,
            userName: user.email,
            attestationType: 'none',
        });

        UserModel.update(user.id, { currentChallenge: options.challenge });
        return options;
    }

    static async verifyRegister(email: string, response: any) {
        const user = UserModel.findByEmail(email);
        if (!user || !user.currentChallenge) throw new Error('User or challenge not found');

        const verification = await verifyRegistrationResponse({
            response,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: ORIGIN || 'http://localhost:5173',
            expectedRPID: RP_ID || 'localhost',
        });

        if (verification.verified && verification.registrationInfo) {
            const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

            const newPasskey = {
                credentialID,
                credentialPublicKey,
                counter,
                transports: response.response.transports,
            };

            user.passkeys.push(newPasskey);
            UserModel.update(user.id, { currentChallenge: undefined });

            return this.generateTokens(user);
        }
        throw new Error('Verification failed');
    }

    // --- WebAuthn: Login ---
    static async generateLoginOptions(email: string) {
        const user = UserModel.findByEmail(email);
        if (!user) throw new Error('User not found');

        const options = await generateAuthenticationOptions({
            rpID: RP_ID || 'localhost',
            allowCredentials: user.passkeys.map(key => ({
                id: key.credentialID,
                type: 'public-key',
                transports: key.transports,
            })),
        });

        UserModel.update(user.id, { currentChallenge: options.challenge });
        return options;
    }

    static async verifyLogin(email: string, response: any) {
        const user = UserModel.findByEmail(email);
        if (!user || !user.currentChallenge) throw new Error('User or challenge not found');

        const verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: ORIGIN || 'http://localhost:5173',
            expectedRPID: RP_ID || 'localhost',
            authenticator: {
                ...user.passkeys[0],
                credentialID: user.passkeys[0].credentialID,
                credentialPublicKey: user.passkeys[0].credentialPublicKey,
                counter: user.passkeys[0].counter,
            } as any
        });

        if (verification.verified) {
            UserModel.update(user.id, { currentChallenge: undefined });
            return this.generateTokens(user);
        }

        throw new Error('Login verification failed');
    }
}
