
import { db } from '../db';
import { filamentsTable } from '../db/schema';
import { type Filament } from '../schema';
import { asc } from 'drizzle-orm';

export const getFilaments = async (): Promise<Filament[]> => {
  try {
    const results = await db.select()
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
