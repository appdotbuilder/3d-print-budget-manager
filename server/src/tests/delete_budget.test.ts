
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, printersTable, filamentsTable } from '../db/schema';
import { deleteBudget } from '../handlers/delete_budget';
import { eq } from 'drizzle-orm';

describe('deleteBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing budget', async () => {
    // Create prerequisite data - printer
    const printerResult = await db.insert(printersTable)
      .values({
        name: 'Test Printer',
        power_consumption: '150.00',
        print_speed: '50.00',
        profit_percentage: '20.00'
      })
      .returning()
      .execute();

    // Create prerequisite data - filament
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

    // Create test budget
    const budgetResult = await db.insert(budgetsTable)
      .values({
        name: 'Test Budget',
        printer_id: printerResult[0].id,
        filament_id: filamentResult[0].id,
        print_time_hours: '2.50',
        material_weight_g: '100.00',
        pieces_quantity: 1,
        total_cost: '15.00',
        sale_price: '18.00',
        profit_margin: '20.00'
      })
      .returning()
      .execute();

    const budgetId = budgetResult[0].id;

    // Delete the budget
    const result = await deleteBudget(budgetId);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify budget no longer exists in database
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budgetId))
      .execute();

    expect(budgets).toHaveLength(0);
  });

  it('should throw error when budget does not exist', async () => {
    const nonExistentId = 99999;

    // Attempt to delete non-existent budget
    expect(async () => {
      await deleteBudget(nonExistentId);
    }).toThrow(/Budget with id 99999 not found/);
  });

  it('should not affect other budgets when deleting one', async () => {
    // Create prerequisite data - printer
    const printerResult = await db.insert(printersTable)
      .values({
        name: 'Test Printer',
        power_consumption: '150.00',
        print_speed: '50.00',
        profit_percentage: '20.00'
      })
      .returning()
      .execute();

    // Create prerequisite data - filament
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

    // Create two test budgets
    const budget1Result = await db.insert(budgetsTable)
      .values({
        name: 'Budget 1',
        printer_id: printerResult[0].id,
        filament_id: filamentResult[0].id,
        print_time_hours: '2.50',
        material_weight_g: '100.00',
        pieces_quantity: 1,
        total_cost: '15.00',
        sale_price: '18.00',
        profit_margin: '20.00'
      })
      .returning()
      .execute();

    const budget2Result = await db.insert(budgetsTable)
      .values({
        name: 'Budget 2',
        printer_id: printerResult[0].id,
        filament_id: filamentResult[0].id,
        print_time_hours: '3.00',
        material_weight_g: '120.00',
        pieces_quantity: 2,
        total_cost: '20.00',
        sale_price: '24.00',
        profit_margin: '20.00'
      })
      .returning()
      .execute();

    // Delete first budget
    await deleteBudget(budget1Result[0].id);

    // Verify first budget is deleted
    const deletedBudgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budget1Result[0].id))
      .execute();

    expect(deletedBudgets).toHaveLength(0);

    // Verify second budget still exists
    const remainingBudgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budget2Result[0].id))
      .execute();

    expect(remainingBudgets).toHaveLength(1);
    expect(remainingBudgets[0].name).toEqual('Budget 2');
  });
});
