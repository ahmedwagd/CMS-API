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

  /**
   * Creates a new clinic.
   *
   * @param createClinicDto - The data to create the clinic.
   * @returns The created clinic transformed to ClinicResponseDto.
   * @throws ConflictException if a clinic with the same name, phone, or email already exists.
   */
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

  /**
   * Retrieves a list of clinics with filtering, pagination, and sorting.
   *
   * @param filterDto - The filter options including page, limit, search, isActive, sortBy, and sortOrder.
   * @returns An object containing the list of clinics and pagination metadata.
   */
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

  /**
   * Retrieves statistics about clinics.
   *
   * @returns An object containing various clinic statistics.
   */
  @Get('stats')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'clinic_manager')
  @RequirePermissions('view_clinics')
  async getStats() {
    return await this.clinicService.getClinicStats();
  }

  /**
   * Retrieves a single clinic by ID.
   *
   * @param id - The ID of the clinic to retrieve.
   * @returns The clinic transformed to ClinicResponseDto.
   * @throws NotFoundException if the clinic is not found.
   */
  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_clinics')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClinicResponseDto> {
    const clinic = await this.clinicService.findOne(id);
    return plainToClass(ClinicResponseDto, clinic);
  }

  /**
   * Retrieves the doctors of a clinic.
   *
   * @param id - The ID of the clinic.
   * @returns An object containing the clinic details and its doctors.
   * @throws NotFoundException if the clinic is not found.
   */
  @Get(':id/doctors')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_clinics', 'view_doctors')
  async getClinicDoctors(@Param('id', ParseUUIDPipe) id: string) {
    return await this.clinicService.getClinicDoctors(id);
  }

  /**
   * Updates a clinic.
   *
   * @param id - The ID of the clinic to update.
   * @param updateClinicDto - The data to update the clinic.
   * @returns The updated clinic transformed to ClinicResponseDto.
   * @throws NotFoundException if the clinic is not found.
   * @throws ConflictException if the updated name, phone, or email already exists.
   */
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

  /**
   * Activates a clinic by setting isActive to true.
   *
   * @param id - The ID of the clinic to activate.
   * @returns The activated clinic transformed to ClinicResponseDto.
   * @throws NotFoundException if the clinic is not found.
   */
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

  /**
   * Deactivates a clinic by setting isActive to false.
   *
   * @param id - The ID of the clinic to deactivate.
   * @returns The deactivated clinic transformed to ClinicResponseDto.
   * @throws NotFoundException if the clinic is not found.
   * @throws BadRequestException if the clinic folkhas active doctors.
   */
  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('delete_clinics')
  @HttpCode(HttpStatus.OK)
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClinicResponseDto> {
    const deactivatedClinic = await this.clinicService.deactivate(id);
    return plainToClass(ClinicResponseDto, deactivatedClinic);
  }
}
