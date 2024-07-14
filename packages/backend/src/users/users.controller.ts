import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from 'src/auth/enums/role.enum';
import { Request as RequestType } from 'src/auth/types/request';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Roles(Role.Admin)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Get('profile/:id')
  profile(@Param('id') id: string) {
    return this.usersService.profile(+id);
  }

  @Roles(Role.User)
  @Get('user/picture')
  picture(@Req() req: RequestType) {
    return this.usersService.picture(req);
  }

  @Post('user/picture/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadPicture(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestType,
  ) {
    return this.usersService.uploadPicture(file, req.user);
  }

  @Get('user/search')
  searchUser(@Query('name') name: string) {
    return this.usersService.searchUser(name);
  }
}
