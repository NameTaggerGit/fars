import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private config;
    private auth;
    constructor(config: ConfigService, auth: AuthService);
    validate(payload: {
        sub: string;
        email?: string;
        type?: string;
    }): Promise<JwtPayload & {
        role: string;
    }>;
}
export {};
