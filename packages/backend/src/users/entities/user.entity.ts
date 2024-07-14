import { Activity } from '../../activities/entities/activity.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { Role } from '../../auth/enums/role.enum';
import { UserCommitteeSeason } from '../../committees/entities/user-committee-season.entity';
import { ProtototoPrediction } from '../../protototo/entities/protototo-prediction.entity';
import { UserTeamSeason } from '../../teams/entities/user-team-season.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Relation,
  OneToMany,
  ManyToMany,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  streetName: string;

  @Column()
  houseNumber: string;

  @Column()
  postcode: string;

  @Column()
  city: string;

  @Column()
  phoneNumber: string;

  @Column()
  bankaccountNumber: string;

  @Column({ type: 'date' })
  birthDate: Date;

  @Column()
  bondNumber: string;

  @Column({ type: 'date' })
  joinDate: Date;

  @Column({ type: 'date', nullable: true })
  leaveDate?: Date;

  @Column({ nullable: true })
  backNumber?: number;

  @Column({ nullable: true, default: 'user/default.jpg' })
  profilePicture?: string;

  @Column({ nullable: true, type: 'text' })
  refereeLicense?: string;

  @Column({ default: Role.User })
  role: Role;

  @OneToMany(() => UserTeamSeason, (userTeam) => userTeam.user)
  userTeamSeason: Relation<UserTeamSeason[]>;

  @OneToMany(() => UserCommitteeSeason, (userCommittee) => userCommittee.user)
  userCommitteeSeason: Relation<UserCommitteeSeason[]>;

  @OneToMany(() => ProtototoPrediction, (prediction) => prediction.user)
  predictions: Relation<ProtototoPrediction[]>;

  @ManyToMany(() => Activity)
  activities: Relation<Activity[]>;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: Relation<RefreshToken[]>;
}
