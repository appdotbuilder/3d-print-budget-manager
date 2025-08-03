
import { db } from '../db';
import { printersTable, budgetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePrinter = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Check if printer exists
    const printer = await db.select()
      .from(printersTable)
      .where(eq(printersTable.id, id))
      .execute();

    if (printer.length === 0) {
      throw new Error('Printer not found');
    }

    // Check for dependencies - budgets using this printer
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.printer_id, id))
      .execute();

    if (budgets.length > 0) {
      throw new Error('Cannot delete printer: it is being used in budgets');
    }

    // Delete the printer
    await db.delete(printersTable)
      .where(eq(printersTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Printer deletion failed:', error);
    throw error;
  }
};
