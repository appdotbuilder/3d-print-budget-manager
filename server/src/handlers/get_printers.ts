
import { db } from '../db';
import { printersTable } from '../db/schema';
import { type Printer } from '../schema';

export const getPrinters = async (): Promise<Printer[]> => {
  try {
    const results = await db.select()
      .from(printersTable)
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
