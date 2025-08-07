import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { hash } from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ChangePasswordDto,
  CreateUserDto,
  FilterUserDto,
  UpdateUserDto,
} from './dto';

/**
 * Users service
 * @description This service is used to manage users
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Create a new user
   * @param createUserDto
   * @returns UserResponseDto
   * @throws ConflictException if user with email already exists
   */
  async create(createUserDto: CreateUserDto) {
    const { email, password, name, roleId } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Verify role exists and is active
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        isActive: true,
      },
    });

    if (!role) {
      throw new BadRequestException('Invalid or inactive role');
    }

    // Hash password
    const hashedPassword = await hash(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roleId,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get all users
   * @param filterDto
   * @returns UserResponseDto[]
   * @throws BadRequestException if filterDto is not valid
   */
  async findAll(filterDto?: FilterUserDto) {
    const {
      page = 1,
      limit = 10,
      search,
      roleId,
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
      ];
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'role') {
      orderBy.role = { name: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Remove passwords from response
    const usersWithoutPasswords = users.map(
      ({ password, hashedRefreshToken, ...user }) => user,
    );

    return {
      data: usersWithoutPasswords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by id
   * @param id
   * @returns UserResponseDto
   * @throws NotFoundException if user not found
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, hashedRefreshToken, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by email
   * @param email
   * @returns UserResponseDto
   * @throws NotFoundException if user not found
   */
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user
   * @param id
   * @param updateUserDto
   * @returns UserResponseDto
   * @throws NotFoundException if user not found
   * @throws ConflictException if email is already in use
   * @throws BadRequestException if role is invalid or inactive
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, roleId, ...updateData } = updateUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }

    // Verify role if roleId is provided
    if (roleId) {
      const role = await this.prisma.role.findFirst({
        where: {
          id: roleId,
          isActive: true,
        },
      });

      if (!role) {
        throw new BadRequestException('Invalid or inactive role');
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await hash(password);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        ...(roleId && { roleId }),
        ...(hashedPassword && { password: hashedPassword }),
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    const { password: _, hashedRefreshToken, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Delete user
   * @param id
   * @returns UserResponseDto
   * @throws NotFoundException if user not found
   */
  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete - set isActive to false
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    const { password, hashedRefreshToken, ...userWithoutPassword } =
      updatedUser;
    return userWithoutPassword;
  }

  /**
   * Activate user
   * @param id
   * @returns UserResponseDto
   * @throws NotFoundException if user not found
   */
  async activate(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    const { password, hashedRefreshToken, ...userWithoutPassword } =
      updatedUser;
    return userWithoutPassword;
  }

  /**
   * Change user password
   * @param id
   * @param changePasswordDto
   * @returns { message: 'Password changed successfully' }
   * @throws NotFoundException if user not found
   * @throws UnauthorizedException if old password is invalid
   */
  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword } = changePasswordDto;
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Todo:  refactoring this method

    const hashedPassword = await hash(newPassword);
    await this.update(id, { password: hashedPassword });

    return { message: 'Password changed successfully' };
  }

  /**
   * Get user stats
   * @returns UserStatsDto
   */
  async getUserStats() {
    const [totalUsers, activeUsers, inactiveUsers, usersByRole] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isActive: false } }),
        this.prisma.user.groupBy({
          by: ['roleId'],
          _count: true,
          where: { isActive: true },
        }),
      ]);

    // Get role names for the grouped data
    const roleIds = usersByRole.map((item) => item.roleId);
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true },
    });

    const roleMap = new Map(roles.map((role) => [role.id, role.name]));

    const usersByRoleWithNames = usersByRole.map((item) => ({
      role: roleMap.get(item.roleId) || 'Unknown',
      count: item._count,
    }));

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole: usersByRoleWithNames,
    };
  }

  /**
   * Update user last login
   * @param id
   * @returns void
   */
  async updateLastLogin(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
