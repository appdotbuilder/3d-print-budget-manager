
import { db } from '../db';
import { budgetsTable, printersTable, filamentsTable, costsConfigTable } from '../db/schema';
import { type BudgetWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export const getBudgetWithDetails = async (id: number): Promise<BudgetWithDetails | null> => {
  try {
    // Get budget with printer and filament data
    const results = await db.select()
      .from(budgetsTable)
      .innerJoin(printersTable, eq(budgetsTable.printer_id, printersTable.id))
      .innerJoin(filamentsTable, eq(budgetsTable.filament_id, filamentsTable.id))
      .where(eq(budgetsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    
    // Get current costs configuration for recalculation
    const costsConfigResults = await db.select()
      .from(costsConfigTable)
      .orderBy(costsConfigTable.created_at)
      .limit(1)
      .execute();

    // If no costs config exists, use default values
    const costsConfig = costsConfigResults[0] || {
      electricity_cost_per_kwh: '0.15',
      rent_cost_per_month: '1000',
      employee_cost_per_month: '3000',
      maintenance_cost_per_month: '500',
      waste_percentage: '5',
      error_percentage: '3'
    };

    // Extract and convert budget data
    const budget = {
      id: result.budgets.id,
      name: result.budgets.name,
      printer_id: result.budgets.printer_id,
      filament_id: result.budgets.filament_id,
      print_time_hours: parseFloat(result.budgets.print_time_hours),
      material_weight_g: parseFloat(result.budgets.material_weight_g),
      pieces_quantity: result.budgets.pieces_quantity,
      total_cost: parseFloat(result.budgets.total_cost),
      sale_price: parseFloat(result.budgets.sale_price),
      profit_margin: parseFloat(result.budgets.profit_margin),
      created_at: result.budgets.created_at,
      updated_at: result.budgets.updated_at
    };

    // Extract and convert printer data
    const printer = {
      id: result.printers.id,
      name: result.printers.name,
      power_consumption: parseFloat(result.printers.power_consumption),
      print_speed: parseFloat(result.printers.print_speed),
      profit_percentage: parseFloat(result.printers.profit_percentage),
      created_at: result.printers.created_at,
      updated_at: result.printers.updated_at
    };

    // Extract and convert filament data
    const filament = {
      id: result.filaments.id,
      name: result.filaments.name,
      brand: result.filaments.brand,
      material_type: result.filaments.material_type,
      color: result.filaments.color,
      cost_per_kg: parseFloat(result.filaments.cost_per_kg),
      density: parseFloat(result.filaments.density),
      created_at: result.filaments.created_at,
      updated_at: result.filaments.updated_at
    };

    // Recalculate costs with current configuration
    const material_cost = (budget.material_weight_g / 1000) * filament.cost_per_kg;
    const electricity_cost = (printer.power_consumption / 1000) * budget.print_time_hours * parseFloat(costsConfig.electricity_cost_per_kwh);
    
    // Estimate fixed costs based on print time (assuming 8 hours/day, 22 working days/month)
    const monthly_working_hours = 8 * 22;
    const fixed_cost_per_hour = (
      parseFloat(costsConfig.rent_cost_per_month) + 
      parseFloat(costsConfig.employee_cost_per_month) + 
      parseFloat(costsConfig.maintenance_cost_per_month)
    ) / monthly_working_hours;
    const fixed_costs = fixed_cost_per_hour * budget.print_time_hours;

    const waste_cost = material_cost * (parseFloat(costsConfig.waste_percentage) / 100);
    const error_cost = (material_cost + electricity_cost) * (parseFloat(costsConfig.error_percentage) / 100);

    const total_cost = material_cost + electricity_cost + fixed_costs + waste_cost + error_cost;
    const profit_amount = total_cost * (printer.profit_percentage / 100);
    const sale_price = total_cost + profit_amount;
    const profit_margin_percentage = (profit_amount / sale_price) * 100;

    const calculation = {
      material_cost,
      electricity_cost,
      fixed_costs,
      waste_cost,
      error_cost,
      total_cost,
      profit_amount,
      sale_price,
      profit_margin_percentage,
      cost_per_piece: total_cost / budget.pieces_quantity,
      price_per_piece: sale_price / budget.pieces_quantity
    };

    return {
      ...budget,
      printer,
      filament,
      calculation
    };
  } catch (error) {
    console.error('Failed to get budget with details:', error);
    throw error;
  }
};
