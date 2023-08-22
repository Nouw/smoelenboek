import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Photo } from "./Photo";

@Entity()
export class Photobook {
    @PrimaryGeneratedColumn()
    	id: number;

    @Column()
    	name: string;

    @OneToMany(() => Photo, photo => photo.photobook)
    	photos: Relation<Photo[]>;
}
