
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { printersTable } from '../db/schema';
import { getPrinters } from '../handlers/get_printers';

describe('getPrinters', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no printers exist', async () => {
    const result = await getPrinters();
    expect(result).toEqual([]);
  });

  it('should return all printers with correct data types', async () => {
    // Create test printers
    await db.insert(printersTable)
      .values([
        {
          name: 'Printer 1',
          power_consumption: '150.50',
          print_speed: '60.25',
          profit_percentage: '25.00'
        },
        {
          name: 'Printer 2',
          power_consumption: '200.75',
          print_speed: '45.50',
          profit_percentage: '30.50'
        }
      ])
      .execute();

    const result = await getPrinters();

    expect(result).toHaveLength(2);
    
    // Verify first printer
    expect(result[0].name).toEqual('Printer 1');
    expect(result[0].power_consumption).toEqual(150.50);
    expect(result[0].print_speed).toEqual(60.25);
    expect(result[0].profit_percentage).toEqual(25.00);
    expect(typeof result[0].power_consumption).toBe('number');
    expect(typeof result[0].print_speed).toBe('number');
    expect(typeof result[0].profit_percentage).toBe('number');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second printer
    expect(result[1].name).toEqual('Printer 2');
    expect(result[1].power_consumption).toEqual(200.75);
    expect(result[1].print_speed).toEqual(45.50);
    expect(result[1].profit_percentage).toEqual(30.50);
  });

  it('should return printers ordered by insertion order', async () => {
    // Create test printers in specific order
    await db.insert(printersTable)
      .values({
        name: 'First Printer',
        power_consumption: '100.00',
        print_speed: '50.00',
        profit_percentage: '20.00'
      })
      .execute();

    await db.insert(printersTable)
      .values({
        name: 'Second Printer',
        power_consumption: '120.00',
        print_speed: '55.00',
        profit_percentage: '25.00'
      })
      .execute();

    const result = await getPrinters();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Printer');
    expect(result[1].name).toEqual('Second Printer');
    
    // Verify IDs are in ascending order (insertion order)
    expect(result[0].id).toBeLessThan(result[1].id);
  });
});
