
import { db } from '../db';
import { budgetsTable, printersTable, filamentsTable, costsConfigTable } from '../db/schema';
import { type CreateBudgetInput, type Budget } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const updateBudget = async (id: number, input: CreateBudgetInput): Promise<Budget> => {
  try {
    // Verify budget exists
    const existingBudget = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, id))
      .execute();

    if (existingBudget.length === 0) {
      throw new Error('Budget not found');
    }

    // Verify printer exists
    const printer = await db.select()
      .from(printersTable)
      .where(eq(printersTable.id, input.printer_id))
      .execute();

    if (printer.length === 0) {
      throw new Error('Printer not found');
    }

    // Verify filament exists
    const filament = await db.select()
      .from(filamentsTable)
      .where(eq(filamentsTable.id, input.filament_id))
      .execute();

    if (filament.length === 0) {
      throw new Error('Filament not found');
    }

    // Get latest costs configuration
    const costsConfig = await db.select()
      .from(costsConfigTable)
      .orderBy(desc(costsConfigTable.created_at))
      .limit(1)
      .execute();

    if (costsConfig.length === 0) {
      throw new Error('Costs configuration not found');
    }

    const config = costsConfig[0];
    const printerData = printer[0];
    const filamentData = filament[0];

    // Calculate costs
    const materialCostPerG = parseFloat(filamentData.cost_per_kg) / 1000; // Convert kg to g
    const materialCost = materialCostPerG * input.material_weight_g;

    const electricityCost = (parseFloat(printerData.power_consumption) / 1000) * // Convert W to kW
                           input.print_time_hours * 
                           parseFloat(config.electricity_cost_per_kwh);

    // Fixed costs calculation (monthly costs distributed per hour)
    const hoursPerMonth = 30 * 24; // Assume 30 days per month, 24 hours per day
    const fixedCostPerHour = (
      parseFloat(config.rent_cost_per_month) +
      parseFloat(config.employee_cost_per_month) +
      parseFloat(config.maintenance_cost_per_month)
    ) / hoursPerMonth;
    const fixedCosts = fixedCostPerHour * input.print_time_hours;

    // Waste and error costs
    const wasteCost = materialCost * (parseFloat(config.waste_percentage) / 100);
    const errorCost = (materialCost + electricityCost) * (parseFloat(config.error_percentage) / 100);

    // Total cost for all pieces
    const totalCost = (materialCost + electricityCost + fixedCosts + wasteCost + errorCost) * input.pieces_quantity;

    // Apply profit margin from printer
    const profitAmount = totalCost * (parseFloat(printerData.profit_percentage) / 100);
    const salePrice = totalCost + profitAmount;
    const profitMargin = (profitAmount / totalCost) * 100;

    // Update budget record
    const result = await db.update(budgetsTable)
      .set({
        name: input.name,
        printer_id: input.printer_id,
        filament_id: input.filament_id,
        print_time_hours: input.print_time_hours.toString(),
        material_weight_g: input.material_weight_g.toString(),
        pieces_quantity: input.pieces_quantity,
        total_cost: totalCost.toString(),
        sale_price: salePrice.toString(),
        profit_margin: profitMargin.toString(),
        updated_at: new Date()
      })
      .where(eq(budgetsTable.id, id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const budget = result[0];
    return {
      ...budget,
      print_time_hours: parseFloat(budget.print_time_hours),
      material_weight_g: parseFloat(budget.material_weight_g),
      total_cost: parseFloat(budget.total_cost),
      sale_price: parseFloat(budget.sale_price),
      profit_margin: parseFloat(budget.profit_margin)
    };
  } catch (error) {
    console.error('Budget update failed:', error);
    throw error;
  }
};
