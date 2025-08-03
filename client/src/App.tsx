
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { PrinterManagement } from '@/components/PrinterManagement';
import { FilamentManagement } from '@/components/FilamentManagement';
import { CostsConfiguration } from '@/components/CostsConfiguration';
import { BudgetCalculator } from '@/components/BudgetCalculator';
import { BudgetList } from '@/components/BudgetList';
import type { Printer, Filament, Budget, CostsConfig } from '../../server/src/schema';

function App() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [costsConfig, setCostsConfig] = useState<CostsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [printersData, filamentsData, budgetsData, costsData] = await Promise.all([
        trpc.getPrinters.query(),
        trpc.getFilaments.query(),
        trpc.getBudgets.query(),
        trpc.getCostsConfig.query()
      ]);
      
      setPrinters(printersData);
      setFilaments(filamentsData);
      setBudgets(budgetsData);
      setCostsConfig(costsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshPrinters = useCallback(async () => {
    const data = await trpc.getPrinters.query();
    setPrinters(data);
  }, []);

  const refreshFilaments = useCallback(async () => {
    const data = await trpc.getFilaments.query();
    setFilaments(data);
  }, []);

  const refreshBudgets = useCallback(async () => {
    const data = await trpc.getBudgets.query();
    setBudgets(data);
  }, []);

  const refreshCosts = useCallback(async () => {
    const data = await trpc.getCostsConfig.query();
    setCostsConfig(data);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🖨️</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">PrintBudget Pro</h1>
              <p className="text-slate-600">Gerenciamento inteligente de orçamentos para impressão 3D</p>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">🖨️</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{printers.length}</p>
                    <p className="text-xs text-slate-600">Impressoras</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-sm">🧵</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{filaments.length}</p>
                    <p className="text-xs text-slate-600">Filamentos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-sm">📊</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{budgets.length}</p>
                    <p className="text-xs text-slate-600">Orçamentos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-sm">⚙️</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {costsConfig ? '✓' : '!'}
                    </p>
                    <p className="text-xs text-slate-600">Configuração</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/60 backdrop-blur-sm">
            <TabsTrigger value="calculator" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              📊 Calculadora
            </TabsTrigger>
            <TabsTrigger value="budgets" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              📋 Orçamentos
            </TabsTrigger>
            <TabsTrigger value="printers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              🖨️ Impressoras
            </TabsTrigger>
            <TabsTrigger value="filaments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              🧵 Filamentos
            </TabsTrigger>
            <TabsTrigger value="costs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              ⚙️ Custos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-blue-600">📊</span>
                  Calculadora de Orçamentos
                </CardTitle>
                <CardDescription>
                  Calcule custos e preços para seus projetos de impressão 3D
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BudgetCalculator 
                  printers={printers}
                  filaments={filaments}
                  costsConfig={costsConfig}
                  onBudgetCreated={refreshBudgets}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-green-600">📋</span>
                  Orçamentos Salvos
                </CardTitle>
                <CardDescription>
                  Gerencie seus orçamentos e propostas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BudgetList 
                  budgets={budgets}
                  printers={printers}
                  filaments={filaments}
                  onBudgetDeleted={refreshBudgets}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="printers" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-purple-600">🖨️</span>
                  Gerenciar Impressoras
                </CardTitle>
                <CardDescription>
                  Configure suas impressoras 3D e seus parâmetros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PrinterManagement 
                  printers={printers}
                  onPrinterChanged={refreshPrinters}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filaments" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-orange-600">🧵</span>
                  Gerenciar Filamentos
                </CardTitle>
                <CardDescription>
                  Cadastre e gerencie seus materiais de impressão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FilamentManagement 
                  filaments={filaments}
                  onFilamentChanged={refreshFilaments}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-red-600">⚙️</span>
                  Configuração de Custos
                </CardTitle>
                <CardDescription>
                  Configure custos fixos e variáveis do negócio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CostsConfiguration 
                  costsConfig={costsConfig}
                  onCostsChanged={refreshCosts}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
