import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  FilterDoctorDto,
  DoctorAppointmentFilterDto,
} from './dto';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDoctorDto: CreateDoctorDto) {
    const { phone, email, socialId, licenseNumber, clinicId, ...doctorData } =
      createDoctorDto;

    // Check for existing doctor with unique fields
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

    // Validate clinic if provided
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
            manager: true,
            email: true,
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
    const where: any = {};

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { socialId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filters
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

    // Sorting
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
              manager: true,
              email: true,
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
        clinic: {
          include: {
            _count: {
              select: {
                doctors: true,
              },
            },
          },
        },
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
                birthDate: true,
                gender: true,
              },
            },
            invoice: {
              select: {
                id: true,
                amount: true,
                status: true,
                dueDate: true,
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
                birthDate: true,
                gender: true,
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
                birthDate: true,
                gender: true,
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

    // Check for conflicts with unique fields
    if (phone || email || socialId || licenseNumber) {
      const conflictingDoctor = await this.prisma.doctor.findFirst({
        where: {
          AND: [
            { id: { not: id } },
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

    // Validate clinic if provided
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
        ...(clinicId !== undefined && { clinicId }),
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            manager: true,
            email: true,
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

    const hasAssociatedRecords =
      doctor._count.appointments > 0 ||
      doctor._count.examinations > 0 ||
      doctor._count.treatmentPlans > 0;

    if (hasAssociatedRecords) {
      // Soft delete by setting isActive to false
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
      unassignedDoctors,
      doctorsByGender,
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
      this.prisma.doctor.count({
        where: { isActive: true, clinicId: null },
      }),
      this.prisma.doctor.groupBy({
        by: ['gender'],
        _count: true,
        where: { isActive: true },
      }),
    ]);

    // Get clinic names for the stats
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

    const doctorsByGenderFormatted = doctorsByGender.map((item) => ({
      gender: item.gender,
      count: item._count,
    }));

    return {
      totalDoctors,
      activeDoctors,
      inactiveDoctors,
      unassignedDoctors,
      doctorsWithRecentActivity,
      doctorsByClinic: doctorsByClinicWithNames,
      doctorsBySpecialization: doctorsBySpecializationFormatted,
      doctorsByGender: doctorsByGenderFormatted,
    };
  }

  async getDoctorAppointments(
    doctorId: string,
    filterDto?: DoctorAppointmentFilterDto,
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
              birthDate: true,
              gender: true,
            },
          },
          invoice: {
            select: {
              id: true,
              amount: true,
              status: true,
              dueDate: true,
              paidAt: true,
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
            manager: true,
            email: true,
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
  }

  async getDoctorSchedule(doctorId: string, startDate: Date, endDate: Date) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return appointments;
  }

  async getDoctorWorkload(doctorId: string, year: number, month?: number) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const startDate = month
      ? new Date(year, month - 1, 1)
      : new Date(year, 0, 1);

    const endDate = month ? new Date(year, month, 0) : new Date(year, 11, 31);

    const [appointmentCount, completedAppointments, totalRevenue] =
      await Promise.all([
        this.prisma.appointment.count({
          where: {
            doctorId,
            date: { gte: startDate, lte: endDate },
          },
        }),
        this.prisma.appointment.count({
          where: {
            doctorId,
            date: { gte: startDate, lte: endDate },
            status: 'COMPLETED',
          },
        }),
        this.prisma.invoice.aggregate({
          where: {
            status: 'PAID',
            appointment: {
              doctorId,
              date: { gte: startDate, lte: endDate },
              status: 'COMPLETED',
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

    return {
      appointmentCount,
      completedAppointments,
      completionRate:
        appointmentCount > 0
          ? Math.round((completedAppointments / appointmentCount) * 100)
          : 0,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  }
}
