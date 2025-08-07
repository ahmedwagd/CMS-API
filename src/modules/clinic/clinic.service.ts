import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClinicDto, UpdateClinicDto, FilterClinicDto } from './dto';

@Injectable()
export class ClinicService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks if a clinic with the given field value already exists, excluding the clinic with the given ID.
   *
   * @param id - The ID of the clinic to exclude from the check (null for create operations).
   * @param field - The field to check for uniqueness (e.g., 'name', 'phone', 'email').
   * @param value - The value to check.
   * @throws ConflictException if a clinic with the same field value already exists.
   */
  private async checkUniqueness(
    id: string | null,
    field: string,
    value: string,
  ) {
    const where: any = { [field]: { equals: value, mode: 'insensitive' } };
    if (id) {
      where.id = { not: id };
    }
    const existing = await this.prisma.clinic.findFirst({ where });
    if (existing) {
      throw new ConflictException(`Clinic with this ${field} already exists`);
    }
  }

  /**
   * Creates a new clinic.
   *
   * @param createClinicDto - The data to create the clinic.
   * @returns The created clinic.
   * @throws ConflictException if a clinic with the same name, phone, or email already exists.
   */
  async create(createClinicDto: CreateClinicDto) {
    const {
      name,
      phone,
      email,
      address,
      manager,
      isActive = true,
    } = createClinicDto;
    await this.checkUniqueness(null, 'name', name);
    await this.checkUniqueness(null, 'phone', phone);
    await this.checkUniqueness(null, 'email', email);
    const clinic = await this.prisma.clinic.create({
      data: {
        name,
        phone,
        address,
        manager,
        email,
        isActive,
      },
      include: {
        _count: {
          select: { doctors: true },
        },
      },
    });
    return clinic;
  }

  /**
   * Retrieves a list of clinics with filtering, pagination, and sorting.
   *
   * @param filterDto - The filter options including page, limit, search, isActive, sortBy, and sortOrder.
   * @returns An object containing the list of clinics and pagination metadata.
   */
  async findAll(filterDto?: FilterClinicDto) {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto || {};
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { manager: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    const [clinics, total] = await Promise.all([
      this.prisma.clinic.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { doctors: true },
          },
        },
      }),
      this.prisma.clinic.count({ where }),
    ]);
    return {
      data: clinics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves a single clinic by ID.
   *
   * @param id - The ID of the clinic to retrieve.
   * @returns The clinic with its active doctors and doctor count.
   * @throws NotFoundException if the clinic is not found.
   */
  async findOne(id: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
      include: {
        doctors: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            specialization: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { doctors: true },
        },
      },
    });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }
    return clinic;
  }

  /**
   * Updates a clinic.
   *
   * @param id - The ID of the clinic to update.
   * @param updateClinicDto - The data to update the clinic.
   * @returns The updated clinic.
   * @throws NotFoundException if the clinic is not found.
   * @throws ConflictException if the updated name, phone, or email already exists.
   */
  async update(id: string, updateClinicDto: UpdateClinicDto) {
    const existingClinic = await this.prisma.clinic.findUnique({
      where: { id },
    });
    if (!existingClinic) {
      throw new NotFoundException('Clinic not found');
    }
    const { name, phone, email, ...otherData } = updateClinicDto;
    if (name && name !== existingClinic.name) {
      await this.checkUniqueness(id, 'name', name);
    }
    if (phone && phone !== existingClinic.phone) {
      await this.checkUniqueness(id, 'phone', phone);
    }
    if (email && email !== existingClinic.email) {
      await this.checkUniqueness(id, 'email', email);
    }
    const updatedClinic = await this.prisma.clinic.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...otherData,
      },
      include: {
        _count: {
          select: { doctors: true },
        },
      },
    });
    return updatedClinic;
  }

  /**
   * Deactivates a clinic by setting isActive to false.
   *
   * @param id - The ID of the clinic to deactivate.
   * @returns The deactivated clinic.
   * @throws NotFoundException if the clinic is not found.
   * @throws BadRequestException if the clinic has active doctors.
   */
  async deactivate(id: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
      include: {
        _count: {
          select: { doctors: true },
        },
      },
    });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }
    const activeDoctors = await this.prisma.doctor.count({
      where: {
        clinicId: id,
        isActive: true,
      },
    });
    if (activeDoctors > 0) {
      throw new BadRequestException(
        'Cannot deactivate clinic with active doctors. Please reassign or deactivate doctors first.',
      );
    }
    const updatedClinic = await this.prisma.clinic.update({
      where: { id },
      data: { isActive: false },
      include: {
        _count: {
          select: { doctors: true },
        },
      },
    });
    return updatedClinic;
  }

  /**
   * Activates a clinic by setting isActive to true.
   *
   * @param id - The ID of the clinic to activate.
   * @returns The activated clinic.
   * @throws NotFoundException if the clinic is not found.
   */
  async activate(id: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
    });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }
    const updatedClinic = await this.prisma.clinic.update({
      where: { id },
      data: { isActive: true },
      include: {
        _count: {
          select: { doctors: true },
        },
      },
    });
    return updatedClinic;
  }

  /**
   * Retrieves statistics about clinics.
   *
   * @returns An object containing various clinic statistics.
   */
  async getClinicStats() {
    const [
      totalClinics, // Total number of clinics
      activeClinics, // Number of active clinics
      inactiveClinics, // Number of inactive clinics
      clinicsWithDoctors, // Number of clinics with at least one active doctor
      avgDoctorsPerClinic, // Average number of active doctors per clinic
    ] = await Promise.all([
      this.prisma.clinic.count(),
      this.prisma.clinic.count({ where: { isActive: true } }),
      this.prisma.clinic.count({ where: { isActive: false } }),
      this.prisma.clinic.count({
        where: {
          doctors: {
            some: { isActive: true },
          },
        },
      }),
      this.prisma.clinic
        .findMany({
          include: {
            _count: {
              select: { doctors: { where: { isActive: true } } },
            },
          },
        })
        .then((clinics) => {
          const totalDoctors = clinics.reduce(
            (sum, clinic) => sum + clinic._count.doctors,
            0,
          );
          return clinics.length > 0
            ? Math.round((totalDoctors / clinics.length) * 10) / 10
            : 0;
        }),
    ]);
    return {
      totalClinics,
      activeClinics,
      inactiveClinics,
      clinicsWithDoctors,
      clinicsWithoutDoctors: activeClinics - clinicsWithDoctors,
      avgDoctorsPerClinic,
    };
  }

  /**
   * Retrieves the doctors of a clinic.
   *
   * @param clinicId - The ID of the clinic.
   * @returns An object containing the clinic details and its doctors.
   * @throws NotFoundException if the clinic is not found.
   */
  async getClinicDoctors(clinicId: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }
    const doctors = await this.prisma.doctor.findMany({
      where: { clinicId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialization: true,
        licenseNumber: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
    return {
      clinic: {
        id: clinic.id,
        name: clinic.name,
      },
      doctors,
      count: doctors.length,
    };
  }
}
