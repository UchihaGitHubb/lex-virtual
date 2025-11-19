import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { memoryStorage } from 'multer';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('audio')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
      },
      fileFilter: (req, file, cb) => {
        // Validar que sea un archivo de audio
        if (!file.mimetype.startsWith('audio/')) {
          return cb(
            new BadRequestException('Solo se permiten archivos de audio'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    return this.uploadService.uploadAudioFile(file);
  }
}

