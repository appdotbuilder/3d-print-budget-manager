
import { db } from '../db';
import { budgetsTable, printersTable, filamentsTable, costsConfigTable } from '../db/schema';
import { type CreateBudgetInput, type Budget, type BudgetCalculation } from '../schema';
import { eq } from 'drizzle-orm';

const calculateBudget = async (
  printTimeHours: number,
  materialWeightG: number,
  piecesQuantity: number,
  printer: any,
  filament: any,
  costsConfig: any
): Promise<BudgetCalculation> => {
  // Material cost calculation
  const materialWeightKg = materialWeightG / 1000;
  const materialCostPerKg = parseFloat(filament.cost_per_kg);
  const baseMaterialCost = materialWeightKg * materialCostPerKg * piecesQuantity;
  
  // Add waste percentage
  const wastePercentage = parseFloat(costsConfig.waste_percentage) / 100;
  const materialCost = baseMaterialCost * (1 + wastePercentage);

  // Electricity cost calculation
  const powerConsumptionKw = parseFloat(printer.power_consumption) / 1000; // Convert watts to kW
  const electricityCostPerKwh = parseFloat(costsConfig.electricity_cost_per_kwh);
  const electricityCost = printTimeHours * powerConsumptionKw * electricityCostPerKwh * piecesQuantity;

  // Fixed costs allocation (assuming 720 hours per month working time)
  const monthlyWorkingHours = 720;
  const monthlyRent = parseFloat(costsConfig.rent_cost_per_month);
  const monthlyEmployee = parseFloat(costsConfig.employee_cost_per_month);
  const monthlyMaintenance = parseFloat(costsConfig.maintenance_cost_per_month);
  const totalMonthlyFixedCosts = monthlyRent + monthlyEmployee + monthlyMaintenance;
  const fixedCostPerHour = totalMonthlyFixedCosts / monthlyWorkingHours;
  const fixedCosts = fixedCostPerHour * printTimeHours * piecesQuantity;

  // Error cost (percentage of material + electricity cost)
  const errorPercentage = parseFloat(costsConfig.error_percentage) / 100;
  const errorCost = (materialCost + electricityCost) * errorPercentage;

  // Total cost
  const totalCost = materialCost + electricityCost + fixedCosts + errorCost;

  // Profit calculation
  const profitPercentage = parseFloat(printer.profit_percentage) / 100;
  const profitAmount = totalCost * profitPercentage;
  const salePrice = totalCost + profitAmount;

  // Per piece calculations
  const costPerPiece = totalCost / piecesQuantity;
  const pricePerPiece = salePrice / piecesQuantity;
  
  // Profit margin percentage
  const profitMarginPercentage = (profitAmount / salePrice) * 100;

  return {
    material_cost: materialCost,
    electricity_cost: electricityCost,
    fixed_costs: fixedCosts,
    waste_cost: materialCost - baseMaterialCost,
    error_cost: errorCost,
    total_cost: totalCost,
    profit_amount: profitAmount,
    sale_price: salePrice,
    profit_margin_percentage: profitMarginPercentage,
    cost_per_piece: costPerPiece,
    price_per_piece: pricePerPiece
  };
};

export const createBudget = async (input: CreateBudgetInput): Promise<Budget> => {
  try {
    // Verify printer exists
    const printers = await db.select()
      .from(printersTable)
      .where(eq(printersTable.id, input.printer_id))
      .execute();
    
    if (printers.length === 0) {
      throw new Error('Printer not found');
    }
    const printer = printers[0];

    // Verify filament exists
    const filaments = await db.select()
      .from(filamentsTable)
      .where(eq(filamentsTable.id, input.filament_id))
      .execute();
    
    if (filaments.length === 0) {
      throw new Error('Filament not found');
    }
    const filament = filaments[0];

    // Get costs configuration (assuming there's always one record)
    const costsConfigs = await db.select()
      .from(costsConfigTable)
      .execute();
    
    if (costsConfigs.length === 0) {
      throw new Error('Costs configuration not found');
    }
    const costsConfig = costsConfigs[0];

    // Calculate budget
    const calculation = await calculateBudget(
      input.print_time_hours,
      input.material_weight_g,
      input.pieces_quantity,
      printer,
      filament,
      costsConfig
    );

    // Create budget record
    const result = await db.insert(budgetsTable)
      .values({
        name: input.name,
        printer_id: input.printer_id,
        filament_id: input.filament_id,
        print_time_hours: input.print_time_hours.toString(),
        material_weight_g: input.material_weight_g.toString(),
        pieces_quantity: input.pieces_quantity,
        total_cost: calculation.total_cost.toString(),
        sale_price: calculation.sale_price.toString(),
        profit_margin: calculation.profit_margin_percentage.toString()
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers
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
    console.error('Budget creation failed:', error);
    throw error;
  }
};
