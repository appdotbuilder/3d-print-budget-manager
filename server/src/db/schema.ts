
import { serial, text, pgTable, timestamp, numeric, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const printersTable = pgTable('printers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  power_consumption: numeric('power_consumption', { precision: 10, scale: 2 }).notNull(), // watts per hour
  print_speed: numeric('print_speed', { precision: 10, scale: 2 }).notNull(), // mm/s or similar unit
  profit_percentage: numeric('profit_percentage', { precision: 5, scale: 2 }).notNull(), // percentage (0-100)
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const filamentsTable = pgTable('filaments', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  material_type: text('material_type').notNull(), // PLA, ABS, PETG, etc.
  color: text('color').notNull(),
  cost_per_kg: numeric('cost_per_kg', { precision: 10, scale: 2 }).notNull(), // cost per kilogram
  density: numeric('density', { precision: 5, scale: 3 }).notNull(), // g/cm³
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const costsConfigTable = pgTable('costs_config', {
  id: serial('id').primaryKey(),
  electricity_cost_per_kwh: numeric('electricity_cost_per_kwh', { precision: 10, scale: 4 }).notNull(), // cost per kWh
  rent_cost_per_month: numeric('rent_cost_per_month', { precision: 10, scale: 2 }).notNull(),
  employee_cost_per_month: numeric('employee_cost_per_month', { precision: 10, scale: 2 }).notNull(),
  maintenance_cost_per_month: numeric('maintenance_cost_per_month', { precision: 10, scale: 2 }).notNull(),
  waste_percentage: numeric('waste_percentage', { precision: 5, scale: 2 }).notNull(), // percentage of material waste
  error_percentage: numeric('error_percentage', { precision: 5, scale: 2 }).notNull(), // percentage for printing errors
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const budgetsTable = pgTable('budgets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  printer_id: integer('printer_id').notNull().references(() => printersTable.id),
  filament_id: integer('filament_id').notNull().references(() => filamentsTable.id),
  print_time_hours: numeric('print_time_hours', { precision: 10, scale: 2 }).notNull(), // hours
  material_weight_g: numeric('material_weight_g', { precision: 10, scale: 2 }).notNull(), // grams
  pieces_quantity: integer('pieces_quantity').notNull(),
  total_cost: numeric('total_cost', { precision: 10, scale: 2 }).notNull(),
  sale_price: numeric('sale_price', { precision: 10, scale: 2 }).notNull(),
  profit_margin: numeric('profit_margin', { precision: 5, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const printersRelations = relations(printersTable, ({ many }) => ({
  budgets: many(budgetsTable),
}));

export const filamentsRelations = relations(filamentsTable, ({ many }) => ({
  budgets: many(budgetsTable),
}));

export const budgetsRelations = relations(budgetsTable, ({ one }) => ({
  printer: one(printersTable, {
    fields: [budgetsTable.printer_id],
    references: [printersTable.id],
  }),
  filament: one(filamentsTable, {
    fields: [budgetsTable.filament_id],
    references: [filamentsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Printer = typeof printersTable.$inferSelect;
export type NewPrinter = typeof printersTable.$inferInsert;

export type Filament = typeof filamentsTable.$inferSelect;
export type NewFilament = typeof filamentsTable.$inferInsert;

export type CostsConfig = typeof costsConfigTable.$inferSelect;
export type NewCostsConfig = typeof costsConfigTable.$inferInsert;

export type Budget = typeof budgetsTable.$inferSelect;
export type NewBudget = typeof budgetsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  printers: printersTable, 
  filaments: filamentsTable, 
  costsConfig: costsConfigTable, 
  budgets: budgetsTable 
};
