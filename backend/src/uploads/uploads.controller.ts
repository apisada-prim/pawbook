import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, Res, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import { existsSync, mkdirSync } from 'fs';

// Helper to ensure directory exists
const uploadDir = './uploads';
if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir);
}

@Controller('uploads')
export class UploadsController {
    @Post()
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: uploadDir,
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            }
        }),
        limits: {
            fileSize: 10 * 1024 * 1024 // 10 MB
        },
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
                return cb(new BadRequestException('Only image files are allowed!'), false);
            }
            cb(null, true);
        }
    }))
    uploadFile(@UploadedFile() file: any) { // Using any to bypass Multer type issues temporarily
        if (!file) {
            throw new BadRequestException('File is required');
        }
        // Return the URL to access the file
        // Assuming backend runs on port 4000
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        return {
            url: `${baseUrl}/uploads/files/${file.filename}`
        };
    }

    // Serve static files manually if ServeStaticModule acts up, 
    // or specifically for this controller path
    @Get('files/:filename')
    serveFile(@Param('filename') filename: string, @Res() res: Response) {
        return res.sendFile(filename, { root: uploadDir });
    }
}
