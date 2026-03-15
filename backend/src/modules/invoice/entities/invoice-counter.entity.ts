import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * InvoiceCounter is a singleton table (only one row, id=1).
 * Used for atomic invoice ID generation with row-level locking.
 * Invoice format: GL-{lastNum padded to minimum 4 digits}
 * No yearly reset -- increments indefinitely.
 */
@Entity('invoice_counter')
export class InvoiceCounter {
    @PrimaryColumn({ type: 'int', default: 1 })
    id: number;

    @Column({ name: 'last_num', type: 'int', default: 0 })
    lastNum: number;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
}
