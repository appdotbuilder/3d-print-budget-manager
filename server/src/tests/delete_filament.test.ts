
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filamentsTable, budgetsTable, printersTable } from '../db/schema';
import { deleteFilament } from '../handlers/delete_filament';
import { eq } from 'drizzle-orm';

describe('deleteFilament', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a filament successfully', async () => {
    // Create test filament
    const filamentResult = await db.insert(filamentsTable)
      .values({
        name: 'Test Filament',
        brand: 'Test Brand',
        material_type: 'PLA',
        color: 'Red',
        cost_per_kg: '25.00',
        density: '1.240'
      })
      .returning()
      .execute();

    const filamentId = filamentResult[0].id;

    // Delete the filament
    const result = await deleteFilament(filamentId);

    expect(result.success).toBe(true);

    // Verify filament was deleted
    const deletedFilament = await db.select()
      .from(filamentsTable)
      .where(eq(filamentsTable.id, filamentId))
      .execute();

    expect(deletedFilament).toHaveLength(0);
  });

  it('should throw error when filament does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteFilament(nonExistentId))
      .rejects
      .toThrow(/filament not found/i);
  });

  it('should throw error when filament is used in budgets', async () => {
    // Create test printer first
    const printerResult = await db.insert(printersTable)
      .values({
        name: 'Test Printer',
        power_consumption: '200.00',
        print_speed: '50.00',
        profit_percentage: '30.00'
      })
      .returning()
      .execute();

    const printerId = printerResult[0].id;

    // Create test filament
    const filamentResult = await db.insert(filamentsTable)
      .values({
        name: 'Test Filament',
        brand: 'Test Brand',
        material_type: 'PLA',
        color: 'Red',
        cost_per_kg: '25.00',
        density: '1.240'
      })
      .returning()
      .execute();

    const filamentId = filamentResult[0].id;

    // Create budget using this filament
    await db.insert(budgetsTable)
      .values({
        name: 'Test Budget',
        printer_id: printerId,
        filament_id: filamentId,
        print_time_hours: '2.50',
        material_weight_g: '50.00',
        pieces_quantity: 1,
        total_cost: '10.00',
        sale_price: '15.00',
        profit_margin: '33.33'
      })
      .execute();

    // Try to delete filament - should fail
    await expect(deleteFilament(filamentId))
      .rejects
      .toThrow(/cannot delete filament.*used in existing budgets/i);

    // Verify filament still exists
    const existingFilament = await db.select()
      .from(filamentsTable)
      .where(eq(filamentsTable.id, filamentId))
      .execute();

    expect(existingFilament).toHaveLength(1);
  });

  it('should allow deletion after removing dependent budgets', async () => {
    // Create test printer first
    const printerResult = await db.insert(printersTable)
      .values({
        name: 'Test Printer',
        power_consumption: '200.00',
        print_speed: '50.00',
        profit_percentage: '30.00'
      })
      .returning()
      .execute();

    const printerId = printerResult[0].id;

    // Create test filament
    const filamentResult = await db.insert(filamentsTable)
      .values({
        name: 'Test Filament',
        brand: 'Test Brand',
        material_type: 'PLA',
        color: 'Red',
        cost_per_kg: '25.00',
        density: '1.240'
      })
      .returning()
      .execute();

    const filamentId = filamentResult[0].id;

    // Create budget using this filament
    const budgetResult = await db.insert(budgetsTable)
      .values({
        name: 'Test Budget',
        printer_id: printerId,
        filament_id: filamentId,
        print_time_hours: '2.50',
        material_weight_g: '50.00',
        pieces_quantity: 1,
        total_cost: '10.00',
        sale_price: '15.00',
        profit_margin: '33.33'
      })
      .returning()
      .execute();

    const budgetId = budgetResult[0].id;

    // Remove the dependent budget first
    await db.delete(budgetsTable)
      .where(eq(budgetsTable.id, budgetId))
      .execute();

    // Now deletion should succeed
    const result = await deleteFilament(filamentId);

    expect(result.success).toBe(true);

    // Verify filament was deleted
    const deletedFilament = await db.select()
      .from(filamentsTable)
      .where(eq(filamentsTable.id, filamentId))
      .execute();

    expect(deletedFilament).toHaveLength(0);
  });
});
