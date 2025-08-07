import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  FilterDoctorDto,
  DoctorResponseDto,
  AssignClinicDto,
  DoctorAppointmentFilterDto,
} from './dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { plainToClass } from 'class-transformer';

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
    const { startDate, endDate, ...rest } = filterDto;
    const filter = {
      ...rest,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    };
    return this.doctorsService.getDoctorAppointments(id, filter);
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

  // Special endpoint for doctors to view their own profile
  @Get('me/profile')
  @UseGuards(RolesGuard)
  @Roles('doctor')
  async getMyProfile(@CurrentUser() user: any) {
    // Assuming the user object contains doctor information or we need to find by user relationship
    // This would require a User-Doctor relationship in your schema
    // For now, assuming we have a way to get doctor by user
    // You might need to add a userId field to Doctor model or create a User-Doctor relation
    throw new Error(
      'This endpoint requires User-Doctor relationship implementation',
    );
  }

  // Special endpoint for doctors to view their own appointments
  @Get('me/appointments')
  @UseGuards(RolesGuard)
  @Roles('doctor')
  async getMyAppointments(
    @CurrentUser() user: any,
    @Query() filterDto: DoctorAppointmentFilterDto,
  ) {
    // Similar to above - needs User-Doctor relationship
    throw new Error(
      'This endpoint requires User-Doctor relationship implementation',
    );
  }
}
