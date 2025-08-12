import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  create(@Body() createMedicalRecordDto: CreateMedicalRecordDto) {
    return this.medicalRecordsService.create(createMedicalRecordDto);
  }

  @Get()
  findAll() {
    return this.medicalRecordsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medicalRecordsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMedicalRecordDto: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.update(+id, updateMedicalRecordDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicalRecordsService.remove(+id);
  }
  /*
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
async searchExaminations(
  @Query() searchDto: ExaminationSearchDto,
) {
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
  return this.medicalRecordsService.comparePatientsMedicalRecords(compareDto.patientIds);
}

@Patch('examinations/:id')
@UseGuards(RolesGuard, PermissionsGuard)
@Roles('admin', 'super_admin', 'doctor')
@RequirePermissions('edit_medical_records')
async updateExamination(
  @Param('id', ParseUUIDPipe) examinationId: string,
  @Body() updateDto: UpdateExaminationDto,
) {
  return this.medicalRecordsService.updateExamination(examinationId, updateDto);
}

@Patch('treatment-plans/:id')
@UseGuards(RolesGuard, PermissionsGuard)
@Roles('admin', 'super_admin', 'doctor')
@RequirePermissions('edit_medical_records')
async updateTreatmentPlan(
  @Param('id', ParseUUIDPipe) treatmentPlanId: string,
  @Body() updateDto: UpdateTreatmentPlanDto,
) {
  return this.medicalRecordsService.updateTreatmentPlan(treatmentPlanId, updateDto);
}
*/
}
