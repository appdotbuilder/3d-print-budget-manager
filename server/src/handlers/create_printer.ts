
import { db } from '../db';
import { printersTable } from '../db/schema';
import { type CreatePrinterInput, type Printer } from '../schema';

export const createPrinter = async (input: CreatePrinterInput): Promise<Printer> => {
  try {
    // Insert printer record
    const result = await db.insert(printersTable)
      .values({
        name: input.name,
        power_consumption: input.power_consumption.toString(),
        print_speed: input.print_speed.toString(),
        profit_percentage: input.profit_percentage.toString()
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const printer = result[0];
    return {
      ...printer,
      power_consumption: parseFloat(printer.power_consumption),
      print_speed: parseFloat(printer.print_speed),
      profit_percentage: parseFloat(printer.profit_percentage)
    };
  } catch (error) {
    console.error('Printer creation failed:', error);
    throw error;
  }
};
