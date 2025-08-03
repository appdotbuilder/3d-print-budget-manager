
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { costsConfigTable } from '../db/schema';
import { getCostsConfig } from '../handlers/get_costs_config';

describe('getCostsConfig', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when no configuration exists', async () => {
    const result = await getCostsConfig();
    expect(result).toBeNull();
  });

  it('should return the costs configuration when it exists', async () => {
    // Insert test configuration
    await db.insert(costsConfigTable)
      .values({
        electricity_cost_per_kwh: '0.15',
        rent_cost_per_month: '1500.00',
        employee_cost_per_month: '3000.00',
        maintenance_cost_per_month: '500.00',
        waste_percentage: '5.00',
        error_percentage: '2.50'
      })
      .execute();

    const result = await getCostsConfig();

    expect(result).not.toBeNull();
    expect(result!.electricity_cost_per_kwh).toEqual(0.15);
    expect(result!.rent_cost_per_month).toEqual(1500.00);
    expect(result!.employee_cost_per_month).toEqual(3000.00);
    expect(result!.maintenance_cost_per_month).toEqual(500.00);
    expect(result!.waste_percentage).toEqual(5.00);
    expect(result!.error_percentage).toEqual(2.50);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return the most recent configuration when multiple exist', async () => {
    // Insert first configuration
    await db.insert(costsConfigTable)
      .values({
        electricity_cost_per_kwh: '0.10',
        rent_cost_per_month: '1000.00',
        employee_cost_per_month: '2500.00',
        maintenance_cost_per_month: '300.00',
        waste_percentage: '3.00',
        error_percentage: '1.50'
      })
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second configuration (more recent)
    await db.insert(costsConfigTable)
      .values({
        electricity_cost_per_kwh: '0.20',
        rent_cost_per_month: '2000.00',
        employee_cost_per_month: '3500.00',
        maintenance_cost_per_month: '700.00',
        waste_percentage: '7.00',
        error_percentage: '3.50'
      })
      .execute();

    const result = await getCostsConfig();

    expect(result).not.toBeNull();
    // Should return the more recent configuration
    expect(result!.electricity_cost_per_kwh).toEqual(0.20);
    expect(result!.rent_cost_per_month).toEqual(2000.00);
    expect(result!.employee_cost_per_month).toEqual(3500.00);
    expect(result!.maintenance_cost_per_month).toEqual(700.00);
    expect(result!.waste_percentage).toEqual(7.00);
    expect(result!.error_percentage).toEqual(3.50);
  });

  it('should return numeric types for all cost fields', async () => {
    await db.insert(costsConfigTable)
      .values({
        electricity_cost_per_kwh: '0.1234',
        rent_cost_per_month: '1500.99',
        employee_cost_per_month: '3000.50',
        maintenance_cost_per_month: '500.25',
        waste_percentage: '5.75',
        error_percentage: '2.33'
      })
      .execute();

    const result = await getCostsConfig();

    expect(result).not.toBeNull();
    expect(typeof result!.electricity_cost_per_kwh).toBe('number');
    expect(typeof result!.rent_cost_per_month).toBe('number');
    expect(typeof result!.employee_cost_per_month).toBe('number');
    expect(typeof result!.maintenance_cost_per_month).toBe('number');
    expect(typeof result!.waste_percentage).toBe('number');
    expect(typeof result!.error_percentage).toBe('number');
    
    // Verify precision is maintained
    expect(result!.electricity_cost_per_kwh).toEqual(0.1234);
    expect(result!.rent_cost_per_month).toEqual(1500.99);
    expect(result!.waste_percentage).toEqual(5.75);
    expect(result!.error_percentage).toEqual(2.33);
  });
});
