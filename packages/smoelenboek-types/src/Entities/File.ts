import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Category } from "./Category";

@Entity()
export class File {
    @PrimaryGeneratedColumn()
    	id: number;

    @Column()
    	path: string;

    @ManyToOne(() => Category, category => category.files)
    	category: Relation<Category>;
}
