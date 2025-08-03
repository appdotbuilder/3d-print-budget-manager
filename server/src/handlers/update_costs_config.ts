
import { db } from '../db';
import { costsConfigTable } from '../db/schema';
import { type CostsConfigInput, type CostsConfig } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCostsConfig = async (input: CostsConfigInput): Promise<CostsConfig> => {
  try {
    // First, check if a config already exists
    const existingConfigs = await db.select()
      .from(costsConfigTable)
      .limit(1)
      .execute();

    if (existingConfigs.length > 0) {
      // Update existing config
      const result = await db.update(costsConfigTable)
        .set({
          electricity_cost_per_kwh: input.electricity_cost_per_kwh.toString(),
          rent_cost_per_month: input.rent_cost_per_month.toString(),
          employee_cost_per_month: input.employee_cost_per_month.toString(),
          maintenance_cost_per_month: input.maintenance_cost_per_month.toString(),
          waste_percentage: input.waste_percentage.toString(),
          error_percentage: input.error_percentage.toString(),
          updated_at: new Date()
        })
        .where(eq(costsConfigTable.id, existingConfigs[0].id))
        .returning()
        .execute();

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
    } else {
      // Create new config
      const result = await db.insert(costsConfigTable)
        .values({
          electricity_cost_per_kwh: input.electricity_cost_per_kwh.toString(),
          rent_cost_per_month: input.rent_cost_per_month.toString(),
          employee_cost_per_month: input.employee_cost_per_month.toString(),
          maintenance_cost_per_month: input.maintenance_cost_per_month.toString(),
          waste_percentage: input.waste_percentage.toString(),
          error_percentage: input.error_percentage.toString()
        })
        .returning()
        .execute();

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
    }
  } catch (error) {
    console.error('Costs config update failed:', error);
    throw error;
  }
};
