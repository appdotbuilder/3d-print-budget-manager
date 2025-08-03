
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, printersTable, filamentsTable, costsConfigTable } from '../db/schema';
import { type CreateBudgetInput } from '../schema';
import { updateBudget } from '../handlers/update_budget';
import { eq } from 'drizzle-orm';

// Test data
const testPrinter = {
  name: 'Test Printer',
  power_consumption: '100',
  print_speed: '50',
  profit_percentage: '25'
};

const testFilament = {
  name: 'Test Filament',
  brand: 'Test Brand',
  material_type: 'PLA',
  color: 'Red',
  cost_per_kg: '25.00',
  density: '1.25'
};

const testCostsConfig = {
  electricity_cost_per_kwh: '0.15',
  rent_cost_per_month: '1000.00',
  employee_cost_per_month: '2000.00',
  maintenance_cost_per_month: '500.00',
  waste_percentage: '5.00',
  error_percentage: '10.00'
};

const testUpdateInput: CreateBudgetInput = {
  name: 'Updated Budget',
  printer_id: 1,
  filament_id: 1,
  print_time_hours: 5,
  material_weight_g: 200,
  pieces_quantity: 2
};

describe('updateBudget', () => {
  let budgetId: number;

  beforeEach(async () => {
    await createDB();

    // Create printer
    await db.insert(printersTable).values(testPrinter).execute();

    // Create filament
    await db.insert(filamentsTable).values(testFilament).execute();

    // Create costs config
    await db.insert(costsConfigTable).values(testCostsConfig).execute();

    // Create initial budget
    const budget = await db.insert(budgetsTable).values({
      name: 'Original Budget',
      printer_id: 1,
      filament_id: 1,
      print_time_hours: '3.00',
      material_weight_g: '100.00',
      pieces_quantity: 1,
      total_cost: '10.00',
      sale_price: '12.50',
      profit_margin: '25.00'
    }).returning().execute();

    budgetId = budget[0].id;
  });

  afterEach(resetDB);

  it('should update budget with recalculated costs', async () => {
    const result = await updateBudget(budgetId, testUpdateInput);

    expect(result.id).toEqual(budgetId);
    expect(result.name).toEqual('Updated Budget');
    expect(result.printer_id).toEqual(1);
    expect(result.filament_id).toEqual(1);
    expect(result.print_time_hours).toEqual(5);
    expect(result.material_weight_g).toEqual(200);
    expect(result.pieces_quantity).toEqual(2);
    expect(typeof result.total_cost).toBe('number');
    expect(typeof result.sale_price).toBe('number');
    expect(typeof result.profit_margin).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated budget to database', async () => {
    const result = await updateBudget(budgetId, testUpdateInput);

    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budgetId))
      .execute();

    expect(budgets).toHaveLength(1);
    const budget = budgets[0];
    expect(budget.name).toEqual('Updated Budget');
    expect(budget.printer_id).toEqual(1);
    expect(budget.filament_id).toEqual(1);
    expect(parseFloat(budget.print_time_hours)).toEqual(5);
    expect(parseFloat(budget.material_weight_g)).toEqual(200);
    expect(budget.pieces_quantity).toEqual(2);
    expect(parseFloat(budget.total_cost)).toEqual(result.total_cost);
    expect(parseFloat(budget.sale_price)).toEqual(result.sale_price);
    expect(parseFloat(budget.profit_margin)).toEqual(result.profit_margin);
  });

  it('should calculate costs correctly', async () => {
    const result = await updateBudget(budgetId, testUpdateInput);

    // Material cost: (25.00 / 1000) * 200g = 5.00
    const expectedMaterialCost = 5.00;
    
    // Electricity cost: (100W / 1000) * 5h * 0.15 = 0.075
    const expectedElectricityCost = 0.075;
    
    // Fixed costs per hour: (1000 + 2000 + 500) / (30 * 24) = 4.86111...
    const expectedFixedCosts = 3500 / (30 * 24) * 5; // ~2.43
    
    // Base cost for one piece
    const baseCostPerPiece = expectedMaterialCost + expectedElectricityCost + expectedFixedCosts;
    
    // Waste: 5% of material cost
    const wasteCost = expectedMaterialCost * 0.05;
    
    // Error: 10% of (material + electricity)
    const errorCost = (expectedMaterialCost + expectedElectricityCost) * 0.10;
    
    // Total cost for 2 pieces
    const expectedTotalCost = (baseCostPerPiece + wasteCost + errorCost) * 2;
    
    // Sale price with 25% profit
    const expectedSalePrice = expectedTotalCost * 1.25;

    expect(result.total_cost).toBeCloseTo(expectedTotalCost, 2);
    expect(result.sale_price).toBeCloseTo(expectedSalePrice, 2);
    expect(result.profit_margin).toBeCloseTo(25, 2);
  });

  it('should throw error when budget not found', async () => {
    await expect(updateBudget(999, testUpdateInput)).rejects.toThrow(/budget not found/i);
  });

  it('should throw error when printer not found', async () => {
    const invalidInput = { ...testUpdateInput, printer_id: 999 };
    await expect(updateBudget(budgetId, invalidInput)).rejects.toThrow(/printer not found/i);
  });

  it('should throw error when filament not found', async () => {
    const invalidInput = { ...testUpdateInput, filament_id: 999 };
    await expect(updateBudget(budgetId, invalidInput)).rejects.toThrow(/filament not found/i);
  });

  it('should throw error when costs config not found', async () => {
    // Delete costs config
    await db.delete(costsConfigTable).execute();
    
    await expect(updateBudget(budgetId, testUpdateInput)).rejects.toThrow(/costs configuration not found/i);
  });
});
