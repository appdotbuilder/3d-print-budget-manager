
import { z } from 'zod';

// Printer schema
export const printerSchema = z.object({
  id: z.number(),
  name: z.string(),
  power_consumption: z.number(), // watts per hour
  print_speed: z.number(), // mm/s or similar unit
  profit_percentage: z.number(), // percentage (0-100)
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Printer = z.infer<typeof printerSchema>;

// Input schema for creating printers
export const createPrinterInputSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  power_consumption: z.number().positive("Consumo de energia deve ser positivo"),
  print_speed: z.number().positive("Velocidade de impressão deve ser positiva"),
  profit_percentage: z.number().min(0, "Percentual de lucro deve ser não negativo")
});

export type CreatePrinterInput = z.infer<typeof createPrinterInputSchema>;

// Input schema for updating printers
export const updatePrinterInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  power_consumption: z.number().positive().optional(),
  print_speed: z.number().positive().optional(),
  profit_percentage: z.number().min(0).optional()
});

export type UpdatePrinterInput = z.infer<typeof updatePrinterInputSchema>;

// Filament schema
export const filamentSchema = z.object({
  id: z.number(),
  name: z.string(),
  brand: z.string(),
  material_type: z.string(), // PLA, ABS, PETG, etc.
  color: z.string(),
  cost_per_kg: z.number(), // cost per kilogram
  density: z.number(), // g/cm³
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Filament = z.infer<typeof filamentSchema>;

// Input schema for creating filaments
export const createFilamentInputSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  brand: z.string().min(1, "Marca é obrigatória"),
  material_type: z.string().min(1, "Tipo de material é obrigatório"),
  color: z.string().min(1, "Cor é obrigatória"),
  cost_per_kg: z.number().positive("Custo por kg deve ser positivo"),
  density: z.number().positive("Densidade deve ser positiva")
});

export type CreateFilamentInput = z.infer<typeof createFilamentInputSchema>;

// Input schema for updating filaments
export const updateFilamentInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  material_type: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  cost_per_kg: z.number().positive().optional(),
  density: z.number().positive().optional()
});

export type UpdateFilamentInput = z.infer<typeof updateFilamentInputSchema>;

// Fixed and variable costs schema
export const costsConfigSchema = z.object({
  id: z.number(),
  electricity_cost_per_kwh: z.number(), // cost per kWh
  rent_cost_per_month: z.number(),
  employee_cost_per_month: z.number(),
  maintenance_cost_per_month: z.number(),
  waste_percentage: z.number(), // percentage of material waste
  error_percentage: z.number(), // percentage for printing errors
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CostsConfig = z.infer<typeof costsConfigSchema>;

// Input schema for creating/updating costs configuration
export const costsConfigInputSchema = z.object({
  electricity_cost_per_kwh: z.number().nonnegative("Custo de energia deve ser não negativo"),
  rent_cost_per_month: z.number().nonnegative("Custo de aluguel deve ser não negativo"),
  employee_cost_per_month: z.number().nonnegative("Custo de funcionários deve ser não negativo"),
  maintenance_cost_per_month: z.number().nonnegative("Custo de manutenção deve ser não negativo"),
  waste_percentage: z.number().min(0).max(100, "Percentual de desperdício deve estar entre 0 e 100"),
  error_percentage: z.number().min(0).max(100, "Percentual de erros deve estar entre 0 e 100")
});

export type CostsConfigInput = z.infer<typeof costsConfigInputSchema>;

// Budget/Quote schema
export const budgetSchema = z.object({
  id: z.number(),
  name: z.string(),
  printer_id: z.number(),
  filament_id: z.number(),
  print_time_hours: z.number(), // hours
  material_weight_g: z.number(), // grams
  pieces_quantity: z.number().int(),
  total_cost: z.number(),
  sale_price: z.number(),
  profit_margin: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Budget = z.infer<typeof budgetSchema>;

// Input schema for creating budgets
export const createBudgetInputSchema = z.object({
  name: z.string().min(1, "Nome do orçamento é obrigatório"),
  printer_id: z.number().positive("Impressora deve ser selecionada"),
  filament_id: z.number().positive("Filamento deve ser selecionado"),
  print_time_hours: z.number().positive("Tempo de impressão deve ser positivo"),
  material_weight_g: z.number().positive("Peso do material deve ser positivo"),
  pieces_quantity: z.number().int().positive("Quantidade de peças deve ser positiva")
});

export type CreateBudgetInput = z.infer<typeof createBudgetInputSchema>;

// Budget calculation result schema
export const budgetCalculationSchema = z.object({
  material_cost: z.number(),
  electricity_cost: z.number(),
  fixed_costs: z.number(),
  waste_cost: z.number(),
  error_cost: z.number(),
  total_cost: z.number(),
  profit_amount: z.number(),
  sale_price: z.number(),
  profit_margin_percentage: z.number(),
  cost_per_piece: z.number(),
  price_per_piece: z.number()
});

export type BudgetCalculation = z.infer<typeof budgetCalculationSchema>;

// Budget with related data schema (for detailed views)
export const budgetWithDetailsSchema = budgetSchema.extend({
  printer: printerSchema,
  filament: filamentSchema,
  calculation: budgetCalculationSchema
});

export type BudgetWithDetails = z.infer<typeof budgetWithDetailsSchema>;

// Input schema for fetching multiple budgets with search/filters
export const getBudgetsInputSchema = z.object({
  query: z.string().optional(), // Optional search query
}).default({});

export type GetBudgetsInput = z.infer<typeof getBudgetsInputSchema>;
