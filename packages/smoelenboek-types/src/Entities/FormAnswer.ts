import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation
} from "typeorm";
import {User} from "./User";
import {FormAnswerValue} from "./FormAnswerValue";
import {Form} from "./Form";

@Entity()
export class FormAnswer {
  @PrimaryGeneratedColumn("uuid")
    id: string;

  @Column({ type: "text", nullable: true })
    email?: string;

	@Column({ type: "text", nullable: true })
		firstName?: string;

	@Column({ type: "text", nullable: true })
		lastName?: string;

  @ManyToOne(() => User)
  @JoinColumn()
    user?: Relation<User>;

  @ManyToOne(() => Form)
  @JoinColumn([{ name: 'form_id', referencedColumnName: 'id' }])
    form: Relation<Form>;

  @OneToMany(() => FormAnswerValue, formAnswerData => formAnswerData.answer, { cascade: true, onDelete: "CASCADE" })
    values: Relation<FormAnswerValue[]>;

  @CreateDateColumn()
    created: Date;
}
