
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filamentsTable } from '../db/schema';
import { type CreateFilamentInput } from '../schema';
import { createFilament } from '../handlers/create_filament';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateFilamentInput = {
  name: 'Test Filament',
  brand: 'TestBrand',
  material_type: 'PLA',
  color: 'Red',
  cost_per_kg: 25.99,
  density: 1.24
};

describe('createFilament', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a filament', async () => {
    const result = await createFilament(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Filament');
    expect(result.brand).toEqual('TestBrand');
    expect(result.material_type).toEqual('PLA');
    expect(result.color).toEqual('Red');
    expect(result.cost_per_kg).toEqual(25.99);
    expect(result.density).toEqual(1.24);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save filament to database', async () => {
    const result = await createFilament(testInput);

    // Query using proper drizzle syntax
    const filaments = await db.select()
      .from(filamentsTable)
      .where(eq(filamentsTable.id, result.id))
      .execute();

    expect(filaments).toHaveLength(1);
    expect(filaments[0].name).toEqual('Test Filament');
    expect(filaments[0].brand).toEqual('TestBrand');
    expect(filaments[0].material_type).toEqual('PLA');
    expect(filaments[0].color).toEqual('Red');
    expect(parseFloat(filaments[0].cost_per_kg)).toEqual(25.99);
    expect(parseFloat(filaments[0].density)).toEqual(1.24);
    expect(filaments[0].created_at).toBeInstanceOf(Date);
    expect(filaments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle numeric types correctly', async () => {
    const result = await createFilament(testInput);

    // Verify numeric types are returned as numbers
    expect(typeof result.cost_per_kg).toEqual('number');
    expect(typeof result.density).toEqual('number');
    expect(result.cost_per_kg).toEqual(25.99);
    expect(result.density).toEqual(1.24);
  });

  it('should create filament with different material types', async () => {
    const absInput: CreateFilamentInput = {
      name: 'ABS Filament',
      brand: 'AnotherBrand',
      material_type: 'ABS',
      color: 'Blue',
      cost_per_kg: 30.50,
      density: 1.05
    };

    const result = await createFilament(absInput);

    expect(result.material_type).toEqual('ABS');
    expect(result.color).toEqual('Blue');
    expect(result.cost_per_kg).toEqual(30.50);
    expect(result.density).toEqual(1.05);
  });
});
