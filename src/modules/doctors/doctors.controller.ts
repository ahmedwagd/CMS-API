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
  LinkDoctorToUserDto,
  UpdateDoctorDto,
} from './dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('doctors')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}
  /**
   * Creates a new doctor.
   * @param {CreateDoctorDto} createDoctorDto - The data transfer object containing doctor information.
   * @returns {Promise<DoctorResponseDto>} A promise that resolves to the created doctor's response DTO.
   * @throws {ConflictException} If a doctor with the same phone, email, socialId, or licenseNumber already exists.
   * @throws {BadRequestException} If the provided clinicId is invalid or the clinic is inactive.
   */
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

  /**
   * Retrieves all doctors with optional filtering.
   * @param {FilterDoctorDto} filterDto - The filter criteria for retrieving doctors.
   * @returns {Promise<any>} A promise that resolves to the list of doctors and pagination information.
   */

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_doctors')
  async findAll(@Query() filterDto: FilterDoctorDto): Promise<any> {
    return this.doctorsService.findAll(filterDto);
  }

  /**
   * Retrieves statistics about doctors.
   * @returns {Promise<any>} A promise that resolves to the doctor statistics.
   */

  @Get('stats')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('view_doctors')
  async getStats(): Promise<any> {
    return this.doctorsService.getDoctorStats();
  }

  /**
   * Retrieves a single doctor by ID.
   * @param {string} id - The UUID of the doctor to retrieve.
   * @returns {Promise<DoctorResponseDto>} A promise that resolves to the doctor's response DTO.
   * @throws {NotFoundException} If the doctor with the specified ID is not found.
   */
  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_doctors')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.findOne(id);
    return plainToClass(DoctorResponseDto, doctor);
  }

  /**
   * Retrieves appointments for a specific doctor with optional filtering.
   * @param {string} id - The UUID of the doctor.
   * @param {DoctorAppointmentFilterDto} filterDto - The filter criteria for retrieving appointments.
   * @returns {Promise<any>} A promise that resolves to the list of appointments and pagination information.
   */
  @Get(':id/appointments')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_appointments', 'view_doctors')
  async getDoctorAppointments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filterDto: DoctorAppointmentFilterDto,
  ) {
    return this.doctorsService.getDoctorAppointments(id, filterDto);
  }

  /**
   * Updates a doctor's information.
   * @param {string} id - The UUID of the doctor to update.
   * @param {UpdateDoctorDto} updateDoctorDto - The data transfer object containing updated doctor information.
   * @returns {Promise<DoctorResponseDto>} A promise that resolves to the updated doctor's response DTO.
   * @throws {NotFoundException} If the doctor with the specified ID is not found.
   * @throws {ConflictException} If the updated phone, email, socialId, or licenseNumber already exists for another doctor.
   * @throws {BadRequestException} If the provided clinicId is invalid or the clinic is inactive.
   */
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

  /**
   * Activates a doctor.
   * @param {string} id - The UUID of the doctor to activate.
   * @returns {Promise<DoctorResponseDto>} A promise that resolves to the activated doctor's response DTO.
   * @throws {NotFoundException} If the doctor with the specified ID is not found.
   */
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

  /**
   * Assigns a doctor to a clinic.
   * @param {string} id - The UUID of the doctor.
   * @param {AssignClinicDto} assignClinicDto - The data transfer object containing the clinic ID.
   * @returns {Promise<DoctorResponseDto>} A promise that resolves to the updated doctor's response DTO.
   * @throws {NotFoundException} If the doctor with the specified ID is not found.
   * @throws {BadRequestException} If the provided clinicId is invalid or the clinic is inactive.
   */
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

  /**
   * Removes a doctor from their assigned clinic.
   * @param {string} id - The UUID of the doctor.
   * @returns {Promise<DoctorResponseDto>} A promise that resolves to the updated doctor's response DTO.
   * @throws {NotFoundException} If the doctor with the specified ID is not found.
   */
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

  /**
   * Links a doctor to a user account.
   * @param {string} id - The UUID of the doctor.
   * @param {LinkDoctorToUserDto} linkDto - The data transfer object containing the user ID.
   * @returns {Promise<DoctorResponseDto>} A promise that resolves to the updated doctor's response DTO.
   * @throws {NotFoundException} If the doctor or user with the specified IDs are not found.
   * @throws {ConflictException} If the doctor is already linked to a user or the user already has a doctor profile.
   */
  @Post(':id/link-user')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('edit_doctors')
  async linkDoctorToUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() linkDto: LinkDoctorToUserDto,
  ): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.linkDoctorToUser(
      id,
      linkDto.userId,
    );
    return plainToClass(DoctorResponseDto, doctor);
  }

  /**
   * Unlinks a doctor from their associated user account.
   * @param {string} id - The UUID of the doctor.
   * @returns {Promise<DoctorResponseDto>} A promise that resolves to the updated doctor's response DTO.
   * @throws {NotFoundException} If the doctor with the specified ID is not found.
   */
  @Delete(':id/unlink-user')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('edit_doctors')
  async unlinkDoctorFromUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.unlinkDoctorFromUser(id);
    return plainToClass(DoctorResponseDto, doctor);
  }

  /**
   * Retrieves the profile of the currently authenticated doctor.
   * @param {any} user - The current user object.
   * @returns {Promise<DoctorResponseDto>} A promise that resolves to the doctor's response DTO.
   * @throws {NotFoundException} If the doctor profile is not found.
   */
  @Get('me/profile')
  @UseGuards(RolesGuard)
  @Roles('doctor')
  async getMyProfile(@CurrentUser() user: any): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.getDoctorProfile(user.id);
    return plainToClass(DoctorResponseDto, doctor);
  }

  /**
   * Updates the profile of the currently authenticated doctor.
   * @param {any} user - The current user object.
   * @param {UpdateDoctorDto} updateDoctorDto - The data transfer object containing updated doctor information.
   * @returns {Promise<DoctorResponseDto>} A promise that resolves to the updated doctor's response DTO.
   * @throws {NotFoundException} If the doctor profile is not found.
   */
  @Patch('me/profile')
  @UseGuards(RolesGuard)
  @Roles('doctor')
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.updateDoctorProfile(
      user.id,
      updateDoctorDto,
    );
    return plainToClass(DoctorResponseDto, doctor);
  }

  /**
   * Deletes a doctor.
   * @param {string} id - The UUID of the doctor to delete.
   * @returns {Promise<void>} A promise that resolves when the doctor is deleted or deactivated.
   * @throws {NotFoundException} If the doctor with the specified ID is not found.
   */
  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('delete_doctors')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.doctorsService.remove(id);
  }

  /**
   * Retrieves the schedule of a doctor for a given date range.
   * @param {string} id - The UUID of the doctor.
   * @param {string} startDate - The start date of the schedule range.
   * @param {string} endDate - The end date of the schedule range.
   * @returns {Promise<any>} A promise that resolves to the doctor's schedule.
   * @throws {NotFoundException} If the doctor with the specified ID is not found.
   */
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

  /**
   * Retrieves the appointments of the currently authenticated doctor with optional filtering.
   * @param {any} user - The current user object.
   * @param {DoctorAppointmentFilterDto} filterDto - The filter criteria for retrieving appointments.
   * @returns {Promise<any>} A promise that resolves to the list of appointments and pagination information.
   */
  @Get('me/appointments')
  @UseGuards(RolesGuard)
  @Roles('doctor')
  getMyAppointments(
    @CurrentUser() user: any,
    @Query() filterDto: DoctorAppointmentFilterDto,
  ): Promise<any> {
    return this.doctorsService.getDoctorAppointments(user.id, filterDto);
  }

  /**
   * Retrieves the workload of a doctor for a given year and optional month.
   * @param {string} id - The UUID of the doctor.
   * @param {number} year - The year for which to retrieve the workload.
   * @param {number} [month] - The optional month for which to retrieve the workload.
   * @returns {Promise<any>} A promise that resolves to the doctor's workload statistics.
   * @throws {NotFoundException} If the doctor with the specified ID is not found.
   */
  @Get(':id/workload')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_workload')
  async getDoctorWorkload(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('year') year: number,
    @Query('month') month?: number,
  ): Promise<any> {
    return this.doctorsService.getDoctorWorkload(id, year, month);
  }
}
