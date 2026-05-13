import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', length: 100, nullable: true })
    name?: string

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string

    @Column({ type: 'text' })
    password?: string

    @CreateDateColumn()
    createdDate?: Date

    @UpdateDateColumn()
    updatedDate?: Date
}
