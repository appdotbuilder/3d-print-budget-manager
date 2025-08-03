
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { printersTable, filamentsTable, budgetsTable, costsConfigTable } from '../db/schema';
import { type CreatePrinterInput, type CreateFilamentInput, type CreateBudgetInput, type CostsConfigInput } from '../schema';
import { getBudgetWithDetails } from '../handlers/get_budget_with_details';

const testPrinter: CreatePrinterInput = {
  name: 'Test Printer',
  power_consumption: 200,
  print_speed: 50,
  profit_percentage: 25
};

const testFilament: CreateFilamentInput = {
  name: 'Test Filament',
  brand: 'Test Brand',
  material_type: 'PLA',
  color: 'Red',
  cost_per_kg: 25.00,
  density: 1.24
};

const testCostsConfig: CostsConfigInput = {
  electricity_cost_per_kwh: 0.15,
  rent_cost_per_month: 1000,
  employee_cost_per_month: 3000,
  maintenance_cost_per_month: 500,
  waste_percentage: 5,
  error_percentage: 3
};

describe('getBudgetWithDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent budget', async () => {
    const result = await getBudgetWithDetails(999);
    expect(result).toBeNull();
  });

  it('should get budget with all details and recalculated costs', async () => {
    // Create printer
    const printerResult = await db.insert(printersTable)
      .values({
        name: testPrinter.name,
        power_consumption: testPrinter.power_consumption.toString(),
        print_speed: testPrinter.print_speed.toString(),
        profit_percentage: testPrinter.profit_percentage.toString()
      })
      .returning()
      .execute();

    // Create filament
    const filamentResult = await db.insert(filamentsTable)
      .values({
        name: testFilament.name,
        brand: testFilament.brand,
        material_type: testFilament.material_type,
        color: testFilament.color,
        cost_per_kg: testFilament.cost_per_kg.toString(),
        density: testFilament.density.toString()
      })
      .returning()
      .execute();

    // Create costs config
    await db.insert(costsConfigTable)
      .values({
        electricity_cost_per_kwh: testCostsConfig.electricity_cost_per_kwh.toString(),
        rent_cost_per_month: testCostsConfig.rent_cost_per_month.toString(),
        employee_cost_per_month: testCostsConfig.employee_cost_per_month.toString(),
        maintenance_cost_per_month: testCostsConfig.maintenance_cost_per_month.toString(),
        waste_percentage: testCostsConfig.waste_percentage.toString(),
        error_percentage: testCostsConfig.error_percentage.toString()
      })
      .execute();

    // Create budget
    const budgetInput: CreateBudgetInput = {
      name: 'Test Budget',
      printer_id: printerResult[0].id,
      filament_id: filamentResult[0].id,
      print_time_hours: 2.5,
      material_weight_g: 50,
      pieces_quantity: 2
    };

    const budgetResult = await db.insert(budgetsTable)
      .values({
        name: budgetInput.name,
        printer_id: budgetInput.printer_id,
        filament_id: budgetInput.filament_id,
        print_time_hours: budgetInput.print_time_hours.toString(),
        material_weight_g: budgetInput.material_weight_g.toString(),
        pieces_quantity: budgetInput.pieces_quantity,
        total_cost: '10.00',
        sale_price: '12.50',
        profit_margin: '20.00'
      })
      .returning()
      .execute();

    const result = await getBudgetWithDetails(budgetResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(budgetResult[0].id);
    expect(result!.name).toEqual('Test Budget');

    // Verify printer data
    expect(result!.printer.name).toEqual('Test Printer');
    expect(result!.printer.power_consumption).toEqual(200);
    expect(result!.printer.print_speed).toEqual(50);
    expect(result!.printer.profit_percentage).toEqual(25);

    // Verify filament data
    expect(result!.filament.name).toEqual('Test Filament');
    expect(result!.filament.brand).toEqual('Test Brand');
    expect(result!.filament.material_type).toEqual('PLA');
    expect(result!.filament.color).toEqual('Red');
    expect(result!.filament.cost_per_kg).toEqual(25.00);
    expect(result!.filament.density).toEqual(1.24);

    // Verify recalculated costs
    expect(result!.calculation.material_cost).toBeCloseTo(1.25, 2); // 0.05kg * 25.00
    expect(result!.calculation.electricity_cost).toBeCloseTo(0.075, 3); // 0.2kW * 2.5h * 0.15
    expect(result!.calculation.fixed_costs).toBeGreaterThan(0);
    expect(result!.calculation.waste_cost).toBeCloseTo(0.0625, 4); // 5% of material cost
    expect(result!.calculation.error_cost).toBeGreaterThan(0);
    expect(result!.calculation.total_cost).toBeGreaterThan(1.25);
    expect(result!.calculation.profit_amount).toBeGreaterThan(0);
    expect(result!.calculation.sale_price).toBeGreaterThan(result!.calculation.total_cost);
    expect(result!.calculation.cost_per_piece).toEqual(result!.calculation.total_cost / 2);
    expect(result!.calculation.price_per_piece).toEqual(result!.calculation.sale_price / 2);
  });

  it('should work with default costs config when none exists', async () => {
    // Create printer
    const printerResult = await db.insert(printersTable)
      .values({
        name: testPrinter.name,
        power_consumption: testPrinter.power_consumption.toString(),
        print_speed: testPrinter.print_speed.toString(),
        profit_percentage: testPrinter.profit_percentage.toString()
      })
      .returning()
      .execute();

    // Create filament
    const filamentResult = await db.insert(filamentsTable)
      .values({
        name: testFilament.name,
        brand: testFilament.brand,
        material_type: testFilament.material_type,
        color: testFilament.color,
        cost_per_kg: testFilament.cost_per_kg.toString(),
        density: testFilament.density.toString()
      })
      .returning()
      .execute();

    // Create budget without costs config
    const budgetResult = await db.insert(budgetsTable)
      .values({
        name: 'Test Budget',
        printer_id: printerResult[0].id,
        filament_id: filamentResult[0].id,
        print_time_hours: '1.0',
        material_weight_g: '100.0',
        pieces_quantity: 1,
        total_cost: '5.00',
        sale_price: '6.25',
        profit_margin: '20.00'
      })
      .returning()
      .execute();

    const result = await getBudgetWithDetails(budgetResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.calculation.material_cost).toBeCloseTo(2.5, 2); // 0.1kg * 25.00
    expect(result!.calculation.electricity_cost).toBeCloseTo(0.03, 2); // Using default 0.15 rate
    expect(result!.calculation.total_cost).toBeGreaterThan(2.5);
  });

  it('should handle numeric conversions correctly', async () => {
    // Create printer and filament
    const printerResult = await db.insert(printersTable)
      .values({
        name: testPrinter.name,
        power_consumption: testPrinter.power_consumption.toString(),
        print_speed: testPrinter.print_speed.toString(),
        profit_percentage: testPrinter.profit_percentage.toString()
      })
      .returning()
      .execute();

    const filamentResult = await db.insert(filamentsTable)
      .values({
        name: testFilament.name,
        brand: testFilament.brand,
        material_type: testFilament.material_type,
        color: testFilament.color,
        cost_per_kg: testFilament.cost_per_kg.toString(),
        density: testFilament.density.toString()
      })
      .returning()
      .execute();

    // Create budget
    const budgetResult = await db.insert(budgetsTable)
      .values({
        name: 'Numeric Test Budget',
        printer_id: printerResult[0].id,
        filament_id: filamentResult[0].id,
        print_time_hours: '3.75',
        material_weight_g: '125.5',
        pieces_quantity: 3,
        total_cost: '15.99',
        sale_price: '19.99',
        profit_margin: '25.12'
      })
      .returning()
      .execute();

    const result = await getBudgetWithDetails(budgetResult[0].id);

    expect(result).not.toBeNull();
    
    // Verify all numeric fields are properly converted
    expect(typeof result!.print_time_hours).toBe('number');
    expect(typeof result!.material_weight_g).toBe('number');
    expect(typeof result!.total_cost).toBe('number');
    expect(typeof result!.sale_price).toBe('number');
    expect(typeof result!.profit_margin).toBe('number');
    
    expect(typeof result!.printer.power_consumption).toBe('number');
    expect(typeof result!.printer.print_speed).toBe('number');
    expect(typeof result!.printer.profit_percentage).toBe('number');
    
    expect(typeof result!.filament.cost_per_kg).toBe('number');
    expect(typeof result!.filament.density).toBe('number');
    
    expect(typeof result!.calculation.material_cost).toBe('number');
    expect(typeof result!.calculation.electricity_cost).toBe('number');
    expect(typeof result!.calculation.total_cost).toBe('number');
    
    // Verify specific values
    expect(result!.print_time_hours).toEqual(3.75);
    expect(result!.material_weight_g).toEqual(125.5);
    expect(result!.pieces_quantity).toEqual(3);
  });
});
