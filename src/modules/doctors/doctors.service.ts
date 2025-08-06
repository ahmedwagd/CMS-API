// src/modules/doctors/doctors.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDoctorDto, UpdateDoctorDto, FilterDoctorDto } from './dto';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDoctorDto: CreateDoctorDto) {
    const { phone, email, socialId, licenseNumber, clinicId, ...doctorData } =
      createDoctorDto;

    // Check for unique constraints
    const existingDoctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
          ...(socialId ? [{ socialId }] : []),
          ...(licenseNumber ? [{ licenseNumber }] : []),
        ],
      },
    });

    if (existingDoctor) {
      if (existingDoctor.phone === phone) {
        throw new ConflictException('Phone number already exists');
      }
      if (existingDoctor.email === email) {
        throw new ConflictException('Email already exists');
      }
      if (existingDoctor.socialId === socialId) {
        throw new ConflictException('Social ID already exists');
      }
      if (existingDoctor.licenseNumber === licenseNumber) {
        throw new ConflictException('License number already exists');
      }
    }

    // Verify clinic exists if provided
    if (clinicId) {
      const clinic = await this.prisma.clinic.findFirst({
        where: { id: clinicId, isActive: true },
      });

      if (!clinic) {
        throw new BadRequestException('Invalid or inactive clinic');
      }
    }

    const doctor = await this.prisma.doctor.create({
      data: {
        ...doctorData,
        phone,
        email,
        socialId,
        licenseNumber,
        clinicId,
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            examinations: true,
            treatmentPlans: true,
          },
        },
      },
    });

    return doctor;
  }

  async findAll(filterDto?: FilterDoctorDto) {
    const {
      page = 1,
      limit = 10,
      search,
      clinicId,
      specialization,
      gender,
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
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (clinicId) {
      where.clinicId = clinicId;
    }

    if (specialization) {
      where.specialization = { contains: specialization, mode: 'insensitive' };
    }

    if (gender) {
      where.gender = gender;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'clinic') {
      orderBy.clinic = { name: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [doctors, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
            },
          },
          _count: {
            select: {
              appointments: true,
              examinations: true,
              treatmentPlans: true,
            },
          },
        },
      }),
      this.prisma.doctor.count({ where }),
    ]);

    return {
      data: doctors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        clinic: true,
        appointments: {
          take: 10,
          orderBy: { date: 'desc' },
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        examinations: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        treatmentPlans: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            appointments: true,
            examinations: true,
            treatmentPlans: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto) {
    const { phone, email, socialId, licenseNumber, clinicId, ...updateData } =
      updateDoctorDto;

    const existingDoctor = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!existingDoctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check for unique constraints if values are being updated
    if (phone || email || socialId || licenseNumber) {
      const conflictingDoctor = await this.prisma.doctor.findFirst({
        where: {
          AND: [
            { id: { not: id } }, // Exclude current doctor
            {
              OR: [
                ...(phone ? [{ phone }] : []),
                ...(email ? [{ email }] : []),
                ...(socialId ? [{ socialId }] : []),
                ...(licenseNumber ? [{ licenseNumber }] : []),
              ],
            },
          ],
        },
      });

      if (conflictingDoctor) {
        if (conflictingDoctor.phone === phone) {
          throw new ConflictException('Phone number already exists');
        }
        if (conflictingDoctor.email === email) {
          throw new ConflictException('Email already exists');
        }
        if (conflictingDoctor.socialId === socialId) {
          throw new ConflictException('Social ID already exists');
        }
        if (conflictingDoctor.licenseNumber === licenseNumber) {
          throw new ConflictException('License number already exists');
        }
      }
    }

    // Verify clinic if provided
    if (clinicId) {
      const clinic = await this.prisma.clinic.findFirst({
        where: { id: clinicId, isActive: true },
      });

      if (!clinic) {
        throw new BadRequestException('Invalid or inactive clinic');
      }
    }

    const doctor = await this.prisma.doctor.update({
      where: { id },
      data: {
        ...updateData,
        ...(phone && { phone }),
        ...(email && { email }),
        ...(socialId && { socialId }),
        ...(licenseNumber && { licenseNumber }),
        ...(clinicId && { clinicId }),
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            examinations: true,
            treatmentPlans: true,
          },
        },
      },
    });

    return doctor;
  }

  async remove(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            appointments: true,
            examinations: true,
            treatmentPlans: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check if doctor has associated records
    const hasAssociatedRecords =
      doctor._count.appointments > 0 ||
      doctor._count.examinations > 0 ||
      doctor._count.treatmentPlans > 0;

    if (hasAssociatedRecords) {
      // Soft delete - set isActive to false
      return this.prisma.doctor.update({
        where: { id },
        data: { isActive: false },
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
            },
          },
        },
      });
    } else {
      // Hard delete if no associated records
      return this.prisma.doctor.delete({
        where: { id },
      });
    }
  }

  async activate(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return this.prisma.doctor.update({
      where: { id },
      data: { isActive: true },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });
  }

  async getDoctorStats() {
    const [
      totalDoctors,
      activeDoctors,
      inactiveDoctors,
      doctorsByClinic,
      doctorsBySpecialization,
      doctorsWithRecentActivity,
    ] = await Promise.all([
      this.prisma.doctor.count(),
      this.prisma.doctor.count({ where: { isActive: true } }),
      this.prisma.doctor.count({ where: { isActive: false } }),
      this.prisma.doctor.groupBy({
        by: ['clinicId'],
        _count: true,
        where: { isActive: true, clinicId: { not: null } },
      }),
      this.prisma.doctor.groupBy({
        by: ['specialization'],
        _count: true,
        where: {
          isActive: true,
          specialization: { not: null },
        },
      }),
      this.prisma.doctor.count({
        where: {
          isActive: true,
          appointments: {
            some: {
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
        },
      }),
    ]);

    // Get clinic names for grouped data
    const clinicIds = doctorsByClinic
      .map((item) => item.clinicId)
      .filter(Boolean);
    const clinics = await this.prisma.clinic.findMany({
      where: { id: { in: clinicIds as string[] } },
      select: { id: true, name: true },
    });

    const clinicMap = new Map(
      clinics.map((clinic) => [clinic.id, clinic.name]),
    );

    const doctorsByClinicWithNames = doctorsByClinic.map((item) => ({
      clinic: clinicMap.get(item.clinicId as string) || 'Unknown',
      count: item._count,
    }));

    const doctorsBySpecializationFormatted = doctorsBySpecialization.map(
      (item) => ({
        specialization: item.specialization || 'General',
        count: item._count,
      }),
    );

    return {
      totalDoctors,
      activeDoctors,
      inactiveDoctors,
      doctorsWithRecentActivity,
      doctorsByClinic: doctorsByClinicWithNames,
      doctorsBySpecialization: doctorsBySpecializationFormatted,
    };
  }

  async getDoctorAppointments(
    doctorId: string,
    filterDto?: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
    } = filterDto || {};

    const skip = (page - 1) * limit;
    const where: any = { doctorId };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async assignToClinic(doctorId: string, clinicId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const clinic = await this.prisma.clinic.findFirst({
      where: { id: clinicId, isActive: true },
    });

    if (!clinic) {
      throw new BadRequestException('Invalid or inactive clinic');
    }

    return this.prisma.doctor.update({
      where: { id: doctorId },
      data: { clinicId },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });
  }

  async removeFromClinic(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return this.prisma.doctor.update({
      where: { id: doctorId },
      data: { clinicId: null },
    });
  }
}
