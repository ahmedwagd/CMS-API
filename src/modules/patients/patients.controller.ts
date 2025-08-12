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
import { PatientsService } from './patients.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  FilterPatientDto,
  PatientResponseDto,
  PatientAppointmentFilterDto,
  AddProgressionNoteDto,
  PatientMedicalSummaryDto,
  PatientMedicalTimelineDto,
  BulkActivateDeactivateDto,
  BulkDeleteDto,
} from './dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { plainToClass } from 'class-transformer';

@Controller('patients')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'receptionist')
  @RequirePermissions('create_patients')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<PatientResponseDto> {
    const patient = await this.patientsService.create(createPatientDto);
    return plainToClass(PatientResponseDto, patient);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_patients')
  async findAll(@Query() filterDto: FilterPatientDto) {
    return this.patientsService.findAll(filterDto);
  }

  @Get('stats')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('view_patients')
  async getStats() {
    return this.patientsService.getPatientStats();
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_patients')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.patientsService.findOne(id);
    return plainToClass(PatientResponseDto, patient);
  }

  @Get(':id/appointments')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_appointments', 'view_patients')
  async getPatientAppointments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filterDto: PatientAppointmentFilterDto,
  ) {
    const { startDate, endDate, ...rest } = filterDto;
    const filter = {
      ...rest,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    };

    return this.patientsService.getPatientAppointments(id, filter);
  }

  @Get(':id/progression-notes')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_patients', 'view_medical_records')
  async getProgressionNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.patientsService.getProgressionNotes(id, { page, limit });
  }

  @Post(':id/progression-notes')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'doctor')
  @RequirePermissions('create_medical_records')
  async addProgressionNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addProgressionNoteDto: AddProgressionNoteDto,
  ) {
    return this.patientsService.addProgressionNote(
      id,
      addProgressionNoteDto.note,
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'receptionist')
  @RequirePermissions('edit_patients')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    const patient = await this.patientsService.update(id, updatePatientDto);
    return plainToClass(PatientResponseDto, patient);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('edit_patients')
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.patientsService.activate(id);
    return plainToClass(PatientResponseDto, patient);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('delete_patients')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.patientsService.remove(id);
  }

  @Get(':id/medical-summary')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_patients', 'view_medical_records')
  async getPatientMedicalSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() summaryDto: PatientMedicalSummaryDto,
  ) {
    return this.patientsService.getPatientMedicalSummary(id, summaryDto);
  }

  @Get(':id/medical-timeline')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_patients', 'view_medical_records')
  async getPatientMedicalTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() timelineDto: PatientMedicalTimelineDto,
  ) {
    return this.patientsService.getPatientMedicalTimeline(id, timelineDto);
  }

  @Post('bulk-activate-deactivate')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('edit_patients')
  @HttpCode(HttpStatus.OK)
  async bulkActivateDeactivate(@Body() bulkDto: BulkActivateDeactivateDto) {
    return this.patientsService.bulkActivateDeactivate(bulkDto);
  }

  @Post('bulk-delete')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('delete_patients')
  @HttpCode(HttpStatus.OK)
  async bulkDelete(@Body() bulkDeleteDto: BulkDeleteDto) {
    return this.patientsService.bulkDelete(bulkDeleteDto);
  }

  @Get('follow-up-needed')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'doctor')
  @RequirePermissions('view_patients')
  async getPatientsForFollowUp(@Query('daysThreshold') daysThreshold?: number) {
    return this.patientsService.getPatientsForFollowUp(daysThreshold);
  }
}
