import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AddExaminationDto,
  AddTreatmentPlanDto,
  AnalyticsPeriod,
  ExaminationSearchDto,
  MedicalRecordsAnalyticsDto,
} from './dto';
import {
  FilterMedicalRecordsDto,
  MedicalRecordType,
} from './dto/filter-medical-records.dto';

@Injectable()
export class MedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves comprehensive medical records for a specific patient
   * @param patientId - The UUID of the patient
   * @param filterDto - Optional filtering and pagination parameters
   * @returns Paginated medical records including examinations, treatment plans, and progression notes
   * @throws NotFoundException when patient is not found
   * @throws BadRequestException when filter parameters are invalid
   */
  async getPatientMedicalRecords(
    patientId: string,
    filterDto?: FilterMedicalRecordsDto,
  ) {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, name: true, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const {
      page = 1,
      limit = 10,
      recordType,
      doctorId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto || {};

    const skip = (page - 1) * limit;

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
    }

    // Build doctor filter
    const doctorFilter = doctorId ? { doctorId } : {};

    const orderBy = { [sortBy]: sortOrder };

    // Fetch records based on type or all if not specified
    const promises: Promise<any>[] = [];

    if (!recordType || recordType === MedicalRecordType.EXAMINATION) {
      promises.push(
        this.prisma.examination.findMany({
          where: {
            patientId,
            ...doctorFilter,
            ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
          },
          skip: !recordType ? skip : 0,
          take: !recordType ? limit : undefined,
          orderBy,
          include: {
            patient: {
              select: { id: true, name: true, phone: true, email: true },
            },
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
                phone: true,
              },
            },
          },
        }),
        this.prisma.examination.count({
          where: {
            patientId,
            ...doctorFilter,
            ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
          },
        }),
      );
    }

    if (!recordType || recordType === MedicalRecordType.TREATMENT_PLAN) {
      promises.push(
        this.prisma.treatmentPlan.findMany({
          where: {
            patientId,
            ...doctorFilter,
            ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
          },
          skip: !recordType ? skip : 0,
          take: !recordType ? limit : undefined,
          orderBy,
          include: {
            patient: {
              select: { id: true, name: true, phone: true, email: true },
            },
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
                phone: true,
              },
            },
          },
        }),
        this.prisma.treatmentPlan.count({
          where: {
            patientId,
            ...doctorFilter,
            ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
          },
        }),
      );
    }

    if (!recordType || recordType === MedicalRecordType.PROGRESSION_NOTE) {
      promises.push(
        this.prisma.progressionNote.findMany({
          where: {
            patientId,
            ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
          },
          skip: !recordType ? skip : 0,
          take: !recordType ? limit : undefined,
          orderBy,
          include: {
            patient: {
              select: { id: true, name: true, phone: true, email: true },
            },
          },
        }),
        this.prisma.progressionNote.count({
          where: {
            patientId,
            ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
          },
        }),
      );
    }

    const results = await Promise.all(promises);

    // Organize results based on record type filter
    if (recordType === MedicalRecordType.EXAMINATION) {
      const [examinations, total] = results;
      return {
        patient,
        data: {
          examinations,
          treatmentPlans: [],
          progressionNotes: [],
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }

    if (recordType === MedicalRecordType.TREATMENT_PLAN) {
      const [treatmentPlans, total] = results;
      return {
        patient,
        data: {
          examinations: [],
          treatmentPlans,
          progressionNotes: [],
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }

    if (recordType === MedicalRecordType.PROGRESSION_NOTE) {
      const [progressionNotes, total] = results;
      return {
        patient,
        data: {
          examinations: [],
          treatmentPlans: [],
          progressionNotes,
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }

    // If no specific record type, return all with combined pagination
    const [
      examinations,
      examinationsCount,
      treatmentPlans,
      treatmentPlansCount,
      progressionNotes,
      progressionNotesCount,
    ] = results;
    const totalRecords =
      examinationsCount + treatmentPlansCount + progressionNotesCount;

    return {
      patient,
      data: {
        examinations,
        treatmentPlans,
        progressionNotes,
      },
      pagination: {
        page,
        limit,
        total: totalRecords,
        pages: Math.ceil(totalRecords / limit),
      },
      summary: {
        totalExaminations: examinationsCount,
        totalTreatmentPlans: treatmentPlansCount,
        totalProgressionNotes: progressionNotesCount,
      },
    };
  }

  /**
   * Adds a new examination record for a patient
   * @param patientId - The UUID of the patient
   * @param dto - The examination data to be added
   * @returns The created examination record with related patient and doctor information
   * @throws NotFoundException when patient or doctor is not found
   * @throws BadRequestException when validation fails
   */
  async addExamination(patientId: string, dto: AddExaminationDto) {
    // Verify patient exists and is active
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found or inactive');
    }

    // Verify doctor exists and is active
    const doctor = await this.prisma.doctor.findFirst({
      where: { id: dto.doctorId, isActive: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found or inactive');
    }

    const examination = await this.prisma.examination.create({
      data: {
        patientId,
        doctorId: dto.doctorId,
        subjectivePainScale: dto.subjectivePainScale,
        subjectiveLocation: dto.subjectiveLocation,
        subjectiveDescription: dto.subjectiveDescription,
        subjectiveAggravatingFactors: dto.subjectiveAggravatingFactors,
        objectivePosture: dto.objectivePosture,
        objectiveRegion: dto.objectiveRegion,
        objectivePhysiologicalMotion: dto.objectivePhysiologicalMotion,
        palpation: dto.palpation,
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, email: true },
        },
        doctor: {
          select: { id: true, name: true, specialization: true, phone: true },
        },
      },
    });

    return examination;
  }

  /**
   * Adds a new treatment plan for a patient
   * @param patientId - The UUID of the patient
   * @param dto - The treatment plan data to be added
   * @returns The created treatment plan with related patient and doctor information
   * @throws NotFoundException when patient or doctor is not found
   * @throws BadRequestException when validation fails
   */
  async addTreatmentPlan(patientId: string, dto: AddTreatmentPlanDto) {
    // Verify patient exists and is active
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found or inactive');
    }

    // Verify doctor exists and is active
    const doctor = await this.prisma.doctor.findFirst({
      where: { id: dto.doctorId, isActive: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found or inactive');
    }

    const treatmentPlan = await this.prisma.treatmentPlan.create({
      data: {
        patientId,
        doctorId: dto.doctorId,
        description: dto.description,
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, email: true },
        },
        doctor: {
          select: { id: true, name: true, specialization: true, phone: true },
        },
      },
    });

    return treatmentPlan;
  }

  /**
   * Adds a new progression note for a patient
   * @param patientId - The UUID of the patient
   * @param note - The progression note content
   * @returns The created progression note with patient information
   * @throws NotFoundException when patient is not found
   * @throws BadRequestException when note content is invalid
   */
  async addProgressionNote(patientId: string, note: string) {
    // Verify patient exists and is active
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found or inactive');
    }

    if (!note || note.trim().length === 0) {
      throw new BadRequestException('Progression note content cannot be empty');
    }

    const progressionNote = await this.prisma.progressionNote.create({
      data: {
        patientId,
        note: note.trim(),
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });

    return progressionNote;
  }

  /**
   * Updates an existing examination record
   * @param examinationId - The UUID of the examination to update
   * @param dto - The updated examination data
   * @returns The updated examination record
   * @throws NotFoundException when examination is not found
   */
  async updateExamination(
    examinationId: string,
    dto: Partial<AddExaminationDto>,
  ) {
    const existingExamination = await this.prisma.examination.findUnique({
      where: { id: examinationId },
    });

    if (!existingExamination) {
      throw new NotFoundException('Examination not found');
    }

    // If doctorId is being updated, verify the new doctor exists
    if (dto.doctorId) {
      const doctor = await this.prisma.doctor.findFirst({
        where: { id: dto.doctorId, isActive: true },
      });

      if (!doctor) {
        throw new NotFoundException('Doctor not found or inactive');
      }
    }

    const examination = await this.prisma.examination.update({
      where: { id: examinationId },
      data: dto,
      include: {
        patient: {
          select: { id: true, name: true, phone: true, email: true },
        },
        doctor: {
          select: { id: true, name: true, specialization: true, phone: true },
        },
      },
    });

    return examination;
  }

  /**
   * Updates an existing treatment plan
   * @param treatmentPlanId - The UUID of the treatment plan to update
   * @param dto - The updated treatment plan data
   * @returns The updated treatment plan record
   * @throws NotFoundException when treatment plan is not found
   */
  async updateTreatmentPlan(
    treatmentPlanId: string,
    dto: Partial<AddTreatmentPlanDto>,
  ) {
    const existingTreatmentPlan = await this.prisma.treatmentPlan.findUnique({
      where: { id: treatmentPlanId },
    });

    if (!existingTreatmentPlan) {
      throw new NotFoundException('Treatment plan not found');
    }

    // If doctorId is being updated, verify the new doctor exists
    if (dto.doctorId) {
      const doctor = await this.prisma.doctor.findFirst({
        where: { id: dto.doctorId, isActive: true },
      });

      if (!doctor) {
        throw new NotFoundException('Doctor not found or inactive');
      }
    }

    const treatmentPlan = await this.prisma.treatmentPlan.update({
      where: { id: treatmentPlanId },
      data: dto,
      include: {
        patient: {
          select: { id: true, name: true, phone: true, email: true },
        },
        doctor: {
          select: { id: true, name: true, specialization: true, phone: true },
        },
      },
    });

    return treatmentPlan;
  }

  /**
   * Retrieves medical records statistics for a patient
   * @param patientId - The UUID of the patient
   * @returns Statistical summary of patient's medical records
   * @throws NotFoundException when patient is not found
   */
  async getPatientMedicalRecordsStats(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const [
      totalExaminations,
      totalTreatmentPlans,
      totalProgressionNotes,
      recentExaminations,
      activeTreatmentPlans,
      recentProgressionNotes,
    ] = await Promise.all([
      this.prisma.examination.count({ where: { patientId } }),
      this.prisma.treatmentPlan.count({ where: { patientId } }),
      this.prisma.progressionNote.count({ where: { patientId } }),
      this.prisma.examination.count({
        where: {
          patientId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      this.prisma.treatmentPlan.count({
        where: {
          patientId,
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
      }),
      this.prisma.progressionNote.count({
        where: {
          patientId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      patient: {
        id: patient.id,
        name: patient.name,
      },
      totals: {
        examinations: totalExaminations,
        treatmentPlans: totalTreatmentPlans,
        progressionNotes: totalProgressionNotes,
      },
      recent: {
        examinationsLast30Days: recentExaminations,
        treatmentPlansLast90Days: activeTreatmentPlans,
        progressionNotesLast7Days: recentProgressionNotes,
      },
    };
  }

  /**
   * Get comprehensive analytics for medical records
   * @param dto - Analytics parameters including period and filters
   * @returns Detailed analytics including trends, patterns, and insights
   */
  async getMedicalRecordsAnalytics(dto: MedicalRecordsAnalyticsDto = {}) {
    const {
      period = AnalyticsPeriod.MONTH,
      startDate,
      endDate,
      doctorIds,
    } = dto;

    const now = new Date();
    let defaultStartDate: Date;

    switch (period) {
      case AnalyticsPeriod.WEEK:
        defaultStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsPeriod.QUARTER:
        defaultStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsPeriod.YEAR:
        defaultStartDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const dateFilter = {
      gte: startDate ? new Date(startDate) : defaultStartDate,
      lte: endDate ? new Date(endDate) : now,
    };

    const doctorFilter = doctorIds ? { doctorId: { in: doctorIds } } : {};

    const [
      examinationStats,
      treatmentPlanStats,
      progressionNoteStats,
      doctorActivityStats,
      painScaleDistribution,
      commonBodyRegions,
      activityTrends,
    ] = await Promise.all([
      // Examination statistics
      this.prisma.examination.aggregate({
        where: {
          createdAt: dateFilter,
          ...doctorFilter,
        },
        _count: true,
        _avg: { subjectivePainScale: true },
        _max: { subjectivePainScale: true },
        _min: { subjectivePainScale: true },
      }),

      // Treatment plan statistics
      this.prisma.treatmentPlan.aggregate({
        where: {
          createdAt: dateFilter,
          ...doctorFilter,
        },
        _count: true,
      }),

      // Progression note statistics
      this.prisma.progressionNote.aggregate({
        where: { createdAt: dateFilter },
        _count: true,
      }),

      // Doctor activity statistics
      this.prisma.examination.groupBy({
        by: ['doctorId'],
        where: {
          createdAt: dateFilter,
          ...doctorFilter,
        },
        _count: true,
      }),

      // Pain scale distribution
      this.prisma.examination.groupBy({
        by: ['subjectivePainScale'],
        where: {
          createdAt: dateFilter,
          subjectivePainScale: { not: null },
          ...doctorFilter,
        },
        _count: true,
      }),

      // Common body regions
      this.prisma.examination.findMany({
        where: {
          createdAt: dateFilter,
          subjectiveLocation: { not: null },
          ...doctorFilter,
        },
        select: { subjectiveLocation: true },
      }),

      // Daily activity trends
      this.getDailyActivityTrends(dateFilter, doctorFilter),
    ]);

    // Process doctor activity stats
    const doctorIds_analytics = doctorActivityStats.map(
      (stat) => stat.doctorId,
    );
    const doctors = await this.prisma.doctor.findMany({
      where: { id: { in: doctorIds_analytics } },
      select: { id: true, name: true, specialization: true },
    });

    const doctorActivityWithNames = doctorActivityStats
      .map((stat) => {
        const doctor = doctors.find((d) => d.id === stat.doctorId);
        return {
          doctor: doctor || {
            id: stat.doctorId,
            name: 'Unknown',
            specialization: null,
          },
          examinationCount: stat._count,
        };
      })
      .sort((a, b) => b.examinationCount - a.examinationCount);

    // Process body regions
    const bodyRegionCounts = commonBodyRegions
      .filter((exam) => exam.subjectiveLocation)
      .reduce((acc: Record<string, number>, exam) => {
        const region = exam.subjectiveLocation!.toLowerCase().trim();
        acc[region] = (acc[region] || 0) + 1;
        return acc;
      }, {});

    const topBodyRegions = Object.entries(bodyRegionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([region, count]) => ({ region, count }));

    return {
      period: {
        type: period,
        startDate: dateFilter.gte,
        endDate: dateFilter.lte,
        totalDays: Math.ceil(
          (dateFilter.lte.getTime() - dateFilter.gte.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      },
      summary: {
        totalExaminations: examinationStats._count,
        totalTreatmentPlans: treatmentPlanStats._count,
        totalProgressionNotes: progressionNoteStats._count,
        totalMedicalEvents:
          examinationStats._count +
          treatmentPlanStats._count +
          progressionNoteStats._count,
      },
      insights: {
        averagePainScale: examinationStats._avg.subjectivePainScale,
        highestPainScale: examinationStats._max.subjectivePainScale,
        lowestPainScale: examinationStats._min.subjectivePainScale,
        activeDoctors: doctorActivityWithNames.length,
        topPerformingDoctor: doctorActivityWithNames[0] || null,
      },
      distributions: {
        painScale: painScaleDistribution.map((item) => ({
          painLevel: item.subjectivePainScale,
          count: item._count,
          percentage:
            examinationStats._count > 0
              ? Math.round((item._count / examinationStats._count) * 100)
              : 0,
        })),
        bodyRegions: topBodyRegions,
      },
      doctorActivity: doctorActivityWithNames,
      trends: activityTrends,
    };
  }

  /**
   * Get daily activity trends for the specified period
   * @private
   */
  private async getDailyActivityTrends(dateFilter: any, doctorFilter: any) {
    const startDate = dateFilter.gte;
    const endDate = dateFilter.lte;
    const trends: any[] = [];

    // Generate date range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const [examinations, treatmentPlans, progressionNotes] =
        await Promise.all([
          this.prisma.examination.count({
            where: {
              createdAt: { gte: dayStart, lte: dayEnd },
              ...doctorFilter,
            },
          }),
          this.prisma.treatmentPlan.count({
            where: {
              createdAt: { gte: dayStart, lte: dayEnd },
              ...doctorFilter,
            },
          }),
          this.prisma.progressionNote.count({
            where: {
              createdAt: { gte: dayStart, lte: dayEnd },
            },
          }),
        ]);

      trends.push({
        date: new Date(currentDate),
        examinations,
        treatmentPlans,
        progressionNotes,
        total: examinations + treatmentPlans + progressionNotes,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trends;
  }

  /**
   * Advanced search for examinations with multiple criteria
   * @param dto - Search parameters including text search, pain scale, and body regions
   * @returns Filtered examination results with relevance scoring
   */
  async searchExaminations(dto: ExaminationSearchDto) {
    const {
      searchTerm,
      painScaleMin,
      painScaleMax,
      bodyRegions,
      page = 1,
      limit = 10,
    } = dto;

    const skip = (page - 1) * limit;
    const where: any = {};

    // Text search across multiple fields
    if (searchTerm) {
      where.OR = [
        {
          subjectiveDescription: { contains: searchTerm, mode: 'insensitive' },
        },
        { subjectiveLocation: { contains: searchTerm, mode: 'insensitive' } },
        {
          subjectiveAggravatingFactors: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        { objectivePosture: { contains: searchTerm, mode: 'insensitive' } },
        { objectiveRegion: { contains: searchTerm, mode: 'insensitive' } },
        {
          objectivePhysiologicalMotion: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        { palpation: { contains: searchTerm, mode: 'insensitive' } },
        { patient: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { doctor: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    // Pain scale range filter
    if (painScaleMin !== undefined || painScaleMax !== undefined) {
      where.subjectivePainScale = {};
      if (painScaleMin !== undefined)
        where.subjectivePainScale.gte = painScaleMin;
      if (painScaleMax !== undefined)
        where.subjectivePainScale.lte = painScaleMax;
    }

    // Body regions filter
    if (bodyRegions && bodyRegions.length > 0) {
      where.OR = where.OR ? [...where.OR] : [];
      bodyRegions.forEach((region) => {
        where.OR.push({
          OR: [
            { subjectiveLocation: { contains: region, mode: 'insensitive' } },
            { objectiveRegion: { contains: region, mode: 'insensitive' } },
          ],
        });
      });
    }

    const [examinations, total] = await Promise.all([
      this.prisma.examination.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: { id: true, name: true, phone: true, email: true },
          },
          doctor: {
            select: { id: true, name: true, specialization: true, phone: true },
          },
        },
      }),
      this.prisma.examination.count({ where }),
    ]);

    // Calculate relevance scores if search term provided
    const examinationsWithRelevance = examinations.map((exam) => {
      let relevanceScore = 0;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const fields = [
          exam.subjectiveDescription,
          exam.subjectiveLocation,
          exam.subjectiveAggravatingFactors,
          exam.objectivePosture,
          exam.objectiveRegion,
          exam.objectivePhysiologicalMotion,
          exam.palpation,
          exam.patient?.name,
          exam.doctor?.name,
        ];

        fields.forEach((field) => {
          if (field && field.toLowerCase().includes(term)) {
            relevanceScore += 1;
          }
        });
      }

      return {
        ...exam,
        relevanceScore,
      };
    });

    return {
      data: examinationsWithRelevance.sort(
        (a, b) => b.relevanceScore - a.relevanceScore,
      ),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      searchCriteria: {
        searchTerm,
        painScaleRange: {
          min: painScaleMin,
          max: painScaleMax,
        },
        bodyRegions,
      },
    };
  }

  /**
   * Export medical records data for a patient in structured format
   * @param patientId - The UUID of the patient
   * @param options - Export options including format and date range
   * @returns Formatted medical records data suitable for export
   * @throws NotFoundException when patient is not found
   */
  async exportPatientMedicalRecords(
    patientId: string,
    options: {
      startDate?: string;
      endDate?: string;
      includePersonalInfo?: boolean;
    } = {},
  ) {
    const { startDate, endDate, includePersonalInfo = false } = options;

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const [examinations, treatmentPlans, progressionNotes] = await Promise.all([
      this.prisma.examination.findMany({
        where: {
          patientId,
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
        },
        include: {
          doctor: {
            select: { name: true, specialization: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.treatmentPlan.findMany({
        where: {
          patientId,
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
        },
        include: {
          doctor: {
            select: { name: true, specialization: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.progressionNote.findMany({
        where: {
          patientId,
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const exportData = {
      exportInfo: {
        generatedAt: new Date(),
        dateRange: {
          start: startDate ? new Date(startDate) : null,
          end: endDate ? new Date(endDate) : null,
        },
        totalRecords:
          examinations.length + treatmentPlans.length + progressionNotes.length,
      },
      patient: includePersonalInfo
        ? {
            id: patient.id,
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            birthDate: patient.birthDate,
            gender: patient.gender,
          }
        : {
            id: patient.id,
            initials: patient.name
              .split(' ')
              .map((n) => n[0])
              .join('.'),
          },
      medicalRecords: {
        examinations: examinations.map((exam) => ({
          id: exam.id,
          date: exam.createdAt,
          doctor: exam.doctor,
          painScale: exam.subjectivePainScale,
          location: exam.subjectiveLocation,
          description: exam.subjectiveDescription,
          aggravatingFactors: exam.subjectiveAggravatingFactors,
          posture: exam.objectivePosture,
          region: exam.objectiveRegion,
          physiologicalMotion: exam.objectivePhysiologicalMotion,
          palpation: exam.palpation,
        })),
        treatmentPlans: treatmentPlans.map((plan) => ({
          id: plan.id,
          date: plan.createdAt,
          doctor: plan.doctor,
          description: plan.description,
        })),
        progressionNotes: progressionNotes.map((note) => ({
          id: note.id,
          date: note.createdAt,
          note: note.note,
        })),
      },
      summary: {
        totalExaminations: examinations.length,
        totalTreatmentPlans: treatmentPlans.length,
        totalProgressionNotes: progressionNotes.length,
        averagePainScale:
          examinations.length > 0
            ? examinations
                .filter((e) => e.subjectivePainScale !== null)
                .reduce((sum, e) => sum + (e.subjectivePainScale || 0), 0) /
              examinations.filter((e) => e.subjectivePainScale !== null).length
            : null,
        doctorsInvolved: [...new Set(examinations.map((e) => e.doctor.name))],
        dateRange: {
          earliest: Math.min(
            ...examinations.map((e) => e.createdAt.getTime()),
            ...treatmentPlans.map((p) => p.createdAt.getTime()),
            ...progressionNotes.map((n) => n.createdAt.getTime()),
          ),
          latest: Math.max(
            ...examinations.map((e) => e.createdAt.getTime()),
            ...treatmentPlans.map((p) => p.createdAt.getTime()),
            ...progressionNotes.map((n) => n.createdAt.getTime()),
          ),
        },
      },
    };

    return exportData;
  }

  /**
   * Get comparative analysis between multiple patients
   * @param patientIds - Array of patient UUIDs to compare
   * @returns Comparative analysis of medical records between patients
   * @throws BadRequestException when invalid patient count provided
   */
  async comparePatientsMedicalRecords(patientIds: string[]) {
    if (!patientIds || patientIds.length < 2 || patientIds.length > 5) {
      throw new BadRequestException(
        'Please provide 2-5 patient IDs for comparison',
      );
    }

    const patients = await this.prisma.patient.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, name: true, birthDate: true, gender: true },
    });

    if (patients.length !== patientIds.length) {
      const foundIds = patients.map((p) => p.id);
      const notFoundIds = patientIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Patients not found: ${notFoundIds.join(', ')}`,
      );
    }

    const comparisons = await Promise.all(
      patients.map(async (patient) => {
        const [examinations, treatmentPlans, progressionNotes] =
          await Promise.all([
            this.prisma.examination.findMany({
              where: { patientId: patient.id },
              include: {
                doctor: { select: { specialization: true } },
              },
            }),
            this.prisma.treatmentPlan.count({
              where: { patientId: patient.id },
            }),
            this.prisma.progressionNote.count({
              where: { patientId: patient.id },
            }),
          ]);

        const painScales = examinations
          .filter((e) => e.subjectivePainScale !== null)
          .map((e) => e.subjectivePainScale!);

        const specializations = examinations
          .map((e) => e.doctor.specialization)
          .filter(Boolean);

        return {
          patient: {
            id: patient.id,
            name: patient.name,
            age: patient.birthDate
              ? Math.floor(
                  (Date.now() - patient.birthDate.getTime()) /
                    (1000 * 60 * 60 * 24 * 365),
                )
              : null,
            gender: patient.gender,
          },
          metrics: {
            totalExaminations: examinations.length,
            totalTreatmentPlans: treatmentPlans,
            totalProgressionNotes: progressionNotes,
            averagePainScale:
              painScales.length > 0
                ? painScales.reduce((a, b) => a + b, 0) / painScales.length
                : null,
            uniqueSpecializations: [...new Set(specializations)],
            firstRecordDate:
              examinations.length > 0
                ? Math.min(...examinations.map((e) => e.createdAt.getTime()))
                : null,
            lastRecordDate:
              examinations.length > 0
                ? Math.max(...examinations.map((e) => e.createdAt.getTime()))
                : null,
          },
        };
      }),
    );

    // Calculate comparative insights
    const allPainScales = comparisons
      .map((c) => c.metrics.averagePainScale)
      .filter((p) => p !== null);

    const allExaminationCounts = comparisons.map(
      (c) => c.metrics.totalExaminations,
    );
    const allTreatmentCounts = comparisons.map(
      (c) => c.metrics.totalTreatmentPlans,
    );

    return {
      patients: comparisons,
      insights: {
        averagePainScaleOverall:
          allPainScales.length > 0
            ? allPainScales.reduce((a, b) => a + b, 0) / allPainScales.length
            : null,
        patientWithMostExaminations: comparisons.reduce((max, current) =>
          current.metrics.totalExaminations > max.metrics.totalExaminations
            ? current
            : max,
        ).patient,
        patientWithHighestPainScale:
          allPainScales.length > 0
            ? comparisons.find(
                (c) =>
                  c.metrics.averagePainScale === Math.max(...allPainScales),
              )?.patient
            : null,
        averageExaminationsPerPatient:
          allExaminationCounts.reduce((a, b) => a + b, 0) /
          allExaminationCounts.length,
        averageTreatmentPlansPerPatient:
          allTreatmentCounts.reduce((a, b) => a + b, 0) /
          allTreatmentCounts.length,
        commonSpecializations: this.findCommonSpecializations(comparisons),
      },
    };
  }

  /**
   * Find common specializations across compared patients
   * @private
   */
  private findCommonSpecializations(comparisons: any[]): string[] {
    const specializationCounts: Record<string, number> = {};

    comparisons.forEach((comp) => {
      comp.metrics.uniqueSpecializations.forEach((spec: string) => {
        specializationCounts[spec] = (specializationCounts[spec] || 0) + 1;
      });
    });

    return Object.entries(specializationCounts)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .map(([spec]) => spec);
  }
}
