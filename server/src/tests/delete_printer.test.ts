
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { printersTable, budgetsTable, filamentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deletePrinter } from '../handlers/delete_printer';

describe('deletePrinter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a printer successfully', async () => {
    // Create a test printer
    const printer = await db.insert(printersTable)
      .values({
        name: 'Test Printer',
        power_consumption: '100.00',
        print_speed: '50.00',
        profit_percentage: '20.00'
      })
      .returning()
      .execute();

    const printerId = printer[0].id;

    // Delete the printer
    const result = await deletePrinter(printerId);

    expect(result.success).toBe(true);

    // Verify printer was deleted
    const deletedPrinter = await db.select()
      .from(printersTable)
      .where(eq(printersTable.id, printerId))
      .execute();

    expect(deletedPrinter).toHaveLength(0);
  });

  it('should throw error when printer does not exist', async () => {
    const nonExistentId = 999;

    await expect(deletePrinter(nonExistentId))
      .rejects
      .toThrow(/printer not found/i);
  });

  it('should throw error when printer is used in budgets', async () => {
    // Create a test printer
    const printer = await db.insert(printersTable)
      .values({
        name: 'Test Printer',
        power_consumption: '100.00',
        print_speed: '50.00',
        profit_percentage: '20.00'
      })
      .returning()
      .execute();

    // Create a test filament
    const filament = await db.insert(filamentsTable)
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

    // Create a budget using this printer
    await db.insert(budgetsTable)
      .values({
        name: 'Test Budget',
        printer_id: printer[0].id,
        filament_id: filament[0].id,
        print_time_hours: '2.50',
        material_weight_g: '100.00',
        pieces_quantity: 1,
        total_cost: '10.00',
        sale_price: '15.00',
        profit_margin: '33.33'
      })
      .execute();

    // Try to delete the printer
    await expect(deletePrinter(printer[0].id))
      .rejects
      .toThrow(/cannot delete printer.*being used in budgets/i);

    // Verify printer still exists
    const remainingPrinter = await db.select()
      .from(printersTable)
      .where(eq(printersTable.id, printer[0].id))
      .execute();

    expect(remainingPrinter).toHaveLength(1);
  });

  it('should allow deletion after removing dependent budgets', async () => {
    // Create a test printer
    const printer = await db.insert(printersTable)
      .values({
        name: 'Test Printer',
        power_consumption: '100.00',
        print_speed: '50.00',
        profit_percentage: '20.00'
      })
      .returning()
      .execute();

    // Create a test filament
    const filament = await db.insert(filamentsTable)
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

    // Create a budget using this printer
    const budget = await db.insert(budgetsTable)
      .values({
        name: 'Test Budget',
        printer_id: printer[0].id,
        filament_id: filament[0].id,
        print_time_hours: '2.50',
        material_weight_g: '100.00',
        pieces_quantity: 1,
        total_cost: '10.00',
        sale_price: '15.00',
        profit_margin: '33.33'
      })
      .returning()
      .execute();

    // First deletion should fail
    await expect(deletePrinter(printer[0].id))
      .rejects
      .toThrow(/cannot delete printer.*being used in budgets/i);

    // Remove the budget
    await db.delete(budgetsTable)
      .where(eq(budgetsTable.id, budget[0].id))
      .execute();

    // Now deletion should succeed
    const result = await deletePrinter(printer[0].id);
    expect(result.success).toBe(true);

    // Verify printer was deleted
    const deletedPrinter = await db.select()
      .from(printersTable)
      .where(eq(printersTable.id, printer[0].id))
      .execute();

    expect(deletedPrinter).toHaveLength(0);
  });
});
