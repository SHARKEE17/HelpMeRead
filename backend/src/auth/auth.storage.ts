import type { AuthenticatorTransportFuture } from '@simplewebauthn/types';

export interface Passkey {
    credentialID: Uint8Array;
    credentialPublicKey: Uint8Array;
    counter: number;
    transports?: AuthenticatorTransportFuture[];
}

export interface User {
    id: string;
    email: string;
    password?: string; // Hashed
    currentChallenge?: string;
    passkeys: Passkey[];
}

// In-memory simulating a DB
const users: User[] = [];

export const UserModel = {
    findById: (id: string) => users.find(u => u.id === id),
    findByEmail: (email: string) => users.find(u => u.email === email),
    create: (user: User) => {
        users.push(user);
        return user;
    },
    update: (id: string, updates: Partial<User>) => {
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            return users[index];
        }
        return null;
    }
};
