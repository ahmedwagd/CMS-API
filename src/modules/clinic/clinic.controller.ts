import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ClinicService } from './clinic.service';
import {
  CreateClinicDto,
  UpdateClinicDto,
  FilterClinicDto,
  ClinicResponseDto,
} from './dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { plainToClass } from 'class-transformer';

@Controller('clinics')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('create_clinics')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createClinicDto: CreateClinicDto,
  ): Promise<ClinicResponseDto> {
    const clinic = await this.clinicService.create(createClinicDto);
    return plainToClass(ClinicResponseDto, clinic);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_clinics')
  async findAll(@Query() filterDto: FilterClinicDto) {
    const result = await this.clinicService.findAll(filterDto);
    return {
      ...result,
      data: result.data.map((clinic) =>
        plainToClass(ClinicResponseDto, clinic),
      ),
    };
  }

  @Get('stats')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'clinic_manager')
  @RequirePermissions('view_clinics')
  async getStats() {
    return await this.clinicService.getClinicStats();
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_clinics')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClinicResponseDto> {
    const clinic = await this.clinicService.findOne(id);
    return plainToClass(ClinicResponseDto, clinic);
  }

  @Get(':id/doctors')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_clinics', 'view_doctors')
  async getClinicDoctors(@Param('id', ParseUUIDPipe) id: string) {
    return await this.clinicService.getClinicDoctors(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'clinic_manager')
  @RequirePermissions('edit_clinics')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClinicDto: UpdateClinicDto,
  ): Promise<ClinicResponseDto> {
    const updatedClinic = await this.clinicService.update(id, updateClinicDto);
    return plainToClass(ClinicResponseDto, updatedClinic);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('edit_clinics')
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClinicResponseDto> {
    const activatedClinic = await this.clinicService.activate(id);
    return plainToClass(ClinicResponseDto, activatedClinic);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('delete_clinics')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClinicResponseDto> {
    const deactivatedClinic = await this.clinicService.remove(id);
    return plainToClass(ClinicResponseDto, deactivatedClinic);
  }
}
