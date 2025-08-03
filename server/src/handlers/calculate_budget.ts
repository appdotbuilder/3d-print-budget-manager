
import { db } from '../db';
import { printersTable, filamentsTable, costsConfigTable } from '../db/schema';
import { type CreateBudgetInput, type BudgetCalculation } from '../schema';
import { eq } from 'drizzle-orm';

export const calculateBudget = async (input: CreateBudgetInput): Promise<BudgetCalculation> => {
  try {
    // Fetch printer data
    const printers = await db.select()
      .from(printersTable)
      .where(eq(printersTable.id, input.printer_id))
      .execute();

    if (printers.length === 0) {
      throw new Error(`Printer with id ${input.printer_id} not found`);
    }

    // Fetch filament data
    const filaments = await db.select()
      .from(filamentsTable)
      .where(eq(filamentsTable.id, input.filament_id))
      .execute();

    if (filaments.length === 0) {
      throw new Error(`Filament with id ${input.filament_id} not found`);
    }

    // Fetch costs configuration (get the latest one)
    const costsConfigs = await db.select()
      .from(costsConfigTable)
      .execute();

    if (costsConfigs.length === 0) {
      throw new Error('Costs configuration not found');
    }

    const printer = printers[0];
    const filament = filaments[0];
    const costsConfig = costsConfigs[0]; // Use first/latest config

    // Convert numeric fields to numbers
    const printerPowerConsumption = parseFloat(printer.power_consumption);
    const printerProfitPercentage = parseFloat(printer.profit_percentage);
    const filamentCostPerKg = parseFloat(filament.cost_per_kg);
    const electricityCostPerKwh = parseFloat(costsConfig.electricity_cost_per_kwh);
    const rentCostPerMonth = parseFloat(costsConfig.rent_cost_per_month);
    const employeeCostPerMonth = parseFloat(costsConfig.employee_cost_per_month);
    const maintenanceCostPerMonth = parseFloat(costsConfig.maintenance_cost_per_month);
    const wastePercentage = parseFloat(costsConfig.waste_percentage);
    const errorPercentage = parseFloat(costsConfig.error_percentage);

    // 1. Material cost = (material_weight_g / 1000) * filament.cost_per_kg
    const materialCost = (input.material_weight_g / 1000) * filamentCostPerKg;

    // 2. Electricity cost = print_time_hours * (printer.power_consumption / 1000) * electricity_cost_per_kwh
    const electricityCost = input.print_time_hours * (printerPowerConsumption / 1000) * electricityCostPerKwh;

    // 3. Fixed costs = proportional monthly costs based on print time
    // Assume a month has 30 days * 24 hours = 720 hours of potential operation
    const monthlyHours = 30 * 24;
    const totalMonthlyCosts = rentCostPerMonth + employeeCostPerMonth + maintenanceCostPerMonth;
    const fixedCosts = (input.print_time_hours / monthlyHours) * totalMonthlyCosts;

    // 4. Waste cost = material_cost * (waste_percentage / 100)
    const wasteCost = materialCost * (wastePercentage / 100);

    // 5. Error cost = (material_cost + electricity_cost) * (error_percentage / 100)
    const errorCost = (materialCost + electricityCost) * (errorPercentage / 100);

    // 6. Total cost = material_cost + electricity_cost + fixed_costs + waste_cost + error_cost
    const totalCost = materialCost + electricityCost + fixedCosts + wasteCost + errorCost;

    // 7. Profit amount = total_cost * (printer.profit_percentage / 100)
    const profitAmount = totalCost * (printerProfitPercentage / 100);

    // 8. Sale price = total_cost + profit_amount
    const salePrice = totalCost + profitAmount;

    // 9. Calculate per-piece costs and prices
    const costPerPiece = totalCost / input.pieces_quantity;
    const pricePerPiece = salePrice / input.pieces_quantity;

    // Calculate profit margin percentage = (profit_amount / sale_price) * 100
    const profitMarginPercentage = salePrice > 0 ? (profitAmount / salePrice) * 100 : 0;

    return {
      material_cost: materialCost,
      electricity_cost: electricityCost,
      fixed_costs: fixedCosts,
      waste_cost: wasteCost,
      error_cost: errorCost,
      total_cost: totalCost,
      profit_amount: profitAmount,
      sale_price: salePrice,
      profit_margin_percentage: profitMarginPercentage,
      cost_per_piece: costPerPiece,
      price_per_piece: pricePerPiece
    };
  } catch (error) {
    console.error('Budget calculation failed:', error);
    throw error;
  }
};
