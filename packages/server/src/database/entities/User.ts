import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'identity_users', synchronize: false })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 150, unique: true })
    username: string

    @Column({ type: 'varchar', length: 254, unique: true })
    email: string

    @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
    name?: string

    @Column({ name: 'middle_name', type: 'varchar', length: 255, nullable: true })
    middleName?: string

    @Column({ type: 'varchar', length: 15, nullable: true })
    phone?: string

    @Column({ name: 'company_id', type: 'int', nullable: true })
    companyId?: number

    @Column({ name: 'is_email_verified', type: 'boolean', default: false })
    isEmailVerified?: boolean

    @Column({ name: 'is_phone_verified', type: 'boolean', default: false })
    isPhoneVerified?: boolean

    @Column({ name: 'last_login', nullable: true })
    lastLogin?: Date

    @Column({ type: 'varchar', length: 50, nullable: true })
    status?: string

    @Column({ name: 'last_active_at', nullable: true })
    lastActiveAt?: Date

    @Column({ name: 'is_online', type: 'boolean', default: false })
    isOnline?: boolean

    @Column({ name: 'stripe_customer_id', type: 'varchar', length: 255, nullable: true })
    stripeCustomerId?: string

    @Column({ name: 'stripe_account_id', type: 'varchar', length: 255, nullable: true })
    stripeAccountId?: string

    @Column({ name: 'created_by_id', type: 'int', nullable: true })
    createdById?: number

    @CreateDateColumn({ name: 'created_at' })
    createdDate?: Date

    @Column({ name: 'updated_by_id', type: 'int', nullable: true })
    updatedById?: number

    @UpdateDateColumn({ name: 'updated_at' })
    updatedDate?: Date

    @Column({ name: 'deleted_by_id', type: 'int', nullable: true })
    deletedById?: number

    @Column({ name: 'deleted_at', nullable: true })
    deletedAt?: Date

    @Column({ name: 'is_deleted', type: 'boolean', default: false })
    isDeleted?: boolean

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive?: boolean

    @Column({ type: 'text', nullable: true })
    password?: string
}
