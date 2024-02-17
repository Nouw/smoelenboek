import {Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation} from "typeorm";
import {FormQuestionItem} from "./FormQuestionItem";
import {Form} from "./Form";

@Entity()
export class FormQuestion {
  @PrimaryGeneratedColumn("uuid")
    id: string;

  @Column()
    title: string;

  @Column()
    type: "text" | "choice" | "select" | "dropdown"

  @Column({ default: false })
    required: boolean;

  @Column({ nullable: true })
    paragraph?: boolean;

  @Column()
    key: number;

  @OneToMany(() => FormQuestionItem, (item) => item, { cascade: true, onDelete: "CASCADE" })
  @JoinTable()
    items: Relation<FormQuestionItem[]>;

  @ManyToOne(() => Form, form => form.questions)
    form: Relation<Form>;
}
