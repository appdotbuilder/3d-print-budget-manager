
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { printersTable, filamentsTable, costsConfigTable } from '../db/schema';
import { type CreateBudgetInput } from '../schema';
import { calculateBudget } from '../handlers/calculate_budget';

describe('calculateBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let printerId: number;
  let filamentId: number;

  beforeEach(async () => {
    // Create test printer
    const printerResult = await db.insert(printersTable)
      .values({
        name: 'Test Printer',
        power_consumption: '100.00', // 100 watts
        print_speed: '50.00',
        profit_percentage: '20.00' // 20% profit
      })
      .returning()
      .execute();
    printerId = printerResult[0].id;

    // Create test filament
    const filamentResult = await db.insert(filamentsTable)
      .values({
        name: 'Test Filament',
        brand: 'Test Brand',
        material_type: 'PLA',
        color: 'Black',
        cost_per_kg: '25.00', // $25 per kg
        density: '1.240'
      })
      .returning()
      .execute();
    filamentId = filamentResult[0].id;

    // Create test costs configuration
    await db.insert(costsConfigTable)
      .values({
        electricity_cost_per_kwh: '0.1500', // $0.15 per kWh
        rent_cost_per_month: '1000.00',
        employee_cost_per_month: '2000.00',
        maintenance_cost_per_month: '300.00',
        waste_percentage: '5.00', // 5% waste
        error_percentage: '2.00' // 2% error rate
      })
      .execute();
  });

  const testInput: CreateBudgetInput = {
    name: 'Test Budget',
    printer_id: 0, // Will be set in tests
    filament_id: 0, // Will be set in tests
    print_time_hours: 2, // 2 hours
    material_weight_g: 50, // 50 grams
    pieces_quantity: 1
  };

  it('should calculate budget correctly', async () => {
    const input = { ...testInput, printer_id: printerId, filament_id: filamentId };
    const result = await calculateBudget(input);

    // Material cost = (50g / 1000) * $25 = $1.25
    expect(result.material_cost).toBeCloseTo(1.25, 2);

    // Electricity cost = 2h * (100W / 1000) * $0.15 = $0.03
    expect(result.electricity_cost).toBeCloseTo(0.03, 2);

    // Fixed costs = (2h / 720h) * ($1000 + $2000 + $300) = $9.1667
    expect(result.fixed_costs).toBeCloseTo(9.1667, 3);

    // Waste cost = $1.25 * 5% = $0.0625
    expect(result.waste_cost).toBeCloseTo(0.0625, 3);

    // Error cost = ($1.25 + $0.03) * 2% = $0.0256
    expect(result.error_cost).toBeCloseTo(0.0256, 3);

    // Total cost = sum of all costs
    expect(result.total_cost).toBeCloseTo(10.535, 3);

    // Profit amount = total_cost * 20%
    expect(result.profit_amount).toBeCloseTo(2.107, 3);

    // Sale price = total_cost + profit_amount
    expect(result.sale_price).toBeCloseTo(12.642, 3);

    // For 1 piece, cost per piece equals total cost
    expect(result.cost_per_piece).toBeCloseTo(result.total_cost, 3);
    expect(result.price_per_piece).toBeCloseTo(result.sale_price, 3);

    // Profit margin percentage = (profit_amount / sale_price) * 100 ≈ 16.67%
    expect(result.profit_margin_percentage).toBeCloseTo(16.67, 1);
  });

  it('should calculate per-piece costs correctly for multiple pieces', async () => {
    const input = { 
      ...testInput, 
      printer_id: printerId, 
      filament_id: filamentId,
      pieces_quantity: 5
    };
    const result = await calculateBudget(input);

    // Per-piece calculations
    expect(result.cost_per_piece).toBeCloseTo(result.total_cost / 5, 3);
    expect(result.price_per_piece).toBeCloseTo(result.sale_price / 5, 3);
  });

  it('should handle larger print jobs correctly', async () => {
    const input = { 
      ...testInput, 
      printer_id: printerId, 
      filament_id: filamentId,
      print_time_hours: 10, // 10 hours
      material_weight_g: 200, // 200 grams
      pieces_quantity: 2
    };
    const result = await calculateBudget(input);

    // Material cost = (200g / 1000) * $25 = $5.00
    expect(result.material_cost).toBeCloseTo(5.00, 2);

    // Electricity cost = 10h * (100W / 1000) * $0.15 = $0.15
    expect(result.electricity_cost).toBeCloseTo(0.15, 2);

    // Fixed costs = (10h / 720h) * $3300 = $45.83
    expect(result.fixed_costs).toBeCloseTo(45.83, 2);

    // All values should be positive and reasonable
    expect(result.total_cost).toBeGreaterThan(0);
    expect(result.sale_price).toBeGreaterThan(result.total_cost);
    expect(result.profit_margin_percentage).toBeGreaterThan(0);
  });

  it('should throw error for non-existent printer', async () => {
    const input = { ...testInput, printer_id: 99999, filament_id: filamentId };
    
    expect(calculateBudget(input)).rejects.toThrow(/printer.*not found/i);
  });

  it('should throw error for non-existent filament', async () => {
    const input = { ...testInput, printer_id: printerId, filament_id: 99999 };
    
    expect(calculateBudget(input)).rejects.toThrow(/filament.*not found/i);
  });

  it('should throw error when no costs configuration exists', async () => {
    // Delete costs configuration
    await db.delete(costsConfigTable).execute();
    
    const input = { ...testInput, printer_id: printerId, filament_id: filamentId };
    
    expect(calculateBudget(input)).rejects.toThrow(/costs configuration.*not found/i);
  });
});
