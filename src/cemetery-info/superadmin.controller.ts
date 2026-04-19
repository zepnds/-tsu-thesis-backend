import {
  Controller,
  Put,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CemeteryInfoService } from './cemetery-info.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

@Controller('api/superadmin')
export class SuperAdminController {
  constructor(private readonly infoService: CemeteryInfoService) {}

  @Put('save-cemetery-info')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads/logo',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `logo-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async saveCemeteryInfo(
    @Body() body: any,
    @UploadedFile() file: any,
  ) {
    const updateData = { ...body };
    if (file) {
      updateData.logo_url = `/uploads/logo/${file.filename}`;
    }

    // Ensure directory exists (basic check)
    if (!fs.existsSync('./uploads/logo')) {
      fs.mkdirSync('./uploads/logo', { recursive: true });
    }

    const saved = await this.infoService.saveOrUpdate(updateData);
    return { success: true, data: saved };
  }
}
