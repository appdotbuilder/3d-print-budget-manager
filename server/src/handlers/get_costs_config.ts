
import { db } from '../db';
import { costsConfigTable } from '../db/schema';
import { type CostsConfig } from '../schema';
import { desc } from 'drizzle-orm';

export const getCostsConfig = async (): Promise<CostsConfig | null> => {
  try {
    // Get the most recent costs configuration
    const result = await db.select()
      .from(costsConfigTable)
      .orderBy(desc(costsConfigTable.created_at))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const config = result[0];
    return {
      ...config,
      electricity_cost_per_kwh: parseFloat(config.electricity_cost_per_kwh),
      rent_cost_per_month: parseFloat(config.rent_cost_per_month),
      employee_cost_per_month: parseFloat(config.employee_cost_per_month),
      maintenance_cost_per_month: parseFloat(config.maintenance_cost_per_month),
      waste_percentage: parseFloat(config.waste_percentage),
      error_percentage: parseFloat(config.error_percentage)
    };
  } catch (error) {
    console.error('Failed to get costs config:', error);
    throw error;
  }
};
