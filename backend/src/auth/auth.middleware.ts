import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const { JWT_SECRET } = process.env;

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) { res.status(401).json({ error: 'Access Token Required' }); return; }

    jwt.verify(token, JWT_SECRET!, (err: any, user: any) => {
        if (err) { res.status(403).json({ error: 'Invalid Token' }); return; }

        // @ts-ignore
        req.user = user;
        next();
    });
};
