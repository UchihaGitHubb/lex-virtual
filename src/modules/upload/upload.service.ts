import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, writeFile } from 'fs';
import { promisify } from 'util';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const writeFileAsync = promisify(writeFile);

@Injectable()
export class UploadService {
  private readonly uploadPath: string;

  constructor(private configService: ConfigService) {
    // Configurar ruta de almacenamiento (puede venir de variables de entorno)
    this.uploadPath = this.configService.get<string>('upload.path') || 'uploads';

    // Crear directorio si no existe
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }

    // Crear directorio de audio si no existe
    const audioDir = join(this.uploadPath, 'audio');
    if (!existsSync(audioDir)) {
      mkdirSync(audioDir, { recursive: true });
    }
  }

  async uploadAudioFile(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar tipo de archivo
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
      'audio/m4a',
      'audio/aac',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Tipos permitidos: ${allowedMimeTypes.join(', ')}`,
      );
    }

    // Validar tamaño (máximo 10MB para audio)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        `El archivo es demasiado grande. Tamaño máximo: ${maxSize / 1024 / 1024}MB`,
      );
    }

    // Generar nombre único para el archivo
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = join(this.uploadPath, 'audio', fileName);

    // Guardar archivo localmente
    // En producción, aquí se subiría a S3, Cloudinary, etc.
    await writeFileAsync(filePath, file.buffer);

    // Generar URL pública
    // En producción, esto sería la URL de S3/Cloudinary
    const baseUrl =
      this.configService.get<string>('upload.baseUrl') || 'http://localhost:3000';
    const url = `${baseUrl}/uploads/audio/${fileName}`;

    return { url };
  }
}

