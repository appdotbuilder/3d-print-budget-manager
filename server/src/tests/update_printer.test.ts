
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { printersTable } from '../db/schema';
import { type UpdatePrinterInput } from '../schema';
import { updatePrinter } from '../handlers/update_printer';
import { eq } from 'drizzle-orm';

describe('updatePrinter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update printer name', async () => {
    // Create initial printer directly in database
    const createdResult = await db.insert(printersTable)
      .values({
        name: 'Original Printer',
        power_consumption: '200',
        print_speed: '50',
        profit_percentage: '25'
      })
      .returning()
      .execute();

    const createdPrinter = {
      ...createdResult[0],
      power_consumption: parseFloat(createdResult[0].power_consumption),
      print_speed: parseFloat(createdResult[0].print_speed),
      profit_percentage: parseFloat(createdResult[0].profit_percentage)
    };

    const updateInput: UpdatePrinterInput = {
      id: createdPrinter.id,
      name: 'Updated Printer Name'
    };

    const result = await updatePrinter(updateInput);

    expect(result.id).toEqual(createdPrinter.id);
    expect(result.name).toEqual('Updated Printer Name');
    expect(result.power_consumption).toEqual(200);
    expect(result.print_speed).toEqual(50);
    expect(result.profit_percentage).toEqual(25);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdPrinter.updated_at).toBe(true);
  });

  it('should update multiple fields', async () => {
    // Create initial printer directly in database
    const createdResult = await db.insert(printersTable)
      .values({
        name: 'Original Printer',
        power_consumption: '200',
        print_speed: '50',
        profit_percentage: '25'
      })
      .returning()
      .execute();

    const createdPrinter = createdResult[0];

    const updateInput: UpdatePrinterInput = {
      id: createdPrinter.id,
      name: 'Multi-Update Printer',
      power_consumption: 300,
      print_speed: 75,
      profit_percentage: 35
    };

    const result = await updatePrinter(updateInput);

    expect(result.name).toEqual('Multi-Update Printer');
    expect(result.power_consumption).toEqual(300);
    expect(result.print_speed).toEqual(75);
    expect(result.profit_percentage).toEqual(35);
    expect(typeof result.power_consumption).toBe('number');
    expect(typeof result.print_speed).toBe('number');
    expect(typeof result.profit_percentage).toBe('number');
  });

  it('should update only specified fields', async () => {
    // Create initial printer directly in database
    const createdResult = await db.insert(printersTable)
      .values({
        name: 'Original Printer',
        power_consumption: '200',
        print_speed: '50',
        profit_percentage: '25'
      })
      .returning()
      .execute();

    const createdPrinter = createdResult[0];

    const updateInput: UpdatePrinterInput = {
      id: createdPrinter.id,
      power_consumption: 400
    };

    const result = await updatePrinter(updateInput);

    expect(result.name).toEqual('Original Printer'); // Unchanged
    expect(result.power_consumption).toEqual(400); // Changed
    expect(result.print_speed).toEqual(50); // Unchanged
    expect(result.profit_percentage).toEqual(25); // Unchanged
  });

  it('should save updated printer to database', async () => {
    // Create initial printer directly in database
    const createdResult = await db.insert(printersTable)
      .values({
        name: 'Original Printer',
        power_consumption: '200',
        print_speed: '50',
        profit_percentage: '25'
      })
      .returning()
      .execute();

    const createdPrinter = createdResult[0];

    const updateInput: UpdatePrinterInput = {
      id: createdPrinter.id,
      name: 'Database Updated Printer',
      print_speed: 100
    };

    const result = await updatePrinter(updateInput);

    // Query database to verify changes
    const printers = await db.select()
      .from(printersTable)
      .where(eq(printersTable.id, result.id))
      .execute();

    expect(printers).toHaveLength(1);
    expect(printers[0].name).toEqual('Database Updated Printer');
    expect(parseFloat(printers[0].print_speed)).toEqual(100);
    expect(parseFloat(printers[0].power_consumption)).toEqual(200); // Unchanged
    expect(printers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent printer', async () => {
    const updateInput: UpdatePrinterInput = {
      id: 99999,
      name: 'Non-existent Printer'
    };

    expect(updatePrinter(updateInput)).rejects.toThrow(/printer not found/i);
  });

  it('should handle decimal values correctly', async () => {
    // Create initial printer directly in database
    const createdResult = await db.insert(printersTable)
      .values({
        name: 'Original Printer',
        power_consumption: '200',
        print_speed: '50',
        profit_percentage: '25'
      })
      .returning()
      .execute();

    const createdPrinter = createdResult[0];

    const updateInput: UpdatePrinterInput = {
      id: createdPrinter.id,
      power_consumption: 250.75,
      print_speed: 62.5,
      profit_percentage: 33.33
    };

    const result = await updatePrinter(updateInput);

    expect(result.power_consumption).toEqual(250.75);
    expect(result.print_speed).toEqual(62.5);
    expect(result.profit_percentage).toEqual(33.33);
  });
});
