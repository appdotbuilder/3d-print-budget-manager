
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filamentsTable } from '../db/schema';
import { type CreateFilamentInput } from '../schema';
import { getFilaments } from '../handlers/get_filaments';

// Test filament data
const testFilament1: CreateFilamentInput = {
  name: 'PLA Premium',
  brand: 'BrandA',
  material_type: 'PLA',
  color: 'Red',
  cost_per_kg: 25.50,
  density: 1.24
};

const testFilament2: CreateFilamentInput = {
  name: 'ABS Pro',
  brand: 'BrandB',
  material_type: 'ABS',
  color: 'Blue',
  cost_per_kg: 30.00,
  density: 1.05
};

const testFilament3: CreateFilamentInput = {
  name: 'PETG Clear',
  brand: 'BrandC',
  material_type: 'PETG',
  color: 'Transparent',
  cost_per_kg: 35.75,
  density: 1.27
};

describe('getFilaments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no filaments exist', async () => {
    const result = await getFilaments();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all filaments from database', async () => {
    // Insert test filaments
    await db.insert(filamentsTable)
      .values([
        {
          ...testFilament1,
          cost_per_kg: testFilament1.cost_per_kg.toString(),
          density: testFilament1.density.toString()
        },
        {
          ...testFilament2,
          cost_per_kg: testFilament2.cost_per_kg.toString(),
          density: testFilament2.density.toString()
        },
        {
          ...testFilament3,
          cost_per_kg: testFilament3.cost_per_kg.toString(),
          density: testFilament3.density.toString()
        }
      ])
      .execute();

    const result = await getFilaments();

    expect(result).toHaveLength(3);
    
    // Verify all filaments are returned
    const names = result.map(f => f.name);
    expect(names).toContain('PLA Premium');
    expect(names).toContain('ABS Pro');
    expect(names).toContain('PETG Clear');
  });

  it('should return filaments with correct data types and values', async () => {
    // Insert single test filament
    await db.insert(filamentsTable)
      .values({
        ...testFilament1,
        cost_per_kg: testFilament1.cost_per_kg.toString(),
        density: testFilament1.density.toString()
      })
      .execute();

    const result = await getFilaments();
    const filament = result[0];

    // Verify field types and values
    expect(typeof filament.id).toBe('number');
    expect(typeof filament.name).toBe('string');
    expect(typeof filament.brand).toBe('string');
    expect(typeof filament.material_type).toBe('string');
    expect(typeof filament.color).toBe('string');
    expect(typeof filament.cost_per_kg).toBe('number');
    expect(typeof filament.density).toBe('number');
    expect(filament.created_at).toBeInstanceOf(Date);
    expect(filament.updated_at).toBeInstanceOf(Date);

    // Verify specific values
    expect(filament.name).toEqual('PLA Premium');
    expect(filament.brand).toEqual('BrandA');
    expect(filament.material_type).toEqual('PLA');
    expect(filament.color).toEqual('Red');
    expect(filament.cost_per_kg).toEqual(25.50);
    expect(filament.density).toEqual(1.24);
  });

  it('should handle different material types correctly', async () => {
    // Insert filaments with different material types
    await db.insert(filamentsTable)
      .values([
        {
          ...testFilament1,
          cost_per_kg: testFilament1.cost_per_kg.toString(),
          density: testFilament1.density.toString()
        },
        {
          ...testFilament2,
          cost_per_kg: testFilament2.cost_per_kg.toString(),
          density: testFilament2.density.toString()
        },
        {
          ...testFilament3,
          cost_per_kg: testFilament3.cost_per_kg.toString(),
          density: testFilament3.density.toString()
        }
      ])
      .execute();

    const result = await getFilaments();

    // Group by material type
    const materialTypes = result.reduce((acc, filament) => {
      acc[filament.material_type] = (acc[filament.material_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(materialTypes['PLA']).toBe(1);
    expect(materialTypes['ABS']).toBe(1);
    expect(materialTypes['PETG']).toBe(1);
  });

  it('should preserve precision for numeric fields', async () => {
    // Test with precise decimal values
    const preciseFilament = {
      name: 'Precision Test',
      brand: 'TestBrand',
      material_type: 'PLA',
      color: 'White',
      cost_per_kg: 23.99,
      density: 1.234
    };

    await db.insert(filamentsTable)
      .values({
        ...preciseFilament,
        cost_per_kg: preciseFilament.cost_per_kg.toString(),
        density: preciseFilament.density.toString()
      })
      .execute();

    const result = await getFilaments();
    const filament = result[0];

    expect(filament.cost_per_kg).toEqual(23.99);
    expect(filament.density).toEqual(1.234);
  });

  it('should return filaments ordered by creation time', async () => {
    // Insert filaments in sequence
    await db.insert(filamentsTable)
      .values({
        ...testFilament1,
        cost_per_kg: testFilament1.cost_per_kg.toString(),
        density: testFilament1.density.toString()
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(filamentsTable)
      .values({
        ...testFilament2,
        cost_per_kg: testFilament2.cost_per_kg.toString(),
        density: testFilament2.density.toString()
      })
      .execute();

    const result = await getFilaments();

    expect(result).toHaveLength(2);
    // Verify timestamps are in order (first inserted should have earlier timestamp)
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
