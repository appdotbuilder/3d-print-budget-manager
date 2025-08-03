
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Printer, CreatePrinterInput } from '../../../server/src/schema';

interface PrinterManagementProps {
  printers: Printer[];
  onPrinterChanged: () => void;
}

export function PrinterManagement({ printers, onPrinterChanged }: PrinterManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [formData, setFormData] = useState<CreatePrinterInput>({
    name: '',
    power_consumption: 0,
    print_speed: 0,
    profit_percentage: 0
  });

  const resetForm = () => {
    setFormData({
      name: '',
      power_consumption: 0,
      print_speed: 0,
      profit_percentage: 0
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await trpc.createPrinter.mutate(formData);
      resetForm();
      onPrinterChanged();
    } catch (error) {
      console.error('Failed to create printer:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrinter) return;
    
    setIsCreating(true);
    try {
      await trpc.updatePrinter.mutate({
        id: editingPrinter.id,
        ...formData
      });
      setEditingPrinter(null);
      resetForm();
      onPrinterChanged();
    } catch (error) {
      console.error('Failed to update printer:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deletePrinter.mutate({ id });
      onPrinterChanged();
    } catch (error) {
      console.error('Failed to delete printer:', error);
    }
  };

  const openEditDialog = (printer: Printer) => {
    setEditingPrinter(printer);
    setFormData({
      name: printer.name,
      power_consumption: printer.power_consumption,
      print_speed: printer.print_speed,
      profit_percentage: printer.profit_percentage
    });
  };

  return (
    <div className="space-y-6">
      {/* Create New Printer Form */}
      <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
        <CardHeader>
          <CardTitle className="text-lg">➕ Nova Impressora</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Impressora</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePrinterInput) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Ender 3 Pro"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="power">Consumo de Energia (W)</Label>
              <Input
                id="power"
                type="number"
                value={formData.power_consumption}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePrinterInput) => ({ ...prev, power_consumption: parseFloat(e.target.value) || 0 }))
                }
                placeholder="Ex: 220"
                min="0"
                step="0.1"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="speed">Velocidade de Impressão (mm/s)</Label>
              <Input
                id="speed"
                type="number"
                value={formData.print_speed}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePrinterInput) => ({ ...prev, print_speed: parseFloat(e.target.value) || 0 }))
                }
                placeholder="Ex: 50"
                min="0"
                step="0.1"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profit">Margem de Lucro (%)</Label>
              <Input
                id="profit"
                type="number"
                value={formData.profit_percentage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePrinterInput) => ({ ...prev, profit_percentage: parseFloat(e.target.value) || 0 }))
                }
                placeholder="Ex: 30"
                min="0"
                max="100"
                step="0.1"
                required
              />
            </div>
            
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={isCreating} className="bg-blue-600 hover:bg-blue-700">
                {isCreating ? 'Criando...' : '✓ Criar Impressora'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                🗑️ Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Printers List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Impressoras Cadastradas ({printers.length})
        </h3>
        
        {printers.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🖨️</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma impressora cadastrada</h3>
              <p className="text-slate-600 mb-4">Comece criando sua primeira impressora 3D</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {printers.map((printer: Printer) => (
              <Card key={printer.id} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{printer.name}</CardTitle>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      #{printer.id}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-600">Consumo</p>
                      <p className="font-medium">{printer.power_consumption}W</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Velocidade</p>
                      <p className="font-medium">{printer.print_speed}mm/s</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Margem de Lucro</p>
                      <p className="font-bold text-green-600">{printer.profit_percentage}%</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(printer)}
                          >
                            ✏️
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Impressora</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Nome</Label>
                                <Input
                                  id="edit-name"
                                  value={formData.name}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData((prev: CreatePrinterInput) => ({ ...prev, name: e.target.value }))
                                  }
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="edit-power">Consumo (W)</Label>
                                <Input
                                  id="edit-power"
                                  type="number"
                                  value={formData.power_consumption}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData((prev: CreatePrinterInput) => ({ ...prev, power_consumption: parseFloat(e.target.value) || 0 }))
                                  }
                                  min="0"
                                  step="0.1"
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="edit-speed">Velocidade (mm/s)</Label>
                                <Input
                                  id="edit-speed"
                                  type="number"
                                  value={formData.print_speed}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData((prev: CreatePrinterInput) => ({ ...prev, print_speed: parseFloat(e.target.value) || 0 }))
                                  }
                                  min="0"
                                  step="0.1"
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="edit-profit">Margem (%)</Label>
                                <Input
                                  id="edit-profit"
                                  type="number"
                                  value={formData.profit_percentage}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData((prev: CreatePrinterInput) => ({ ...prev, profit_percentage: parseFloat(e.target.value) || 0 }))
                                  }
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  required
                                />
                              </div>
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button type="submit" disabled={isCreating}>
                                {isCreating ? 'Salvando...' : 'Salvar'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            🗑️
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Impressora</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a impressora "{printer.name}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(printer.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-500">
                    Criada em {printer.created_at.toLocaleDateString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
