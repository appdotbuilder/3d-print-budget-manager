
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Printer, Filament, CostsConfig, CreateBudgetInput, BudgetCalculation } from '../../../server/src/schema';

interface BudgetCalculatorProps {
  printers: Printer[];
  filaments: Filament[];
  costsConfig: CostsConfig | null;
  onBudgetCreated: () => void;
}

export function BudgetCalculator({ printers, filaments, costsConfig, onBudgetCreated }: BudgetCalculatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [calculation, setCalculation] = useState<BudgetCalculation | null>(null);
  
  const [formData, setFormData] = useState<CreateBudgetInput>({
    name: '',
    printer_id: 0,
    filament_id: 0,
    print_time_hours: 0,
    material_weight_g: 0,
    pieces_quantity: 1
  });

  const resetForm = () => {
    setFormData({
      name: '',
      printer_id: 0,
      filament_id: 0,
      print_time_hours: 0,
      material_weight_g: 0,
      pieces_quantity: 1
    });
    setCalculation(null);
  };

  const canCalculate = formData.printer_id > 0 && 
                      formData.filament_id > 0 && 
                      formData.print_time_hours > 0 && 
                      formData.material_weight_g > 0 && 
                      formData.pieces_quantity > 0 &&
                      costsConfig;

  const handleCalculate = async () => {
    if (!canCalculate) return;
    
    setIsCalculating(true);
    try {
      const result = await trpc.calculateBudget.query(formData);
      setCalculation(result);
    } catch (error) {
      console.error('Failed to calculate budget:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Por favor, insira um nome para o orçamento');
      return;
    }
    
    setIsSaving(true);
    try {
      await trpc.createBudget.mutate(formData);
      resetForm();
      onBudgetCreated();
      alert('Orçamento salvo com sucesso!');
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert('Erro ao salvar orçamento');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPrinter = printers.find((p: Printer) => p.id === formData.printer_id);
  const selectedFilament = filaments.find((f: Filament) => f.id === formData.filament_id);

  if (!costsConfig) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertDescription className="text-orange-800">
          ⚠️ É necessário configurar os custos antes de criar orçamentos. 
          Vá para a aba "Custos" para fazer a configuração.
        </AlertDescription>
      </Alert>
    );
  }

  if (printers.length === 0 || filaments.length === 0) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-800">
          ℹ️ É necessário cadastrar pelo menos uma impressora e um filamento antes de criar orçamentos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">📝 Dados do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget-name">Nome do Orçamento</Label>
              <Input
                id="budget-name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateBudgetInput) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Peça Especial Cliente A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="printer">Impressora</Label>
              <Select
                value={formData.printer_id.toString()}
                onValueChange={(value: string) =>
                  setFormData((prev: CreateBudgetInput) => ({ ...prev, printer_id: parseInt(value) || 0 }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma impressora" />
                </SelectTrigger>
                <SelectContent>
                  {printers.map((printer: Printer) => (
                    <SelectItem key={printer.id} value={printer.id.toString()}>
                      {printer.name} ({printer.power_consumption}W, {printer.profit_percentage}% lucro)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filament">Filamento</Label>
              <Select
                value={formData.filament_id.toString()}
                onValueChange={(value: string) =>
                  setFormData((prev: CreateBudgetInput) => ({ ...prev, filament_id: parseInt(value) || 0 }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um filamento" />
                </SelectTrigger>
                <SelectContent>
                  {filaments.map((filament: Filament) => (
                    <SelectItem key={filament.id} value={filament.id.toString()}>
                      {filament.brand} {filament.name} - {filament.color} (R$ {filament.cost_per_kg.toFixed(2)}/kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">🔢 Parâmetros de Impressão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="print-time">Tempo de Impressão (horas)</Label>
              <Input
                id="print-time"
                type="number"
                value={formData.print_time_hours}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateBudgetInput) => ({ ...prev, print_time_hours: parseFloat(e.target.value) || 0 }))
                }
                placeholder="Ex: 2.5"
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material-weight">Peso do Material (gramas)</Label>
              <Input
                id="material-weight"
                type="number"
                value={formData.material_weight_g}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateBudgetInput) => ({ ...prev, material_weight_g: parseFloat(e.target.value) || 0 }))
                }
                placeholder="Ex: 25.5"
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pieces">Quantidade de Peças</Label>
              <Input
                id="pieces"
                type="number"
                value={formData.pieces_quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateBudgetInput) => ({ ...prev, pieces_quantity: parseInt(e.target.value) || 1 }))
                }
                placeholder="Ex: 10"
                min="1"
                step="1"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleCalculate} 
                disabled={!canCalculate || isCalculating}
                className="bg-blue-600 hover:bg-blue-700 flex-1"
              >
                {isCalculating ? 'Calculando...' : '🧮 Calcular Orçamento'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                🗑️
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {calculation && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-green-800">
              💰 Resultado do Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">🎯 Valores Totais do Projeto</h3>
              <p className="text-sm text-slate-600">Valores calculados para {formData.pieces_quantity} peça{formData.pieces_quantity !== 1 ? 's' : ''}</p>
            </div>
            
            {/* Summary - Total Values */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-sm text-slate-600">Custo Total ({formData.pieces_quantity} peças)</p>
                <p className="text-xl font-bold text-slate-900">R$ {calculation.total_cost.toFixed(2)}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-sm text-slate-600">Preço de Venda Total</p>
                <p className="text-xl font-bold text-green-600">R$ {calculation.sale_price.toFixed(2)}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-sm text-slate-600">Lucro Total</p>
                <p className="text-xl font-bold text-blue-600">R$ {calculation.profit_amount.toFixed(2)}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-sm text-slate-600">Margem de Lucro</p>
                <p className="text-xl font-bold text-purple-600">{calculation.profit_margin_percentage.toFixed(1)}%</p>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedPrinter ? `(Markup: ${selectedPrinter.profit_percentage}%)` : ''}
                </p>
              </div>
            </div>

            <Separator />

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-green-800">💸 Breakdown de Custos</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Material:</span>
                    <span>R$ {calculation.material_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Energia:</span>
                    <span>R$ {calculation.electricity_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custos Fixos:</span>
                    <span>R$ {calculation.fixed_costs.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desperdício:</span>
                    <span>R$ {calculation.waste_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Erros:</span>
                    <span>R$ {calculation.error_cost.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>R$ {calculation.total_cost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-green-800">📊 Valores por Peça</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Custo unitário:</span>
                    <span>R$ {calculation.cost_per_piece.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Preço unitário:</span>
                    <span>R$ {calculation.price_per_piece.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lucro unitário:</span>
                    <span>R$ {(calculation.profit_amount / formData.pieces_quantity).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-xs text-slate-600">Quantidade Total</p>
                    <p className="text-lg font-bold">{formData.pieces_quantity} peças</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Items Info */}
            <Separator />
            <div className="space-y-2">
              <div className="flex gap-4 text-sm">
                {selectedPrinter && (
                  <Badge variant="outline" className="bg-blue-50">
                    🖨️ {selectedPrinter.name}
                  </Badge>
                )}
                {selectedFilament && (
                  <Badge variant="outline" className="bg-green-50">
                    🧵 {selectedFilament.brand} {selectedFilament.name}
                  </Badge>
                )}
                <Badge variant="outline" className="bg-orange-50">
                  ⏱️ {formData.print_time_hours}h
                </Badge>
                <Badge variant="outline" className="bg-purple-50">
                  ⚖️ {formData.material_weight_g}g
                </Badge>
              </div>
              
              {selectedPrinter && selectedPrinter.profit_percentage === 100 && (
                <div className="text-xs text-slate-600 bg-blue-50 p-2 rounded">
                  💡 <strong>Dica:</strong> Markup de 100% resulta em margem de lucro de 50% 
                  (lucro sobre preço de venda). Para diferentes margens, ajuste o percentual de lucro da impressora.
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !formData.name.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? 'Salvando...' : '💾 Salvar Orçamento'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
