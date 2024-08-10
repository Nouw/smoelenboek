import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { IsNull, Not, Repository, UpdateResult } from 'typeorm';
import { Request } from 'express';
import { UserCommitteeSeason } from 'src/committees/entities/user-committee-season.entity';
import { UserTeamSeason } from 'src/teams/entities/user-team-season.entity';
import { OracleService } from 'src/oracle/oracle.service';
import { MailService } from '../mail/mail.service';
import { ResetToken } from '../auth/entities/reset-token.entity';
import { randomBytes } from 'crypto';
import * as exceljs from 'exceljs';
import { Readable } from 'stream';
import { parseISO } from 'date-fns';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly oracleService: OracleService,
    private readonly mailService: MailService,
    @InjectRepository(ResetToken)
    private resetTokensRepository: Repository<ResetToken>,
  ) {}

  findForAuth(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['email', 'password', 'id', 'role', 'joinDate'],
    });
  }

  findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOneBy({ email });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = createUserDto as User;
    user.password = 'reset';
    user.joinDate = new Date(); //TODO: transform this into create date

    await this.usersRepository.save(user);

    const token = this.resetTokensRepository.create();
    token.user = user;
    token.token = randomBytes(32).toString('hex');

    await this.resetTokensRepository.save(token);

    await this.mailService.sendWelcome(token);

    return user;
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.findBy({ leaveDate: IsNull() });
  }

  findOne(id: number): Promise<User> {
    return this.usersRepository.findOneBy({ id });
  }

  update(id: number, updateUserDto: UpdateUserDto): Promise<UpdateResult> {
    return this.usersRepository.update(id, updateUserDto);
  }

  save(user: User) {
    return this.usersRepository.save(user);
  }

  remove(id: number) {
    return this.usersRepository.delete(id);
  }

  async picture(request: Request) {
    // @ts-expect-error should still at the user to the request
    const userId: number = request.user.id;

    const user = await this.usersRepository.findOneBy({ id: userId });

    return { picture: user.profilePicture ?? '/user/default.jpg' };
  }

  async profile(id: number): Promise<User> {
    const user = await this.usersRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.userTeamSeason', 'userTeam')
      .leftJoinAndSelect('userTeam.team', 'team')
      .leftJoinAndSelect('userTeam.season', 'userTeamSeason')
      .leftJoinAndSelect('u.userCommitteeSeason', 'userCommittee')
      .leftJoinAndSelect('userCommittee.committee', 'committee')
      .leftJoinAndSelect('userCommittee.season', 'userCommitteeSeason')
      .addOrderBy('userTeamSeason.id', 'DESC')
      .addOrderBy('userCommitteeSeason.id', 'DESC')
      .where('u.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException();
    }

    const teams = user.userTeamSeason;
    const committees = user.userCommitteeSeason;
    //This is the formatted user, so we can easily access the data on the frontend
    const formattedUser: any = user;
    formattedUser.seasons = {};

    teams.forEach((team: UserTeamSeason) => {
      const seasons = Object.keys(formattedUser.seasons);
      const teamSeason = team.season.id;
      //Check if season already exists, if not create it otherwise append to it.
      if (seasons.includes(teamSeason.toString())) {
        //Remove the season because it's redundant
        team.season = undefined;
        formattedUser.seasons[teamSeason].data.push(team);
      } else {
        const seasonName = team.season.name;
        team.season = undefined;
        formattedUser.seasons[teamSeason] = {
          name: seasonName,
          data: [team],
        };
      }
    });

    committees.forEach((committee: UserCommitteeSeason) => {
      const seasons = Object.keys(formattedUser.seasons);
      const committeeSeason = committee.season.id;
      //Check if season exists, if not create it otherwise append data to it
      if (seasons.includes(committeeSeason.toString())) {
        committee.season = undefined;
        formattedUser.seasons[committeeSeason].data.push(committee);
      } else {
        committee.season = undefined;
        formattedUser.seasons[committeeSeason] = {
          data: [committee],
        };
      }
    });

    formattedUser.userCommitteeSeason = undefined;
    formattedUser.userTeamSeason = undefined;

    const seasons = formattedUser.seasons;
    const keys = Object.keys(seasons);
    keys.sort(function (a, b) {
      return parseInt(b) - parseInt(a);
    });

    const newSeasons = {};

    keys.forEach((season) => {
      newSeasons[season] = seasons[season];
    });

    formattedUser.seasons = seasons;

    //let hasRole = false;

    //req.user.roles.forEach((role: Role) => {
    //  if (role.id === 2 && !hasRole) {
    //    hasRole = true;
    //  }
    //});
    //
    //if (id !== req.user.id && !hasRole) {
    //  user.bankaccountNumber = undefined;
    //}
    //
    return formattedUser;
  }

  async uploadPicture(file: Express.Multer.File, partialUser: User) {
    const user = await this.usersRepository.findOneBy({ id: partialUser.id });

    if (!user) {
      throw new NotFoundException();
    }

    if (user.profilePicture !== 'user/default.jpg') {
      // TODO: Delete picture
    }

    const uploaded = await this.oracleService.upload(file, 'user');

    user.profilePicture = `user/${uploaded}`;

    return this.usersRepository.update(user.id, user);
  }

  searchUser(name: string) {
    return this.usersRepository
      .createQueryBuilder('u')
      .select(['u.id', 'u.firstName', 'u.lastName'])
      .where("CONCAT(u.firstName, ' ', u.lastName) LIKE :name", {
        name: `%${name}%`,
      })
      .andWhere('u.leaveDate IS NULL')
      .getMany();
  }

  async importUsers(file: Express.Multer.File) {
    const workbook = new exceljs.Workbook();
    const fileType = file.originalname.split('.')[1];

    const stream = new Readable();

    stream.push(file.buffer);
    stream.push(null);

    let worksheet: exceljs.Worksheet;

    if (fileType === 'csv') {
      worksheet = await workbook.csv.read(stream);
    } else if (fileType === 'xlsx') {
      await workbook.xlsx.read(stream);
      worksheet = workbook.getWorksheet(1);
    } else {
      throw Error('Wrong filetype!');
    }

    console.log(worksheet);

    for (const row of worksheet.getRows(2, worksheet.actualRowCount)) {
      if (row.getCell(3).value === null) {
        continue;
      }

      await this.create({
        firstName: row.getCell(1).value as string,
        lastName: row.getCell(2).value as string,
        email: row.getCell(3).value as string,
        phoneNumber: row.getCell(4).value as string,
        streetName: row.getCell(5).value as string,
        houseNumber: row.getCell(6).value as string,
        postcode: row.getCell(7).value as string,
        city: row.getCell(8).value as string,
        bankaccountNumber: row.getCell(9).value as string,
        bondNumber: row.getCell(10).value as string,
        birthDate: row.getCell(12).value as Date,
      });
    }
  }
}
