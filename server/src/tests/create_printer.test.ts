
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { printersTable } from '../db/schema';
import { type CreatePrinterInput } from '../schema';
import { createPrinter } from '../handlers/create_printer';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreatePrinterInput = {
  name: 'Ender 3 Pro',
  power_consumption: 220.5,
  print_speed: 60.0,
  profit_percentage: 25.0
};

describe('createPrinter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a printer', async () => {
    const result = await createPrinter(testInput);

    // Basic field validation
    expect(result.name).toEqual('Ender 3 Pro');
    expect(result.power_consumption).toEqual(220.5);
    expect(typeof result.power_consumption).toBe('number');
    expect(result.print_speed).toEqual(60.0);
    expect(typeof result.print_speed).toBe('number');
    expect(result.profit_percentage).toEqual(25.0);
    expect(typeof result.profit_percentage).toBe('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save printer to database', async () => {
    const result = await createPrinter(testInput);

    // Query using proper drizzle syntax
    const printers = await db.select()
      .from(printersTable)
      .where(eq(printersTable.id, result.id))
      .execute();

    expect(printers).toHaveLength(1);
    expect(printers[0].name).toEqual('Ender 3 Pro');
    expect(parseFloat(printers[0].power_consumption)).toEqual(220.5);
    expect(parseFloat(printers[0].print_speed)).toEqual(60.0);
    expect(parseFloat(printers[0].profit_percentage)).toEqual(25.0);
    expect(printers[0].created_at).toBeInstanceOf(Date);
    expect(printers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different numeric values correctly', async () => {
    const highPrecisionInput: CreatePrinterInput = {
      name: 'Precision Printer',
      power_consumption: 150.75,
      print_speed: 45.25,
      profit_percentage: 30.5
    };

    const result = await createPrinter(highPrecisionInput);

    // Verify numeric precision is maintained
    expect(result.power_consumption).toEqual(150.75);
    expect(result.print_speed).toEqual(45.25);
    expect(result.profit_percentage).toEqual(30.5);

    // Verify database storage
    const printers = await db.select()
      .from(printersTable)
      .where(eq(printersTable.id, result.id))
      .execute();

    expect(parseFloat(printers[0].power_consumption)).toEqual(150.75);
    expect(parseFloat(printers[0].print_speed)).toEqual(45.25);
    expect(parseFloat(printers[0].profit_percentage)).toEqual(30.5);
  });

  it('should create multiple printers with unique ids', async () => {
    const firstPrinter = await createPrinter(testInput);
    
    const secondInput: CreatePrinterInput = {
      name: 'Prusa i3 MK3S',
      power_consumption: 120.0,
      print_speed: 80.0,
      profit_percentage: 20.0
    };
    
    const secondPrinter = await createPrinter(secondInput);

    // Verify different IDs
    expect(firstPrinter.id).not.toEqual(secondPrinter.id);
    expect(firstPrinter.name).toEqual('Ender 3 Pro');
    expect(secondPrinter.name).toEqual('Prusa i3 MK3S');

    // Verify both exist in database
    const allPrinters = await db.select()
      .from(printersTable)
      .execute();

    expect(allPrinters).toHaveLength(2);
  });
});
