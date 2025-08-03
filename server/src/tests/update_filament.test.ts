
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filamentsTable } from '../db/schema';
import { type CreateFilamentInput, type UpdateFilamentInput } from '../schema';
import { updateFilament } from '../handlers/update_filament';
import { eq } from 'drizzle-orm';

// Test filament input for creating initial data
const testCreateInput: CreateFilamentInput = {
  name: 'Original Filament',
  brand: 'Original Brand',
  material_type: 'PLA',
  color: 'Red',
  cost_per_kg: 25.00,
  density: 1.24
};

describe('updateFilament', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let filamentId: number;

  beforeEach(async () => {
    // Create initial filament for testing updates
    const result = await db.insert(filamentsTable)
      .values({
        name: testCreateInput.name,
        brand: testCreateInput.brand,
        material_type: testCreateInput.material_type,
        color: testCreateInput.color,
        cost_per_kg: testCreateInput.cost_per_kg.toString(),
        density: testCreateInput.density.toString()
      })
      .returning()
      .execute();
    
    filamentId = result[0].id;
  });

  it('should update all filament fields', async () => {
    const updateInput: UpdateFilamentInput = {
      id: filamentId,
      name: 'Updated Filament',
      brand: 'Updated Brand',
      material_type: 'ABS',
      color: 'Blue',
      cost_per_kg: 30.50,
      density: 1.05
    };

    const result = await updateFilament(updateInput);

    expect(result.id).toEqual(filamentId);
    expect(result.name).toEqual('Updated Filament');
    expect(result.brand).toEqual('Updated Brand');
    expect(result.material_type).toEqual('ABS');
    expect(result.color).toEqual('Blue');
    expect(result.cost_per_kg).toEqual(30.50);
    expect(result.density).toEqual(1.05);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.cost_per_kg).toBe('number');
    expect(typeof result.density).toBe('number');
  });

  it('should update partial filament fields', async () => {
    const updateInput: UpdateFilamentInput = {
      id: filamentId,
      name: 'Partially Updated',
      cost_per_kg: 35.75
    };

    const result = await updateFilament(updateInput);

    expect(result.id).toEqual(filamentId);
    expect(result.name).toEqual('Partially Updated');
    expect(result.brand).toEqual('Original Brand'); // Unchanged
    expect(result.material_type).toEqual('PLA'); // Unchanged
    expect(result.color).toEqual('Red'); // Unchanged
    expect(result.cost_per_kg).toEqual(35.75);
    expect(result.density).toEqual(1.24); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    const updateInput: UpdateFilamentInput = {
      id: filamentId,
      name: 'Database Test',
      brand: 'Test Brand',
      cost_per_kg: 40.00
    };

    await updateFilament(updateInput);

    // Verify changes in database
    const filaments = await db.select()
      .from(filamentsTable)
      .where(eq(filamentsTable.id, filamentId))
      .execute();

    expect(filaments).toHaveLength(1);
    const filament = filaments[0];
    expect(filament.name).toEqual('Database Test');
    expect(filament.brand).toEqual('Test Brand');
    expect(parseFloat(filament.cost_per_kg)).toEqual(40.00);
    expect(filament.material_type).toEqual('PLA'); // Unchanged
    expect(filament.color).toEqual('Red'); // Unchanged
    expect(parseFloat(filament.density)).toEqual(1.24); // Unchanged
    expect(filament.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent filament', async () => {
    const updateInput: UpdateFilamentInput = {
      id: 99999,
      name: 'Non-existent'
    };

    expect(updateFilament(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update only numeric fields correctly', async () => {
    const updateInput: UpdateFilamentInput = {
      id: filamentId,
      cost_per_kg: 22.99,
      density: 1.30
    };

    const result = await updateFilament(updateInput);

    expect(result.cost_per_kg).toEqual(22.99);
    expect(result.density).toEqual(1.30);
    expect(typeof result.cost_per_kg).toBe('number');
    expect(typeof result.density).toBe('number');
    
    // Verify other fields remain unchanged
    expect(result.name).toEqual('Original Filament');
    expect(result.brand).toEqual('Original Brand');
    expect(result.material_type).toEqual('PLA');
    expect(result.color).toEqual('Red');
  });
});
