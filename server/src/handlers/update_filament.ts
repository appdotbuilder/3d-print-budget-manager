
import { db } from '../db';
import { filamentsTable } from '../db/schema';
import { type UpdateFilamentInput, type Filament } from '../schema';
import { eq } from 'drizzle-orm';

export const updateFilament = async (input: UpdateFilamentInput): Promise<Filament> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.brand !== undefined) {
      updateData.brand = input.brand;
    }
    if (input.material_type !== undefined) {
      updateData.material_type = input.material_type;
    }
    if (input.color !== undefined) {
      updateData.color = input.color;
    }
    if (input.cost_per_kg !== undefined) {
      updateData.cost_per_kg = input.cost_per_kg.toString();
    }
    if (input.density !== undefined) {
      updateData.density = input.density.toString();
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update filament record
    const result = await db.update(filamentsTable)
      .set(updateData)
      .where(eq(filamentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Filament with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const filament = result[0];
    return {
      ...filament,
      cost_per_kg: parseFloat(filament.cost_per_kg),
      density: parseFloat(filament.density)
    };
  } catch (error) {
    console.error('Filament update failed:', error);
    throw error;
  }
};
