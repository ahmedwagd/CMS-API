import { PartialType } from '@nestjs/mapped-types';
import { AddExaminationDto } from './add-examination.dto';

export class UpdateExaminationDto extends PartialType(AddExaminationDto) {}
