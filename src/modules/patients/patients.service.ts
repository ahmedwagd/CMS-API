import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto, FilterPatientDto } from './dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPatientDto: CreatePatientDto) {
    const { phone, email, ...patientData } = createPatientDto;

    // Check for existing patient with same phone or email
    const existingPatient = await this.prisma.patient.findFirst({
      where: {
        OR: [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])],
      },
    });

    if (existingPatient) {
      if (existingPatient.phone === phone) {
        throw new ConflictException('Phone number already exists');
      }
      if (existingPatient.email === email) {
        throw new ConflictException('Email already exists');
      }
    }

    const patient = await this.prisma.patient.create({
      data: {
        ...patientData,
        phone,
        email,
      },
      include: {
        wallet: true,
        _count: {
          select: {
            appointments: true,
            examinations: true,
            treatmentPlans: true,
            progressionNotes: true,
          },
        },
      },
    });

    // Create wallet for patient
    if (!patient.wallet) {
      await this.prisma.wallet.create({
        data: {
          patientId: patient.id,
          balance: 0,
          currency: 'USD',
        },
      });
    }

    return patient;
  }

  async findAll(filterDto?: FilterPatientDto) {
    const {
      page = 1,
      limit = 10,
      search,
      gender,
      isActive,
      ageFrom,
      ageTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto || {};

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { occupation: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (gender) {
      where.gender = gender;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    // Age filtering based on birth date
    if (ageFrom || ageTo) {
      const now = new Date();
      where.birthDate = {};

      if (ageFrom) {
        const maxBirthDate = new Date(
          now.getFullYear() - ageFrom,
          now.getMonth(),
          now.getDate(),
        );
        where.birthDate.lte = maxBirthDate;
      }

      if (ageTo) {
        const minBirthDate = new Date(
          now.getFullYear() - ageTo - 1,
          now.getMonth(),
          now.getDate(),
        );
        where.birthDate.gte = minBirthDate;
      }
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          wallet: {
            select: {
              id: true,
              balance: true,
              currency: true,
            },
          },
          _count: {
            select: {
              appointments: true,
              examinations: true,
              treatmentPlans: true,
              progressionNotes: true,
            },
          },
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        wallet: {
          include: {
            transactions: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        appointments: {
          take: 10,
          orderBy: { date: 'desc' },
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
                phone: true,
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
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
              },
            },
          },
        },
        treatmentPlans: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
              },
            },
          },
        },
        progressionNotes: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            appointments: true,
            examinations: true,
            treatmentPlans: true,
            progressionNotes: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    const { phone, email, ...updateData } = updatePatientDto;

    const existingPatient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      throw new NotFoundException('Patient not found');
    }

    // Check for conflicts with phone/email if they're being updated
    if (phone || email) {
      const conflictingPatient = await this.prisma.patient.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(phone ? [{ phone }] : []),
                ...(email ? [{ email }] : []),
              ],
            },
          ],
        },
      });

      if (conflictingPatient) {
        if (conflictingPatient.phone === phone) {
          throw new ConflictException('Phone number already exists');
        }
        if (conflictingPatient.email === email) {
          throw new ConflictException('Email already exists');
        }
      }
    }

    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        ...updateData,
        ...(phone && { phone }),
        ...(email && { email }),
      },
      include: {
        wallet: {
          select: {
            id: true,
            balance: true,
            currency: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            examinations: true,
            treatmentPlans: true,
            progressionNotes: true,
          },
        },
      },
    });

    return patient;
  }

  async remove(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            appointments: true,
            examinations: true,
            treatmentPlans: true,
            progressionNotes: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const hasAssociatedRecords =
      patient._count.appointments > 0 ||
      patient._count.examinations > 0 ||
      patient._count.treatmentPlans > 0 ||
      patient._count.progressionNotes > 0;

    if (hasAssociatedRecords) {
      // Soft delete by setting isActive to false
      return this.prisma.patient.update({
        where: { id },
        data: { isActive: false },
        include: {
          wallet: {
            select: {
              id: true,
              balance: true,
              currency: true,
            },
          },
        },
      });
    } else {
      // Hard delete if no associated records
      return this.prisma.patient.delete({
        where: { id },
      });
    }
  }

  async activate(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.prisma.patient.update({
      where: { id },
      data: { isActive: true },
      include: {
        wallet: {
          select: {
            id: true,
            balance: true,
            currency: true,
          },
        },
      },
    });
  }

  async getPatientStats() {
    const [
      totalPatients,
      activePatients,
      inactivePatients,
      patientsByGender,
      patientsByAgeGroup,
      patientsWithRecentActivity,
      totalWalletBalance,
    ] = await Promise.all([
      this.prisma.patient.count(),
      this.prisma.patient.count({ where: { isActive: true } }),
      this.prisma.patient.count({ where: { isActive: false } }),
      this.prisma.patient.groupBy({
        by: ['gender'],
        _count: true,
        where: { isActive: true },
      }),
      this.getPatientsByAgeGroup(),
      this.prisma.patient.count({
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
      this.prisma.wallet.aggregate({
        _sum: { balance: true },
        where: { patient: { isActive: true } },
      }),
    ]);

    return {
      totalPatients,
      activePatients,
      inactivePatients,
      patientsWithRecentActivity,
      totalWalletBalance: totalWalletBalance._sum.balance || 0,
      patientsByGender: patientsByGender.map((item) => ({
        gender: item.gender,
        count: item._count,
      })),
      patientsByAgeGroup,
    };
  }

  private async getPatientsByAgeGroup() {
    const now = new Date();
    const ageGroups = [
      { name: '0-18', min: 0, max: 18 },
      { name: '19-30', min: 19, max: 30 },
      { name: '31-50', min: 31, max: 50 },
      { name: '51-70', min: 51, max: 70 },
      { name: '70+', min: 71, max: 120 },
    ];

    const results = await Promise.all(
      ageGroups.map(async (group) => {
        const minDate = new Date(
          now.getFullYear() - group.max - 1,
          now.getMonth(),
          now.getDate(),
        );
        const maxDate = new Date(
          now.getFullYear() - group.min,
          now.getMonth(),
          now.getDate(),
        );

        const count = await this.prisma.patient.count({
          where: {
            isActive: true,
            birthDate: {
              gte: minDate,
              lte: maxDate,
            },
          },
        });

        return {
          ageGroup: group.name,
          count,
        };
      }),
    );

    return results;
  }

  async getPatientAppointments(
    patientId: string,
    filterDto?: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
    } = filterDto || {};

    const skip = (page - 1) * limit;
    const where: any = { patientId };

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
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
              phone: true,
              clinic: {
                select: {
                  name: true,
                  address: true,
                },
              },
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

  async addProgressionNote(patientId: string, note: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.prisma.progressionNote.create({
      data: {
        patientId,
        note,
      },
    });
  }

  async getProgressionNotes(
    patientId: string,
    options?: { page?: number; limit?: number },
  ) {
    const { page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const [notes, total] = await Promise.all([
      this.prisma.progressionNote.findMany({
        where: { patientId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.progressionNote.count({ where: { patientId } }),
    ]);

    return {
      data: notes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
