// src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  FilterUserDto,
  UserResponseDto,
  ChangePasswordDto,
} from './dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { plainToClass } from 'class-transformer';

@Controller('users')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('create_users')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return plainToClass(UserResponseDto, user); // Ensure proper serialization
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_users')
  async findAll(@Query() filterDto: FilterUserDto) {
    return await this.usersService.findAll(filterDto);
  }

  @Get('stats')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('view_users')
  async getStats() {
    return await this.usersService.getUserStats();
  }

  @Get('me')
  async getCurrentUser(@CurrentUser() user: any): Promise<UserResponseDto> {
    const userEntity = await this.usersService.findOne(user.id);
    return plainToClass(UserResponseDto, userEntity);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('view_users')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id);
    return plainToClass(UserResponseDto, user);
  }

  @Patch('me')
  async updateCurrentUser(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Users can only update their own name and password
    const { name, password } = updateUserDto;
    const updatedUser = await this.usersService.update(user.id, {
      name,
      password,
    });
    return plainToClass(UserResponseDto, updatedUser);
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('edit_users')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    return plainToClass(UserResponseDto, updatedUser);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('edit_users')
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const activatedUser = await this.usersService.activate(id);
    return plainToClass(UserResponseDto, activatedUser);
  }

  @Patch(':id/change-password')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('edit_users')
  async changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.changePassword(
      id,
      changePasswordDto,
    );
    return plainToClass(UserResponseDto, updatedUser);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin')
  @RequirePermissions('delete_users')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.usersService.remove(id);
  }
}
