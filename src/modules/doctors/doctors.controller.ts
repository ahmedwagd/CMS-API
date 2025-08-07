import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { NotImplementedException } from '@nestjs/common/exceptions';
import { plainToClass } from 'class-transformer';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { DoctorsService } from './doctors.service';
import {
  AssignClinicDto,
  CreateDoctorDto,
  DoctorAppointmentFilterDto,
  DoctorResponseDto,
  FilterDoctorDto,
  UpdateDoctorDto,
} from './dto';

@Controller('doctors')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('create_doctors')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDoctorDto: CreateDoctorDto,
  ): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.create(createDoctorDto);
    return plainToClass(DoctorResponseDto, doctor);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_doctors')
  async findAll(@Query() filterDto: FilterDoctorDto) {
    return this.doctorsService.findAll(filterDto);
  }

  @Get('stats')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('view_doctors')
  async getStats() {
    return this.doctorsService.getDoctorStats();
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_doctors')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.findOne(id);
    return plainToClass(DoctorResponseDto, doctor);
  }

  @Get(':id/appointments')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_appointments', 'view_doctors')
  async getDoctorAppointments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filterDto: DoctorAppointmentFilterDto,
  ) {
    return this.doctorsService.getDoctorAppointments(id, filterDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('edit_doctors')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.update(id, updateDoctorDto);
    return plainToClass(DoctorResponseDto, doctor);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('edit_doctors')
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.activate(id);
    return plainToClass(DoctorResponseDto, doctor);
  }

  @Post(':id/assign-clinic')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('edit_doctors', 'manage_clinics')
  async assignToClinic(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignClinicDto: AssignClinicDto,
  ): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.assignToClinic(
      id,
      assignClinicDto.clinicId,
    );
    return plainToClass(DoctorResponseDto, doctor);
  }

  @Delete(':id/clinic')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('edit_doctors', 'manage_clinics')
  async removeFromClinic(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.removeFromClinic(id);
    return plainToClass(DoctorResponseDto, doctor);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('delete_doctors')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.doctorsService.remove(id);
  }

  // New endpoints for doctor workload and schedule
  @Get(':id/schedule')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_schedules')
  async getDoctorSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.doctorsService.getDoctorSchedule(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id/workload')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_workload')
  async getDoctorWorkload(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('year') year: number,
    @Query('month') month?: number,
  ) {
    return this.doctorsService.getDoctorWorkload(id, year, month);
  }

  // Placeholder endpoints for future implementation
  @Get('me/profile')
  @UseGuards(RolesGuard)
  @Roles('doctor')
  getMyProfile() {
    throw new NotImplementedException(
      'User-Doctor relationship not implemented yet',
    );
  }

  @Get('me/appointments')
  @UseGuards(RolesGuard)
  @Roles('doctor')
  getMyAppointments() {
    throw new NotImplementedException(
      'User-Doctor relationship not implemented yet',
    );
  }
}
