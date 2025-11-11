import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  FileTypeValidator,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

export const multerStorage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    const extension = extname(file.originalname);
    cb(null, `${randomName}${extension}`);
  },
});

@ApiTags('Images')
@Controller('uploads')
export class ImagesController {

  @Post('upload')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir una imagen' })
  @ApiResponse({
    status: 201,
    description: 'Imagen subida exitosamente.',
    schema: {
      example: {
        message: 'Imagen subida exitosamente',
        path: 'uploads/a1b2c3d4e5f6.jpg',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: multerStorage }))
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const imagePath = `uploads/${file.filename}`;
    return {
      message: 'Imagen subida exitosamente',
      path: imagePath,
    };
  }


  @Get(':filename')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Servir una imagen' })
  @ApiResponse({ status: 200, description: 'Archivo de imagen.' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada.' })

  async serveImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename);

    try {
      await stat(filePath);
      const fileStream = createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      throw new NotFoundException('Imagen no encontrada');
    }
  }
}