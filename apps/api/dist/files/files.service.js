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
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const path = require("path");
const fs = require("fs/promises");
const UPLOAD_DIR = 'uploads';
let FilesService = class FilesService {
    constructor(config) {
        this.config = config;
        this.uploadDir = path.resolve(process.cwd(), UPLOAD_DIR);
    }
    async ensureDir() {
        await fs.mkdir(this.uploadDir, { recursive: true });
    }
    getPublicUrl(filename) {
        const baseUrl = this.config.get('API_BASE_URL') || 'http://localhost:3001';
        return `${baseUrl}/${UPLOAD_DIR}/${filename}`;
    }
    async saveBuffer(buffer, originalName, subdir = '') {
        await this.ensureDir();
        const ext = path.extname(originalName) || '';
        const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
        const dir = subdir ? path.join(this.uploadDir, subdir) : this.uploadDir;
        await fs.mkdir(dir, { recursive: true });
        const filepath = path.join(dir, name);
        await fs.writeFile(filepath, buffer);
        return subdir ? `${subdir}/${name}` : name;
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FilesService);
//# sourceMappingURL=files.service.js.map