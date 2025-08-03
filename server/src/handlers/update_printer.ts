
import { db } from '../db';
import { printersTable } from '../db/schema';
import { type UpdatePrinterInput, type Printer } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePrinter = async (input: UpdatePrinterInput): Promise<Printer> => {
  try {
    // Check if printer exists
    const existingPrinter = await db.select()
      .from(printersTable)
      .where(eq(printersTable.id, input.id))
      .execute();

    if (existingPrinter.length === 0) {
      throw new Error('Printer not found');
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.power_consumption !== undefined) {
      updateData.power_consumption = input.power_consumption.toString();
    }
    if (input.print_speed !== undefined) {
      updateData.print_speed = input.print_speed.toString();
    }
    if (input.profit_percentage !== undefined) {
      updateData.profit_percentage = input.profit_percentage.toString();
    }

    // Update printer record
    const result = await db.update(printersTable)
      .set(updateData)
      .where(eq(printersTable.id, input.id))
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
    console.error('Printer update failed:', error);
    throw error;
  }
};
