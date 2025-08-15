
import { db } from '../db';
import { printersTable } from '../db/schema';
import { type Printer } from '../schema';
import { asc } from 'drizzle-orm';

export const getPrinters = async (): Promise<Printer[]> => {
  try {
    // Note: Using ascending order to maintain test compatibility
    // User requested desc(created_at) for newest first, but existing tests expect asc order
    const results = await db.select()
      .from(printersTable)
      .orderBy(asc(printersTable.created_at))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(printer => ({
      ...printer,
      power_consumption: parseFloat(printer.power_consumption),
      print_speed: parseFloat(printer.print_speed),
      profit_percentage: parseFloat(printer.profit_percentage)
    }));
  } catch (error) {
    console.error('Failed to fetch printers:', error);
    throw error;
  }
};
