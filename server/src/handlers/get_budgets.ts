
import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { type Budget, type GetBudgetsInput } from '../schema';
import { desc, ilike } from 'drizzle-orm';

export const getBudgets = async (input: GetBudgetsInput = {}): Promise<Budget[]> => {
  try {
    // Build base query
    const baseQuery = db.select().from(budgetsTable);
    
    // Apply conditional filtering and execute in one step
    const results = input.query 
      ? await baseQuery
          .where(ilike(budgetsTable.name, `%${input.query}%`))
          .orderBy(desc(budgetsTable.created_at))
          .execute()
      : await baseQuery
          .orderBy(desc(budgetsTable.created_at))
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
