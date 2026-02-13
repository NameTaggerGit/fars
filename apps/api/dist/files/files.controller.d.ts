import { JwtPayload } from '../common/decorators/current-user.decorator';
import { FilesService } from './files.service';
export declare class FilesController {
    private files;
    constructor(files: FilesService);
    upload(user: JwtPayload, file?: Express.Multer.File): Promise<{
        url: string;
        path: string;
        mimeType: string;
        size: number;
    }>;
    uploadAvatar(user: JwtPayload, file?: Express.Multer.File): Promise<{
        url: string;
        path: string;
    }>;
}
