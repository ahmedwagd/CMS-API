import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AddProgressionNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  note: string;
}
