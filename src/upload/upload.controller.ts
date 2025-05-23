import { Controller, Post, UseInterceptors, UploadedFile,UploadedFiles, BadRequestException, Get, Res, Param, Body } from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Response } from 'express';
import { join } from 'path';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('請提供文件');
    }
    return {
      message: '文件上傳成功',
      filename: file.filename,
      path: this.uploadService.getFilePath(file.filename),
    };
  }

  @Get(':filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename);
    return res.sendFile(filePath);
  }

  @Post('imglist')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'imgList[0][bigImgUrl]', maxCount: 1 },
      { name: 'imgList[1][bigImgUrl]', maxCount: 1 },
      { name: 'imgList[2][bigImgUrl]', maxCount: 1 },
      // 可以根據需要增加更多欄位
    ])
  )
  async uploadImgList(
    @UploadedFiles() files: { [fieldname: string]: Express.Multer.File[] },
    @Body() body: any
  ) {
    try {
      if (!files || Object.keys(files).length === 0) {
        throw new BadRequestException('請提供至少一個檔案');
      }
      
      // 將 body 中的資料轉換成結構化資料
      const imgListData: any = [];
      const imgListKeys = Object.keys(body)
        .filter(key => key.startsWith('imgList[') && key.includes('][title]'))
        .sort();
      
      // 處理每個 title，並找到對應的檔案
      for (const titleKey of imgListKeys) {
        const indexMatch = titleKey.match(/imgList\[(\d+)\]\[title\]/);
        if (!indexMatch) continue;
        
        const index = parseInt(indexMatch[1]);
        const title = body[titleKey];
        
        // 找到對應的檔案
        const fileFieldName = `imgList[${index}][bigImgUrl]`;
        const fileArray = files[fileFieldName];
        const file = fileArray && fileArray.length > 0 ? fileArray[0] : null;
        
        if (file) {
          imgListData.push({
            title,
            filename: file.filename,
            path: this.uploadService.getFilePath(file.filename),
            originalname: file.originalname,
            size: file.size
          });
        } else {
          imgListData.push({
            title,
            error: '沒有找到對應的檔案'
          });
        }
      }
      
      return {
        message: '圖片列表上傳成功',
        count: imgListData.length,
        imgList: imgListData
      };
    } catch (error) {
      throw new BadRequestException('處理檔案時發生錯誤: ' + error.message);
    }
  }
  
}