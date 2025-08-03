
import { db } from '../db';
import { filamentsTable } from '../db/schema';
import { type CreateFilamentInput, type Filament } from '../schema';

export const createFilament = async (input: CreateFilamentInput): Promise<Filament> => {
  try {
    // Insert filament record
    const result = await db.insert(filamentsTable)
      .values({
        name: input.name,
        brand: input.brand,
        material_type: input.material_type,
        color: input.color,
        cost_per_kg: input.cost_per_kg.toString(), // Convert number to string for numeric column
        density: input.density.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const filament = result[0];
    return {
      ...filament,
      cost_per_kg: parseFloat(filament.cost_per_kg), // Convert string back to number
      density: parseFloat(filament.density) // Convert string back to number
    };
  } catch (error) {
    console.error('Filament creation failed:', error);
    throw error;
  }
};
