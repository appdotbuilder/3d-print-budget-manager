
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import type { Budget, Printer, Filament } from '../../../server/src/schema';

interface BudgetListProps {
  budgets: Budget[];
  printers: Printer[];
  filaments: Filament[];
  onBudgetDeleted: () => void;
  onBudgetListRefresh: (query?: string) => void;
}

export function BudgetList({ budgets, printers, filaments, onBudgetDeleted, onBudgetListRefresh }: BudgetListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Use useCallback for memoizing the search function to be used in useEffect
  const handleSearch = useCallback(() => {
    onBudgetListRefresh(searchQuery);
  }, [onBudgetListRefresh, searchQuery]);

  // Trigger search when searchQuery changes
  useEffect(() => {
    const handler = setTimeout(() => {
      handleSearch();
    }, 300); // Debounce search
    return () => clearTimeout(handler);
  }, [searchQuery, handleSearch]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await trpc.deleteBudget.mutate({ id });
      onBudgetDeleted(); // Notify parent of deletion, parent will re-fetch all budgets
    } catch (error) {
      console.error('Failed to delete budget:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const getPrinterName = (printerId: number) => {
    const printer = printers.find((p: Printer) => p.id === printerId);
    return printer ? printer.name : `Impressora #${printerId}`;
  };

  const getFilamentInfo = (filamentId: number) => {
    const filament = filaments.find((f: Filament) => f.id === filamentId);
    return filament ? `${filament.brand} ${filament.name} - ${filament.color}` : `Filamento #${filamentId}`;
  };

  if (budgets.length === 0 && !searchQuery) {
    return (
      <Card className="border-slate-200">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum orçamento salvo</h3>
          <p className="text-slate-600 mb-4">Use a calculadora para criar seu primeiro orçamento</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Orçamentos Salvos ({budgets.length})
        </h3>
        {/* Search Input */}
        <Input
          type="text"
          placeholder="Buscar orçamentos..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {budgets.length === 0 && searchQuery && (
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum orçamento encontrado</h3>
            <p className="text-slate-600 mb-4">Tente uma busca diferente ou adicione novos orçamentos.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget: Budget) => (
          <Card key={budget.id} className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{budget.name}</CardTitle>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  #{budget.id}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Main Values */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600">Custo Total</p>
                  <p className="font-bold text-slate-900">R$ {budget.total_cost.toFixed(2)}</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <p className="text-xs text-green-600">Preço de Venda</p>
                  <p className="font-bold text-green-700">R$ {budget.sale_price.toFixed(2)}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Lucro:</span>
                  <span className="font-medium text-blue-600">
                    R$ {(budget.sale_price - budget.total_cost).toFixed(2)} ({budget.profit_margin.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Peças:</span>
                  <span className="font-medium">{budget.pieces_quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tempo:</span>
                  <span className="font-medium">{budget.print_time_hours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Material:</span>
                  <span className="font-medium">{budget.material_weight_g}g</span>
                </div>
              </div>

              <Separator />

              {/* Equipment Info */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1">
                  <span>🖨️</span>
                  <span className="text-slate-600">{getPrinterName(budget.printer_id)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🧵</span>
                  <span className="text-slate-600">{getFilamentInfo(budget.filament_id)}</span>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="text-xs text-slate-500">
                  Criado em {budget.created_at.toLocaleDateString('pt-BR')}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      disabled={deletingId === budget.id}
                    >
                      {deletingId === budget.id ? '⏳' : '🗑️'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o orçamento "{budget.name}"? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(budget.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
