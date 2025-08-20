
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Filament, CreateFilamentInput } from '../../../server/src/schema';

interface FilamentManagementProps {
  filaments: Filament[];
  onFilamentListRefresh: (query?: string) => void;
}

export function FilamentManagement({ filaments, onFilamentListRefresh }: FilamentManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingFilament, setEditingFilament] = useState<Filament | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<CreateFilamentInput>({
    name: '',
    brand: '',
    material_type: '',
    color: '',
    cost_per_kg: 0,
    density: 0
  });

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      material_type: '',
      color: '',
      cost_per_kg: 0,
      density: 0
    });
  };

  // Use useCallback for memoizing the search function to be used in useEffect
  const handleSearch = useCallback(() => {
    onFilamentListRefresh(searchQuery);
  }, [onFilamentListRefresh, searchQuery]);

  // Trigger search when searchQuery changes with a debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      handleSearch();
    }, 300); // Debounce search

    return () => clearTimeout(handler);
  }, [searchQuery, handleSearch]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await trpc.createFilament.mutate(formData);
      resetForm();
      onFilamentListRefresh(searchQuery);
    } catch (error) {
      console.error('Failed to create filament:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFilament) return;
    
    setIsCreating(true);
    try {
      await trpc.updateFilament.mutate({
        id: editingFilament.id,
        ...formData
      });
      setEditingFilament(null);
      resetForm();
      onFilamentListRefresh(searchQuery);
    } catch (error) {
      console.error('Failed to update filament:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteFilament.mutate({ id });
      onFilamentListRefresh(searchQuery);
    } catch (error) {
      console.error('Failed to delete filament:', error);
    }
  };

  const openEditDialog = (filament: Filament) => {
    setEditingFilament(filament);
    setFormData({
      name: filament.name,
      brand: filament.brand,
      material_type: filament.material_type,
      color: filament.color,
      cost_per_kg: filament.cost_per_kg,
      density: filament.density
    });
  };

  const getColorDot = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'branco': 'bg-white border-2 border-slate-300',
      'preto': 'bg-black',
      'vermelho': 'bg-red-500',
      'azul': 'bg-blue-500',
      'verde': 'bg-green-500',
      'amarelo': 'bg-yellow-500',
      'laranja': 'bg-orange-500',
      'roxo': 'bg-purple-500',
      'rosa': 'bg-pink-500',
      'cinza': 'bg-gray-500',
      'transparente': 'bg-gradient-to-r from-transparent to-slate-200 border-2 border-slate-300'
    };
    
    return colorMap[color.toLowerCase()] || 'bg-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Create New Filament Form */}
      <Card className="border-dashe border-2 border-slate-200 bg-slate-50/50">
        <CardHeader>
          <CardTitle className="text-lg">➕ Novo Filamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Filamento</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateFilamentInput) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: PLA Premium"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateFilamentInput) => ({ ...prev, brand: e.target.value }))
                }
                placeholder="Ex: Prusament"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="material">Tipo de Material</Label>
              <Input
                id="material"
                value={formData.material_type}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateFilamentInput) => ({ ...prev, material_type: e.target.value }))
                }
                placeholder="Ex: PLA, ABS, PETG"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateFilamentInput) => ({ ...prev, color: e.target.value }))
                }
                placeholder="Ex: Branco, Preto, Azul"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cost">Custo por Kg (R$)</Label>
              <Input
                id="cost"
                type="number"
                value={formData.cost_per_kg}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateFilamentInput) => ({ ...prev, cost_per_kg: parseFloat(e.target.value) || 0 }))
                }
                placeholder="Ex: 85.50"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="density">Densidade (g/cm³)</Label>
              <Input
                id="density"
                type="number"
                value={formData.density}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateFilamentInput) => ({ ...prev, density: parseFloat(e.target.value) || 0 }))
                }
                placeholder="Ex: 1.24"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit" disabled={isCreating} className="bg-green-600 hover:bg-green-700">
                {isCreating ? 'Criando...' : '✓ Criar Filamento'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                🗑️ Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filaments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Filamentos Cadastrados ({filaments.length})
          </h3>
          {/* Search Input */}
          <Input
            type="text"
            placeholder="Buscar filamentos..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
        
        {filaments.length === 0 && !searchQuery ? (
          <Card className="border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🧵</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum filamento cadastrado</h3>
              <p className="text-slate-600 mb-4">Adicione seus primeiros materiais de impressão</p>
            </CardContent>
          </Card>
        ) : filaments.length === 0 && searchQuery ? (
          <Card className="border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum filamento encontrado</h3>
              <p className="text-slate-600 mb-4">Tente uma busca diferente ou adicione novos filamentos.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filaments.map((filament: Filament) => (
              <Card key={filament.id} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{filament.name}</CardTitle>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      #{filament.id}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${getColorDot(filament.color)}`}></div>
                    <span className="text-sm font-medium">{filament.color}</span>
                    <Badge variant="outline" className="text-xs">
                      {filament.material_type}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-slate-600">
                    <p><strong>Marca:</strong> {filament.brand}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-600">Custo/Kg</p>
                      <p className="font-bold text-green-600">R$ {filament.cost_per_kg.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Densidade</p>
                      <p className="font-medium">{filament.density} g/cm³</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                      Criado em {filament.created_at.toLocaleDateString('pt-BR')}
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(filament)}
                          >
                            ✏️
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Filamento</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Nome</Label>
                                <Input
                                  id="edit-name"
                                  value={formData.name}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData((prev: CreateFilamentInput) => ({ ...prev, name: e.target.value }))
                                  }
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="edit-brand">Marca</Label>
                                <Input
                                  id="edit-brand"
                                  value={formData.brand}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData((prev: CreateFilamentInput) => ({ ...prev, brand: e.target.value }))
                                  }
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="edit-material">Material</Label>
                                <Input
                                  id="edit-material"
                                  value={formData.material_type}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData((prev: CreateFilamentInput) => ({ ...prev, material_type: e.target.value }))
                                  }
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="edit-color">Cor</Label>
                                <Input
                                  id="edit-color"
                                  value={formData.color}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData((prev: CreateFilamentInput) => ({ ...prev, color: e.target.value }))
                                  }
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="edit-cost">Custo/Kg (R$)</Label>
                                <Input
                                  id="edit-cost"
                                  type="number"
                                  value={formData.cost_per_kg}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData((prev: CreateFilamentInput) => ({ ...prev, cost_per_kg: parseFloat(e.target.value) || 0 }))
                                  }
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="edit-density">Densidade (g/cm³)</Label>
                                <Input
                                  id="edit-density"
                                  type="number"
                                  value={formData.density}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData((prev: CreateFilamentInput) => ({ ...prev, density: parseFloat(e.target.value) || 0 }))
                                  }
                                  min="0"
                                  step="0.01"
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
                            <AlertDialogTitle>Excluir Filamento</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o filamento "{filament.name}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(filament.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
