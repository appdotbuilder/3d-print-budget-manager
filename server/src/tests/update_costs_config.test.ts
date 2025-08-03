
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { costsConfigTable } from '../db/schema';
import { type CostsConfigInput } from '../schema';
import { updateCostsConfig } from '../handlers/update_costs_config';
import { eq } from 'drizzle-orm';

const testInput: CostsConfigInput = {
  electricity_cost_per_kwh: 0.15,
  rent_cost_per_month: 1200.00,
  employee_cost_per_month: 3500.00,
  maintenance_cost_per_month: 200.50,
  waste_percentage: 5.0,
  error_percentage: 2.5
};

describe('updateCostsConfig', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create new config when none exists', async () => {
    const result = await updateCostsConfig(testInput);

    // Basic field validation
    expect(result.electricity_cost_per_kwh).toEqual(0.15);
    expect(result.rent_cost_per_month).toEqual(1200.00);
    expect(result.employee_cost_per_month).toEqual(3500.00);
    expect(result.maintenance_cost_per_month).toEqual(200.50);
    expect(result.waste_percentage).toEqual(5.0);
    expect(result.error_percentage).toEqual(2.5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.electricity_cost_per_kwh).toBe('number');
    expect(typeof result.rent_cost_per_month).toBe('number');
    expect(typeof result.employee_cost_per_month).toBe('number');
    expect(typeof result.maintenance_cost_per_month).toBe('number');
    expect(typeof result.waste_percentage).toBe('number');
    expect(typeof result.error_percentage).toBe('number');
  });

  it('should save new config to database', async () => {
    const result = await updateCostsConfig(testInput);

    const configs = await db.select()
      .from(costsConfigTable)
      .where(eq(costsConfigTable.id, result.id))
      .execute();

    expect(configs).toHaveLength(1);
    expect(parseFloat(configs[0].electricity_cost_per_kwh)).toEqual(0.15);
    expect(parseFloat(configs[0].rent_cost_per_month)).toEqual(1200.00);
    expect(parseFloat(configs[0].employee_cost_per_month)).toEqual(3500.00);
    expect(parseFloat(configs[0].maintenance_cost_per_month)).toEqual(200.50);
    expect(parseFloat(configs[0].waste_percentage)).toEqual(5.0);
    expect(parseFloat(configs[0].error_percentage)).toEqual(2.5);
  });

  it('should update existing config when one exists', async () => {
    // Create initial config
    const initialResult = await updateCostsConfig(testInput);

    // Update with new values
    const updatedInput: CostsConfigInput = {
      electricity_cost_per_kwh: 0.20,
      rent_cost_per_month: 1500.00,
      employee_cost_per_month: 4000.00,
      maintenance_cost_per_month: 300.00,
      waste_percentage: 7.5,
      error_percentage: 3.0
    };

    const result = await updateCostsConfig(updatedInput);

    // Should have same ID as initial config
    expect(result.id).toEqual(initialResult.id);
    
    // Should have updated values
    expect(result.electricity_cost_per_kwh).toEqual(0.20);
    expect(result.rent_cost_per_month).toEqual(1500.00);
    expect(result.employee_cost_per_month).toEqual(4000.00);
    expect(result.maintenance_cost_per_month).toEqual(300.00);
    expect(result.waste_percentage).toEqual(7.5);
    expect(result.error_percentage).toEqual(3.0);

    // Verify only one config exists in database
    const allConfigs = await db.select()
      .from(costsConfigTable)
      .execute();

    expect(allConfigs).toHaveLength(1);
    expect(parseFloat(allConfigs[0].electricity_cost_per_kwh)).toEqual(0.20);
    expect(parseFloat(allConfigs[0].rent_cost_per_month)).toEqual(1500.00);
  });

  it('should handle zero values correctly', async () => {
    const zeroInput: CostsConfigInput = {
      electricity_cost_per_kwh: 0,
      rent_cost_per_month: 0,
      employee_cost_per_month: 0,
      maintenance_cost_per_month: 0,
      waste_percentage: 0,
      error_percentage: 0
    };

    const result = await updateCostsConfig(zeroInput);

    expect(result.electricity_cost_per_kwh).toEqual(0);
    expect(result.rent_cost_per_month).toEqual(0);
    expect(result.employee_cost_per_month).toEqual(0);
    expect(result.maintenance_cost_per_month).toEqual(0);
    expect(result.waste_percentage).toEqual(0);
    expect(result.error_percentage).toEqual(0);
  });

  it('should handle maximum percentage values', async () => {
    const maxInput: CostsConfigInput = {
      electricity_cost_per_kwh: 1.0,
      rent_cost_per_month: 10000.00,
      employee_cost_per_month: 15000.00,
      maintenance_cost_per_month: 5000.00,
      waste_percentage: 100,
      error_percentage: 100
    };

    const result = await updateCostsConfig(maxInput);

    expect(result.waste_percentage).toEqual(100);
    expect(result.error_percentage).toEqual(100);
  });
});
