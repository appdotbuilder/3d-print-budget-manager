
import { db } from '../db';
import { filamentsTable } from '../db/schema';
import { type Filament, type GetFilamentsInput } from '../schema';
import { asc, ilike, or } from 'drizzle-orm';

export const getFilaments = async (input: GetFilamentsInput = {}): Promise<Filament[]> => {
  try {
    const results = input.query 
      ? await db.select()
          .from(filamentsTable)
          .where(
            or(
              ilike(filamentsTable.name, `%${input.query}%`),
              ilike(filamentsTable.brand, `%${input.query}%`),
              ilike(filamentsTable.material_type, `%${input.query}%`),
              ilike(filamentsTable.color, `%${input.query}%`)
            )
          )
          .orderBy(asc(filamentsTable.created_at))
          .execute()
      : await db.select()
          .from(filamentsTable)
          .orderBy(asc(filamentsTable.created_at))
          .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(filament => ({
      ...filament,
      cost_per_kg: parseFloat(filament.cost_per_kg),
      density: parseFloat(filament.density)
    }));
  } catch (error) {
    console.error('Failed to fetch filaments:', error);
    throw error;
  }
};
