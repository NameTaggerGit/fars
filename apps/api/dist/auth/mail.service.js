"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let MailService = class MailService {
    constructor(config) {
        this.config = config;
        this.transporter = null;
        const host = this.config.get('SMTP_HOST');
        const port = this.config.get('SMTP_PORT');
        const user = this.config.get('SMTP_USER');
        const pass = this.config.get('SMTP_PASS');
        this.from = this.config.get('EMAIL_FROM') || 'noreply@fars.local';
        this.baseUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';
        if (host && user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port: port || 587,
                secure: port === 465,
                auth: { user, pass },
            });
        }
    }
    async send(to, subject, html) {
        if (!this.transporter) {
            console.log('[Mail] No SMTP configured. Would send:', { to, subject });
            return;
        }
        await this.transporter.sendMail({ from: this.from, to, subject, html });
    }
    async sendVerificationEmail(email, name, token) {
        const link = `${this.baseUrl}/confirm-email?token=${encodeURIComponent(token)}`;
        await this.send(email, 'Confirm your email — FARS', `Hello ${name},<br><br>Please confirm your email: <a href="${link}">${link}</a><br><br>FARS Messenger`);
    }
    async sendPasswordResetEmail(email, name, token) {
        const link = `${this.baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
        await this.send(email, 'Reset your password — FARS', `Hello ${name},<br><br>Reset password: <a href="${link}">${link}</a><br><br>FARS Messenger`);
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map