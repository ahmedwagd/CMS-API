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
   * Create a new clinic
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

    // Check if clinic with same name already exists
    const existingClinicByName = await this.prisma.clinic.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existingClinicByName) {
      throw new ConflictException('Clinic with this name already exists');
    }

    // Check if clinic with same phone already exists
    const existingClinicByPhone = await this.prisma.clinic.findFirst({
      where: { phone },
    });

    if (existingClinicByPhone) {
      throw new ConflictException(
        'Clinic with this phone number already exists',
      );
    }

    // Check if clinic with same email already exists
    const existingClinicByEmail = await this.prisma.clinic.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (existingClinicByEmail) {
      throw new ConflictException('Clinic with this email already exists');
    }

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
   * Get all clinics with filtering and pagination
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

    // Build where clause
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

    // Build orderBy clause
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
   * Get clinic by ID
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
   * Update clinic
   */
  async update(id: string, updateClinicDto: UpdateClinicDto) {
    // Check if clinic exists
    const existingClinic = await this.prisma.clinic.findUnique({
      where: { id },
    });

    if (!existingClinic) {
      throw new NotFoundException('Clinic not found');
    }

    const { name, phone, email, ...otherData } = updateClinicDto;

    // Check for conflicts only if the values are being changed
    if (name && name !== existingClinic.name) {
      const nameConflict = await this.prisma.clinic.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new ConflictException('Clinic with this name already exists');
      }
    }

    if (phone && phone !== existingClinic.phone) {
      const phoneConflict = await this.prisma.clinic.findFirst({
        where: {
          phone,
          id: { not: id },
        },
      });

      if (phoneConflict) {
        throw new ConflictException(
          'Clinic with this phone number already exists',
        );
      }
    }

    if (email && email !== existingClinic.email) {
      const emailConflict = await this.prisma.clinic.findFirst({
        where: {
          email: { equals: email, mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (emailConflict) {
        throw new ConflictException('Clinic with this email already exists');
      }
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
   * Soft delete clinic (set isActive to false)
   */
  async remove(id: string) {
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

    // Check if clinic has active doctors
    const activeDoctors = await this.prisma.doctor.count({
      where: {
        clinicId: id,
        isActive: true,
      },
    });

    if (activeDoctors > 0) {
      throw new BadRequestException(
        'Cannot delete clinic with active doctors. Please reassign or deactivate doctors first.',
      );
    }

    // Soft delete by setting isActive to false
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
   * Activate clinic
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
   * Get clinic statistics
   */
  async getClinicStats() {
    const [
      totalClinics,
      activeClinics,
      inactiveClinics,
      clinicsWithDoctors,
      avgDoctorsPerClinic,
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
   * Get doctors by clinic ID
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
