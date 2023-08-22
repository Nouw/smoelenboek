import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { File } from "./File";

export enum CategoryType {
    CATEGORY_TYPE_DOCUMENTS = "documents",
    CATEGORY_TYPE_PHOTOS = "photos"
}

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    	id: number;

    @Column()
    	name: string;

    @Column({
    	default: false
    })
    	pinned: boolean;

    @Column({
    	type: "enum",
    	enum: CategoryType,
    	default: CategoryType.CATEGORY_TYPE_PHOTOS
    })
    	type: CategoryType;

    @Column({ type: "date" })
    	created: Date;

    @OneToMany(() => File, file => file.category)
    	files: Relation<File[]>;
}
