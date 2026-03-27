import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import speakeasy from 'speakeasy';
import { User } from '../models/User'; // Assuming you have a User model
import { Request, Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Store this in an env file
const JWT_EXPIRATION = '1h'; // Example expiration time for JWT

class SecurityService {
    static async authenticate(username: string, password: string) {
        const user = await User.findOne({ username }); // Find user by username
        if (user && user.comparePassword(password)) { // Assuming comparePassword is a method in User
            const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
            return { token };
        }
        throw new Error('Invalid credentials');
    }

    static async sendOtp(email: string) {
        const secret = speakeasy.generateSecret({ length: 10 });
        const otp = speakeasy.totp({ secret: secret.base32, encoding: 'base32' });
        // Save secret to user for validation later
        await User.updateOne({ email }, { $set: { otp_secret: secret.base32 } });

        // Send OTP via email
        const transporter = nodemailer.createTransport({/* SMTP Config */});
        await transporter.sendMail({
            from: 'you@example.com', // sender address
            to: email, // list of receivers
            subject: 'Your OTP Code',
            text: `Your OTP Code is ${otp}`,
        });

        return otp; // Optionally return OTP for testing/debugging purposes
    }

    static async verifyOtp(email: string, token: string) {
        const user = await User.findOne({ email });
        if (user && speakeasy.totp.verify({ secret: user.otp_secret, encoding: 'base32', token })) {
            return { verified: true };
        }
        throw new Error('Invalid OTP');
    }

    static async refreshToken(token: string) {
        try {
            const decodedToken = jwt.verify(token, JWT_SECRET);
            const newToken = jwt.sign({ id: decodedToken.id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
            return { token: newToken };
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    static logout(userId: string) {
        // Implement logic to invalidate token - depends on your session management
        return { message: 'Successfully logged out' };
    }
}

export default SecurityService;