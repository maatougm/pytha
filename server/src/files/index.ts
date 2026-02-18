// Export controllers
export { FilesController } from './files.controller';

// Export services
export { FilesService } from './files.service';

// Export DTOs from files.dto which re-exports from file-upload.dto
export * from './dto/files.dto';

// Export validation utilities
export * from './files.validation';

// Export module
export { FilesModule } from './files.module';
