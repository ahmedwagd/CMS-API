import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { FilterMedicalRecordsDto } from './dto/filter-medical-records.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  AddExaminationDto,
  AddProgressionNoteDto,
  AddTreatmentPlanDto,
  ExaminationSearchDto,
  MedicalRecordsAnalyticsDto,
  UpdateExaminationDto,
  UpdateTreatmentPlanDto,
} from './dto';

@Controller('medical-records')
@UseGuards(JwtAuthGuard)
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Get('patient/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_medical_records')
  async getPatientMedicalRecords(
    @Param('id', ParseUUIDPipe) patientId: string,
    @Query() filterDto: FilterMedicalRecordsDto,
  ) {
    return this.medicalRecordsService.getPatientMedicalRecords(
      patientId,
      filterDto,
    );
  }

  @Get('patient/:id/stats')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_medical_records')
  async getPatientMedicalRecordsStats(
    @Param('id', ParseUUIDPipe) patientId: string,
  ) {
    return this.medicalRecordsService.getPatientMedicalRecordsStats(patientId);
  }

  @Post('patient/:id/examinations')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'doctor')
  @RequirePermissions('create_medical_records')
  @HttpCode(HttpStatus.CREATED)
  async addExamination(
    @Param('id', ParseUUIDPipe) patientId: string,
    @Body() addExaminationDto: AddExaminationDto,
  ) {
    return this.medicalRecordsService.addExamination(
      patientId,
      addExaminationDto,
    );
  }

  @Post('patient/:id/treatment-plans')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'doctor')
  @RequirePermissions('create_medical_records')
  @HttpCode(HttpStatus.CREATED)
  async addTreatmentPlan(
    @Param('id', ParseUUIDPipe) patientId: string,
    @Body() addTreatmentPlanDto: AddTreatmentPlanDto,
  ) {
    return this.medicalRecordsService.addTreatmentPlan(
      patientId,
      addTreatmentPlanDto,
    );
  }

  @Post('patient/:id/progression-notes')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'doctor')
  @RequirePermissions('create_medical_records')
  @HttpCode(HttpStatus.CREATED)
  async addProgressionNote(
    @Param('id', ParseUUIDPipe) patientId: string,
    @Body() addProgressionNoteDto: AddProgressionNoteDto,
  ) {
    return this.medicalRecordsService.addProgressionNote(
      patientId,
      addProgressionNoteDto.note,
    );
  }
  @Get('analytics')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'doctor')
  @RequirePermissions('view_medical_records', 'view_analytics')
  async getMedicalRecordsAnalytics(
    @Query() analyticsDto: MedicalRecordsAnalyticsDto,
  ) {
    return this.medicalRecordsService.getMedicalRecordsAnalytics(analyticsDto);
  }

  @Get('search/examinations')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_medical_records')
  async searchExaminations(@Query() searchDto: ExaminationSearchDto) {
    return this.medicalRecordsService.searchExaminations(searchDto);
  }

  @Get('patient/:id/export')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_medical_records', 'export_data')
  async exportPatientMedicalRecords(
    @Param('id', ParseUUIDPipe) patientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includePersonalInfo') includePersonalInfo?: boolean,
  ) {
    return this.medicalRecordsService.exportPatientMedicalRecords(patientId, {
      startDate,
      endDate,
      includePersonalInfo: includePersonalInfo === true,
    });
  }

  @Post('compare-patients')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'doctor')
  @RequirePermissions('view_medical_records', 'compare_patients')
  @HttpCode(HttpStatus.OK)
  async comparePatientsMedicalRecords(
    @Body() compareDto: { patientIds: string[] },
  ) {
    return this.medicalRecordsService.comparePatientsMedicalRecords(
      compareDto.patientIds,
    );
  }

  @Patch('examinations/:id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'doctor')
  @RequirePermissions('edit_medical_records')
  async updateExamination(
    @Param('id', ParseUUIDPipe) examinationId: string,
    @Body() updateDto: UpdateExaminationDto,
  ) {
    return this.medicalRecordsService.updateExamination(
      examinationId,
      updateDto,
    );
  }

  @Patch('treatment-plans/:id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'doctor')
  @RequirePermissions('edit_medical_records')
  async updateTreatmentPlan(
    @Param('id', ParseUUIDPipe) treatmentPlanId: string,
    @Body() updateDto: UpdateTreatmentPlanDto,
  ) {
    return this.medicalRecordsService.updateTreatmentPlan(
      treatmentPlanId,
      updateDto,
    );
  }
}
