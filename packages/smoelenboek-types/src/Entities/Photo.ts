import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Photobook } from "./Photobook";

@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    	id: number;

    @Column("text")
    	file: string;

    @ManyToOne(() => Photobook, photobook => photobook.photos, { onDelete: "CASCADE" })
    	photobook: Relation<Photobook>;
}
