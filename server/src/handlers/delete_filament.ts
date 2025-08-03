
import { db } from '../db';
import { filamentsTable, budgetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteFilament = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Check if filament exists
    const existingFilament = await db.select()
      .from(filamentsTable)
      .where(eq(filamentsTable.id, id))
      .execute();

    if (existingFilament.length === 0) {
      throw new Error('Filament not found');
    }

    // Check for dependencies - budgets using this filament
    const dependentBudgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.filament_id, id))
      .execute();

    if (dependentBudgets.length > 0) {
      throw new Error('Cannot delete filament: it is being used in existing budgets');
    }

    // Delete the filament
    await db.delete(filamentsTable)
      .where(eq(filamentsTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Filament deletion failed:', error);
    throw error;
  }
};
