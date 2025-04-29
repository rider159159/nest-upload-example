import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  getFilePath(filename: string): string {
    return `uploads/${filename}`;
  }
}