
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { printersTable, filamentsTable, costsConfigTable, budgetsTable } from '../db/schema';
import { type CreateBudgetInput } from '../schema';
import { createBudget } from '../handlers/create_budget';
import { eq } from 'drizzle-orm';

// Test data setup
const setupTestData = async () => {
  // Create printer
  const printerResult = await db.insert(printersTable)
    .values({
      name: 'Test Printer',
      power_consumption: '200.50', // 200.5 watts
      print_speed: '50.00',
      profit_percentage: '25.00' // 25% profit
    })
    .returning()
    .execute();

  // Create filament
  const filamentResult = await db.insert(filamentsTable)
    .values({
      name: 'Test Filament',
      brand: 'Test Brand',
      material_type: 'PLA',
      color: 'Red',
      cost_per_kg: '25.00', // $25 per kg
      density: '1.250' // 1.25 g/cm³
    })
    .returning()
    .execute();

  // Create costs configuration
  const costsConfigResult = await db.insert(costsConfigTable)
    .values({
      electricity_cost_per_kwh: '0.1500', // $0.15 per kWh
      rent_cost_per_month: '1000.00',
      employee_cost_per_month: '2000.00',
      maintenance_cost_per_month: '300.00',
      waste_percentage: '5.00', // 5% waste
      error_percentage: '2.00' // 2% error rate
    })
    .returning()
    .execute();

  return {
    printer: printerResult[0],
    filament: filamentResult[0],
    costsConfig: costsConfigResult[0]
  };
};

const testInput: CreateBudgetInput = {
  name: 'Test Budget',
  printer_id: 1, // Will be updated with actual ID
  filament_id: 1, // Will be updated with actual ID
  print_time_hours: 5.0, // 5 hours
  material_weight_g: 100.0, // 100 grams
  pieces_quantity: 2
};

describe('createBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a budget with calculated values', async () => {
    const testData = await setupTestData();
    const input = {
      ...testInput,
      printer_id: testData.printer.id,
      filament_id: testData.filament.id
    };

    const result = await createBudget(input);

    // Basic fields validation
    expect(result.name).toEqual('Test Budget');
    expect(result.printer_id).toEqual(testData.printer.id);
    expect(result.filament_id).toEqual(testData.filament.id);
    expect(result.print_time_hours).toEqual(5.0);
    expect(result.material_weight_g).toEqual(100.0);
    expect(result.pieces_quantity).toEqual(2);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify calculated values are numbers and positive
    expect(typeof result.total_cost).toBe('number');
    expect(typeof result.sale_price).toBe('number');
    expect(typeof result.profit_margin).toBe('number');
    expect(result.total_cost).toBeGreaterThan(0);
    expect(result.sale_price).toBeGreaterThan(result.total_cost);
    expect(result.profit_margin).toBeGreaterThan(0);
  });

  it('should save budget to database', async () => {
    const testData = await setupTestData();
    const input = {
      ...testInput,
      printer_id: testData.printer.id,
      filament_id: testData.filament.id
    };

    const result = await createBudget(input);

    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, result.id))
      .execute();

    expect(budgets).toHaveLength(1);
    const savedBudget = budgets[0];
    expect(savedBudget.name).toEqual('Test Budget');
    expect(savedBudget.printer_id).toEqual(testData.printer.id);
    expect(savedBudget.filament_id).toEqual(testData.filament.id);
    expect(parseFloat(savedBudget.total_cost)).toBeGreaterThan(0);
    expect(parseFloat(savedBudget.sale_price)).toBeGreaterThan(0);
    expect(savedBudget.created_at).toBeInstanceOf(Date);
  });

  it('should calculate costs correctly for multiple pieces', async () => {
    const testData = await setupTestData();
    const input = {
      ...testInput,
      printer_id: testData.printer.id,
      filament_id: testData.filament.id,
      pieces_quantity: 3
    };

    const result = await createBudget(input);

    // With 3 pieces, costs should be higher than with fewer pieces
    expect(result.pieces_quantity).toEqual(3);
    expect(result.total_cost).toBeGreaterThan(0);
    expect(result.sale_price).toBeGreaterThan(result.total_cost);
    
    // Profit margin should be around 20% (profit / sale_price * 100)
    // The calculation is: profit_margin_percentage = (profitAmount / salePrice) * 100
    expect(result.profit_margin).toBeGreaterThanOrEqual(19);
    expect(result.profit_margin).toBeLessThanOrEqual(21);
  });

  it('should throw error when printer not found', async () => {
    const testData = await setupTestData();
    const input = {
      ...testInput,
      printer_id: 999, // Non-existent printer
      filament_id: testData.filament.id
    };

    await expect(createBudget(input)).rejects.toThrow(/printer not found/i);
  });

  it('should throw error when filament not found', async () => {
    const testData = await setupTestData();
    const input = {
      ...testInput,
      printer_id: testData.printer.id,
      filament_id: 999 // Non-existent filament
    };

    await expect(createBudget(input)).rejects.toThrow(/filament not found/i);
  });

  it('should throw error when costs configuration not found', async () => {
    // Only create printer and filament, no costs config
    const printerResult = await db.insert(printersTable)
      .values({
        name: 'Test Printer',
        power_consumption: '200.00',
        print_speed: '50.00',
        profit_percentage: '25.00'
      })
      .returning()
      .execute();

    const filamentResult = await db.insert(filamentsTable)
      .values({
        name: 'Test Filament',
        brand: 'Test Brand',
        material_type: 'PLA',
        color: 'Red',
        cost_per_kg: '25.00',
        density: '1.250'
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      printer_id: printerResult[0].id,
      filament_id: filamentResult[0].id
    };

    await expect(createBudget(input)).rejects.toThrow(/costs configuration not found/i);
  });
});
