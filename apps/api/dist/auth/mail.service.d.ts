import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private config;
    private transporter;
    private from;
    private baseUrl;
    constructor(config: ConfigService);
    private send;
    sendVerificationEmail(email: string, name: string, token: string): Promise<void>;
    sendPasswordResetEmail(email: string, name: string, token: string): Promise<void>;
}
