import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BulkActivateDeactivateDto,
  BulkDeleteDto,
  CreatePatientDto,
  FilterPatientDto,
  PatientMedicalSummaryDto,
  PatientMedicalTimelineDto,
  TimelineEventType,
  UpdatePatientDto,
} from './dto';

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

  /**
   * Get comprehensive medical summary for a patient including recent activity
   * @param patientId - The UUID of the patient
   * @param dto - Summary parameters including days back to look
   * @returns Comprehensive medical summary with statistics and recent activities
   * @throws NotFoundException when patient is not found
   */
  async getPatientMedicalSummary(
    patientId: string,
    dto: PatientMedicalSummaryDto = {},
  ) {
    const { daysBack = 30 } = dto;

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        wallet: {
          select: { id: true, balance: true, currency: true },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const [
      totalStats,
      recentStats,
      lastExamination,
      activeTreatmentPlans,
      recentProgressionNotes,
      upcomingAppointments,
      walletTransactions,
    ] = await Promise.all([
      // Total counts
      this.prisma.$transaction([
        this.prisma.examination.count({ where: { patientId } }),
        this.prisma.treatmentPlan.count({ where: { patientId } }),
        this.prisma.progressionNote.count({ where: { patientId } }),
        this.prisma.appointment.count({ where: { patientId } }),
      ]),

      // Recent activity counts
      this.prisma.$transaction([
        this.prisma.examination.count({
          where: { patientId, createdAt: { gte: cutoffDate } },
        }),
        this.prisma.treatmentPlan.count({
          where: { patientId, createdAt: { gte: cutoffDate } },
        }),
        this.prisma.progressionNote.count({
          where: { patientId, createdAt: { gte: cutoffDate } },
        }),
        this.prisma.appointment.count({
          where: { patientId, createdAt: { gte: cutoffDate } },
        }),
      ]),

      // Last examination
      this.prisma.examination.findFirst({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: {
            select: { id: true, name: true, specialization: true },
          },
        },
      }),

      // Active treatment plans (recent ones)
      this.prisma.treatmentPlan.findMany({
        where: {
          patientId,
          createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: {
            select: { id: true, name: true, specialization: true },
          },
        },
      }),

      // Recent progression notes
      this.prisma.progressionNote.findMany({
        where: { patientId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),

      // Upcoming appointments
      this.prisma.appointment.findMany({
        where: {
          patientId,
          date: { gte: new Date() },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        take: 5,
        orderBy: { date: 'asc' },
        include: {
          doctor: {
            select: { id: true, name: true, specialization: true, phone: true },
          },
          invoice: {
            select: { id: true, amount: true, status: true, dueDate: true },
          },
        },
      }),

      // Recent wallet transactions
      patient.wallet
        ? this.prisma.walletTransaction.findMany({
            where: { walletId: patient.wallet.id },
            take: 10,
            orderBy: { createdAt: 'desc' },
          })
        : [],
    ]);

    return {
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        isActive: patient.isActive,
        wallet: patient.wallet,
      },
      summary: {
        totalCounts: {
          examinations: totalStats[0],
          treatmentPlans: totalStats[1],
          progressionNotes: totalStats[2],
          appointments: totalStats[3],
        },
        recentActivity: {
          examinations: recentStats[0],
          treatmentPlans: recentStats[1],
          progressionNotes: recentStats[2],
          appointments: recentStats[3],
          periodDays: daysBack,
        },
        lastExamination,
        activeTreatmentPlans,
        recentProgressionNotes,
        upcomingAppointments,
        recentWalletTransactions: walletTransactions,
      },
      healthInsights: {
        hasRecentActivity: recentStats.some((count) => count > 0),
        needsFollowUp: upcomingAppointments.length === 0 && totalStats[0] > 0,
        walletStatus: patient.wallet
          ? Number(patient.wallet.balance) > 0
            ? 'positive'
            : 'zero_or_negative'
          : 'no_wallet',
      },
    };
  }

  /**
   * Get patient medical timeline with all events in chronological order
   * @param patientId - The UUID of the patient
   * @param dto - Timeline filtering parameters
   * @returns Chronological timeline of all medical events
   * @throws NotFoundException when patient is not found
   */
  async getPatientMedicalTimeline(
    patientId: string,
    dto: PatientMedicalTimelineDto = {},
  ) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, name: true, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const {
      startDate,
      endDate,
      eventType = TimelineEventType.ALL,
      page = 1,
      limit = 20,
    } = dto;

    const skip = (page - 1) * limit;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const timelineEvents: any[] = [];

    // Fetch different types of events based on filter
    const promises: Promise<any>[] = [];

    if (
      eventType === TimelineEventType.ALL ||
      eventType === TimelineEventType.EXAMINATION
    ) {
      promises.push(
        this.prisma.examination
          .findMany({
            where: {
              patientId,
              ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
            },
            include: {
              doctor: {
                select: { id: true, name: true, specialization: true },
              },
            },
          })
          .then((items) =>
            items.map((item) => ({
              ...item,
              eventType: 'examination',
              eventDate: item.createdAt,
              title: 'Medical Examination',
              description:
                item.subjectiveDescription || 'Medical examination performed',
            })),
          ),
      );
    }

    if (
      eventType === TimelineEventType.ALL ||
      eventType === TimelineEventType.TREATMENT_PLAN
    ) {
      promises.push(
        this.prisma.treatmentPlan
          .findMany({
            where: {
              patientId,
              ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
            },
            include: {
              doctor: {
                select: { id: true, name: true, specialization: true },
              },
            },
          })
          .then((items) =>
            items.map((item) => ({
              ...item,
              eventType: 'treatment_plan',
              eventDate: item.createdAt,
              title: 'Treatment Plan',
              description:
                item.description.substring(0, 100) +
                (item.description.length > 100 ? '...' : ''),
            })),
          ),
      );
    }

    if (
      eventType === TimelineEventType.ALL ||
      eventType === TimelineEventType.PROGRESSION_NOTE
    ) {
      promises.push(
        this.prisma.progressionNote
          .findMany({
            where: {
              patientId,
              ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
            },
          })
          .then((items) =>
            items.map((item) => ({
              ...item,
              eventType: 'progression_note',
              eventDate: item.createdAt,
              title: 'Progression Note',
              description:
                item.note.substring(0, 100) +
                (item.note.length > 100 ? '...' : ''),
            })),
          ),
      );
    }

    if (
      eventType === TimelineEventType.ALL ||
      eventType === TimelineEventType.APPOINTMENT
    ) {
      promises.push(
        this.prisma.appointment
          .findMany({
            where: {
              patientId,
              ...(Object.keys(dateFilter).length && { date: dateFilter }),
            },
            include: {
              doctor: {
                select: { id: true, name: true, specialization: true },
              },
              invoice: {
                select: { amount: true, status: true },
              },
            },
          })
          .then((items) =>
            items.map((item) => ({
              ...item,
              eventType: 'appointment',
              eventDate: item.date,
              title: `Appointment - ${item.status}`,
              description:
                item.notes || `Appointment with Dr. ${item.doctor.name}`,
            })),
          ),
      );
    }

    const results = await Promise.all(promises);

    // Flatten and sort all events by date
    const allEvents = results
      .flat()
      .sort(
        (a, b) =>
          new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
      );

    // Apply pagination to sorted events
    const paginatedEvents = allEvents.slice(skip, skip + limit);
    const total = allEvents.length;

    return {
      patient,
      data: paginatedEvents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        totalEvents: total,
        eventTypes: {
          examinations: results[0]?.length || 0,
          treatmentPlans: results[1]?.length || 0,
          progressionNotes: results[2]?.length || 0,
          appointments: results[3]?.length || 0,
        },
      },
    };
  }

  /**
   * Bulk activate or deactivate multiple patients
   * @param dto - Bulk operation parameters
   * @returns Summary of the bulk operation results
   * @throws BadRequestException when no valid patient IDs provided
   */
  async bulkActivateDeactivate(dto: BulkActivateDeactivateDto) {
    const { patientIds, isActive } = dto;

    if (!patientIds || patientIds.length === 0) {
      throw new BadRequestException('At least one patient ID must be provided');
    }

    // Verify all patients exist
    const existingPatients = await this.prisma.patient.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, name: true, isActive: true },
    });

    const existingIds = existingPatients.map((p) => p.id);
    const notFoundIds = patientIds.filter((id) => !existingIds.includes(id));

    if (notFoundIds.length > 0) {
      throw new NotFoundException(
        `Patients not found: ${notFoundIds.join(', ')}`,
      );
    }

    // Perform bulk update
    const result = await this.prisma.patient.updateMany({
      where: { id: { in: patientIds } },
      data: { isActive },
    });

    // Get updated patients for response
    const updatedPatients = await this.prisma.patient.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, name: true, isActive: true },
    });

    return {
      operation: isActive ? 'activate' : 'deactivate',
      requested: patientIds.length,
      successful: result.count,
      failed: patientIds.length - result.count,
      notFound: notFoundIds,
      updatedPatients,
    };
  }

  /**
   * Bulk delete multiple patients with safety checks
   * @param dto - Bulk delete parameters
   * @returns Summary of the bulk delete operation results
   * @throws BadRequestException when patients have associated records and forceDelete is false
   */
  async bulkDelete(dto: BulkDeleteDto) {
    const { patientIds, forceDelete = false } = dto;

    if (!patientIds || patientIds.length === 0) {
      throw new BadRequestException('At least one patient ID must be provided');
    }

    // Get patients with their record counts
    const patients = await this.prisma.patient.findMany({
      where: { id: { in: patientIds } },
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

    const existingIds = patients.map((p) => p.id);
    const notFoundIds = patientIds.filter((id) => !existingIds.includes(id));

    if (patients.length === 0) {
      throw new NotFoundException('No valid patients found');
    }

    const patientsWithRecords = patients.filter(
      (p) =>
        p._count.appointments > 0 ||
        p._count.examinations > 0 ||
        p._count.treatmentPlans > 0 ||
        p._count.progressionNotes > 0,
    );

    if (patientsWithRecords.length > 0 && !forceDelete) {
      // Instead of deleting, deactivate patients with records
      await this.prisma.patient.updateMany({
        where: { id: { in: patientsWithRecords.map((p) => p.id) } },
        data: { isActive: false },
      });

      // Delete patients without records
      const patientsToDelete = patients.filter(
        (p) =>
          p._count.appointments === 0 &&
          p._count.examinations === 0 &&
          p._count.treatmentPlans === 0 &&
          p._count.progressionNotes === 0,
      );

      if (patientsToDelete.length > 0) {
        await this.prisma.patient.deleteMany({
          where: { id: { in: patientsToDelete.map((p) => p.id) } },
        });
      }

      return {
        operation: 'bulk_delete_safe',
        requested: patientIds.length,
        deactivated: patientsWithRecords.length,
        deleted: patientsToDelete.length,
        notFound: notFoundIds.length,
        patientsWithRecords: patientsWithRecords.map((p) => ({
          id: p.id,
          name: p.name,
          recordCounts: p._count,
        })),
        message:
          'Patients with medical records were deactivated instead of deleted. Use forceDelete=true to permanently delete.',
      };
    } else {
      // Force delete or no records exist
      const deleteResult = await this.prisma.patient.deleteMany({
        where: { id: { in: existingIds } },
      });

      return {
        operation: 'bulk_delete_force',
        requested: patientIds.length,
        deleted: deleteResult.count,
        notFound: notFoundIds.length,
        deletedPatients: patients.map((p) => ({ id: p.id, name: p.name })),
      };
    }
  }

  /**
   * Get patients due for follow-up based on last activity
   * @param daysThreshold - Number of days since last activity to consider for follow-up
   * @returns List of patients due for follow-up
   */
  async getPatientsForFollowUp(daysThreshold: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    const patientsForFollowUp = await this.prisma.patient.findMany({
      where: {
        isActive: true,
        OR: [
          // Patients with no recent appointments
          {
            appointments: {
              none: {
                date: { gte: cutoffDate },
              },
            },
          },
          // Patients with no recent progression notes
          {
            progressionNotes: {
              none: {
                createdAt: { gte: cutoffDate },
              },
            },
          },
        ],
        // But have had some medical activity in the past
        AND: [
          {
            OR: [
              { appointments: { some: {} } },
              { examinations: { some: {} } },
              { treatmentPlans: { some: {} } },
              { progressionNotes: { some: {} } },
            ],
          },
        ],
      },
      include: {
        _count: {
          select: {
            appointments: true,
            examinations: true,
            treatmentPlans: true,
            progressionNotes: true,
          },
        },
        appointments: {
          take: 1,
          orderBy: { date: 'desc' },
          include: {
            doctor: {
              select: { name: true, specialization: true },
            },
          },
        },
        progressionNotes: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'asc' },
    });

    return patientsForFollowUp.map((patient) => ({
      patient: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
      },
      lastActivity: {
        lastAppointment: patient.appointments[0] || null,
        lastProgressionNote: patient.progressionNotes[0] || null,
        daysSinceLastUpdate: Math.floor(
          (Date.now() - patient.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
        ),
      },
      recordCounts: patient._count,
      priority: this.calculateFollowUpPriority(patient, daysThreshold),
    }));
  }

  /**
   * Calculate follow-up priority based on patient data
   * @private
   */
  private calculateFollowUpPriority(
    patient: any,
    daysThreshold: number,
  ): 'high' | 'medium' | 'low' {
    const daysSinceUpdate = Math.floor(
      (Date.now() - patient.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const hasActiveRecords =
      patient._count.treatmentPlans > 0 || patient._count.examinations > 0;

    if (daysSinceUpdate > daysThreshold * 1.5 && hasActiveRecords) {
      return 'high';
    } else if (daysSinceUpdate > daysThreshold && hasActiveRecords) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}
