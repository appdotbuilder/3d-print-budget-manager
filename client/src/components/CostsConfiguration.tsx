
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { CostsConfig, CostsConfigInput } from '../../../server/src/schema';

interface CostsConfigurationProps {
  costsConfig: CostsConfig | null;
  onCostsChanged: () => void;
}

export function CostsConfiguration({ costsConfig, onCostsChanged }: CostsConfigurationProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<CostsConfigInput>({
    electricity_cost_per_kwh: 0,
    rent_cost_per_month: 0,
    employee_cost_per_month: 0,
    maintenance_cost_per_month: 0,
    waste_percentage: 0,
    error_percentage: 0
  });

  useEffect(() => {
    if (costsConfig) {
      setFormData({
        electricity_cost_per_kwh: costsConfig.electricity_cost_per_kwh,
        rent_cost_per_month: costsConfig.rent_cost_per_month,
        employee_cost_per_month: costsConfig.employee_cost_per_month,
        maintenance_cost_per_month: costsConfig.maintenance_cost_per_month,
        waste_percentage: costsConfig.waste_percentage,
        error_percentage: costsConfig.error_percentage
      });
    }
  }, [costsConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await trpc.updateCostsConfig.mutate(formData);
      onCostsChanged();
    } catch (error) {
      console.error('Failed to update costs config:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const totalMonthlyCosts = formData.rent_cost_per_month + formData.employee_cost_per_month + formData.maintenance_cost_per_month;

  return (
    <div className="space-y-6">
      {!costsConfig && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertDescription className="text-orange-800">
            ⚠️ Configure os custos para poder criar orçamentos precisos
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Energy Costs */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              ⚡ Custos de Energia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="electricity">Custo da Energia Elétrica (R$/kWh)</Label>
                <Input
                  id="electricity"
                  type="number"
                  value={formData.electricity_cost_per_kwh}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CostsConfigInput) => ({ 
                      ...prev, 
                      electricity_cost_per_kwh: parseFloat(e.target.value) || 0 
                    }))
                  }
                  placeholder="Ex: 0.65"
                  min="0"
                  step="0.01"
                  required
                />
                <p className="text-sm text-slate-600">
                  Consulte sua conta de luz para obter o valor por kWh
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fixed Monthly Costs */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              🏢 Custos Fixos Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent">Aluguel (R$/mês)</Label>
                <Input
                  id="rent"
                  type="number"
                  value={formData.rent_cost_per_month}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CostsConfigInput) => ({ 
                      ...prev, 
                      rent_cost_per_month: parseFloat(e.target.value) || 0 
                    }))
                  }
                  placeholder="Ex: 1500.00"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employee">Funcionários (R$/mês)</Label>
                <Input
                  id="employee"
                  type="number"
                  value={formData.employee_cost_per_month}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CostsConfigInput) => ({ 
                      ...prev, 
                      employee_cost_per_month: parseFloat(e.target.value) || 0 
                    }))
                  }
                  placeholder="Ex: 3000.00"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maintenance">Manutenção (R$/mês)</Label>
                <Input
                  id="maintenance"
                  type="number"
                  value={formData.maintenance_cost_per_month}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CostsConfigInput) => ({ 
                      ...prev, 
                      maintenance_cost_per_month: parseFloat(e.target.value) || 0 
                    }))
                  }
                  placeholder="Ex: 500.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">Total de Custos Fixos Mensais:</p>
              <p className="text-2xl font-bold text-slate-900">
                R$ {totalMonthlyCosts.toFixed(2)}/mês
              </p>
              <p className="text-sm text-slate-600 mt-1">
                ≈ R$ {(totalMonthlyCosts / 30 / 24).toFixed(4)}/hora
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Variable Costs */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              📊 Custos Variáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="waste">Percentual de Desperdício (%)</Label>
                <Input
                  id="waste"
                  type="number"
                  value={formData.waste_percentage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CostsConfigInput) => ({ 
                      ...prev, 
                      waste_percentage: parseFloat(e.target.value) || 0 
                    }))
                  }
                  placeholder="Ex: 5"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-sm text-slate-600">
                  Material perdido em suportes, limpezas, etc.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="error">Percentual de Erros (%)</Label>
                <Input
                  id="error"
                  type="number"
                  value={formData.error_percentage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CostsConfigInput) => ({ 
                      ...prev, 
                      error_percentage: parseFloat(e.target.value) || 0 
                    }))
                  }
                  placeholder="Ex: 3"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-sm text-slate-600">
                  Impressões que falharam e precisaram ser refeitas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {costsConfig && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                ✅ Configuração Atual
            </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-green-600 font-medium">Energia</p>
                  <p className="text-green-800">R$ {costsConfig.electricity_cost_per_kwh.toFixed(4)}/kWh</p>
                </div>
                <div>
                  <p className="text-green-600 font-medium">Custos Fixos</p>
                  <p className="text-green-800">R$ {(costsConfig.rent_cost_per_month + costsConfig.employee_cost_per_month + costsConfig.maintenance_cost_per_month).toFixed(2)}/mês</p>
                </div>
                <div>
                  <p className="text-green-600 font-medium">Desperdício</p>
                  <p className="text-green-800">{costsConfig.waste_percentage}%</p>
                </div>
                <div>
                  <p className="text-green-600 font-medium">Erros</p>
                  <p className="text-green-800">{costsConfig.error_percentage}%</p>
                </div>
              </div>
              <p className="text-xs text-green-700 mt-3">
                Última atualização: {costsConfig.updated_at.toLocaleDateString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isUpdating} className="bg-orange-600 hover:bg-orange-700">
            {isUpdating ? 'Salvando...' : costsConfig ? '💾 Atualizar Configuração' : '💾 Salvar Configuração'}
          </Button>
        </div>
      </form>
    </div>
  );
}
