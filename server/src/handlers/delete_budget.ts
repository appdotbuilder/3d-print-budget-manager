
import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteBudget = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the budget record
    const result = await db.delete(budgetsTable)
      .where(eq(budgetsTable.id, id))
      .returning()
      .execute();

    // Check if any record was actually deleted
    if (result.length === 0) {
      throw new Error(`Budget with id ${id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Budget deletion failed:', error);
    throw error;
  }
};
