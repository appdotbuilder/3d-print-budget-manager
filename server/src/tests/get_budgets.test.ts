
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { printersTable, filamentsTable, budgetsTable } from '../db/schema';
import { getBudgets } from '../handlers/get_budgets';

describe('getBudgets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no budgets exist', async () => {
    const result = await getBudgets();
    expect(result).toEqual([]);
  });

  it('should return all budgets with correct data types', async () => {
    // Create prerequisite printer
    const printerResult = await db.insert(printersTable).values({
      name: 'Test Printer',
      power_consumption: '100.50',
      print_speed: '50.25',
      profit_percentage: '20.00'
    }).returning().execute();
    const printerId = printerResult[0].id;

    // Create prerequisite filament
    const filamentResult = await db.insert(filamentsTable).values({
      name: 'Test Filament',
      brand: 'Test Brand',
      material_type: 'PLA',
      color: 'Red',
      cost_per_kg: '25.99',
      density: '1.240'
    }).returning().execute();
    const filamentId = filamentResult[0].id;

    // Create test budget
    await db.insert(budgetsTable).values({
      name: 'Test Budget',
      printer_id: printerId,
      filament_id: filamentId,
      print_time_hours: '5.50',
      material_weight_g: '150.75',
      pieces_quantity: 10,
      total_cost: '45.99',
      sale_price: '55.19',
      profit_margin: '20.00'
    }).execute();

    const result = await getBudgets();

    expect(result).toHaveLength(1);
    
    const budget = result[0];
    expect(budget.name).toBe('Test Budget');
    expect(budget.printer_id).toBe(printerId);
    expect(budget.filament_id).toBe(filamentId);
    expect(budget.pieces_quantity).toBe(10);
    expect(budget.id).toBeDefined();
    expect(budget.created_at).toBeInstanceOf(Date);
    expect(budget.updated_at).toBeInstanceOf(Date);

    // Verify numeric field conversions
    expect(typeof budget.print_time_hours).toBe('number');
    expect(budget.print_time_hours).toBe(5.50);
    expect(typeof budget.material_weight_g).toBe('number');
    expect(budget.material_weight_g).toBe(150.75);
    expect(typeof budget.total_cost).toBe('number');
    expect(budget.total_cost).toBe(45.99);
    expect(typeof budget.sale_price).toBe('number');
    expect(budget.sale_price).toBe(55.19);
    expect(typeof budget.profit_margin).toBe('number');
    expect(budget.profit_margin).toBe(20.00);
  });

  it('should return multiple budgets correctly', async () => {
    // Create prerequisite printer
    const printerResult = await db.insert(printersTable).values({
      name: 'Test Printer',
      power_consumption: '100.00',
      print_speed: '50.00',
      profit_percentage: '20.00'
    }).returning().execute();
    const printerId = printerResult[0].id;

    // Create prerequisite filament
    const filamentResult = await db.insert(filamentsTable).values({
      name: 'Test Filament',
      brand: 'Test Brand',
      material_type: 'PLA',
      color: 'Red',
      cost_per_kg: '25.00',
      density: '1.240'
    }).returning().execute();
    const filamentId = filamentResult[0].id;

    // Create multiple test budgets
    await db.insert(budgetsTable).values([
      {
        name: 'Budget 1',
        printer_id: printerId,
        filament_id: filamentId,
        print_time_hours: '2.00',
        material_weight_g: '100.00',
        pieces_quantity: 5,
        total_cost: '30.00',
        sale_price: '36.00',
        profit_margin: '20.00'
      },
      {
        name: 'Budget 2',
        printer_id: printerId,
        filament_id: filamentId,
        print_time_hours: '4.50',
        material_weight_g: '200.25',
        pieces_quantity: 8,
        total_cost: '50.75',
        sale_price: '60.90',
        profit_margin: '20.00'
      }
    ]).execute();

    const result = await getBudgets();

    expect(result).toHaveLength(2);
    
    // Verify both budgets have correct structure and types
    result.forEach(budget => {
      expect(budget.id).toBeDefined();
      expect(typeof budget.name).toBe('string');
      expect(typeof budget.printer_id).toBe('number');
      expect(typeof budget.filament_id).toBe('number');
      expect(typeof budget.pieces_quantity).toBe('number');
      expect(typeof budget.print_time_hours).toBe('number');
      expect(typeof budget.material_weight_g).toBe('number');
      expect(typeof budget.total_cost).toBe('number');
      expect(typeof budget.sale_price).toBe('number');
      expect(typeof budget.profit_margin).toBe('number');
      expect(budget.created_at).toBeInstanceOf(Date);
      expect(budget.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific budget data
    const budget1 = result.find(b => b.name === 'Budget 1');
    const budget2 = result.find(b => b.name === 'Budget 2');
    
    expect(budget1).toBeDefined();
    expect(budget1!.print_time_hours).toBe(2.00);
    expect(budget1!.pieces_quantity).toBe(5);
    
    expect(budget2).toBeDefined();
    expect(budget2!.material_weight_g).toBe(200.25);
    expect(budget2!.pieces_quantity).toBe(8);
  });
});
