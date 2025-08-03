
import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { type Budget } from '../schema';

export const getBudgets = async (): Promise<Budget[]> => {
  try {
    const results = await db.select()
      .from(budgetsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(budget => ({
      ...budget,
      print_time_hours: parseFloat(budget.print_time_hours),
      material_weight_g: parseFloat(budget.material_weight_g),
      total_cost: parseFloat(budget.total_cost),
      sale_price: parseFloat(budget.sale_price),
      profit_margin: parseFloat(budget.profit_margin)
    }));
  } catch (error) {
    console.error('Failed to fetch budgets:', error);
    throw error;
  }
};
