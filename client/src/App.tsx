
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, ClipboardList, Printer as PrinterIcon, Package, Settings } from 'lucide-react';
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
        trpc.getFilaments.query({}),
        trpc.getBudgets.query({}),
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

  const refreshFilaments = useCallback(async (query?: string) => {
    const data = await trpc.getFilaments.query({ query });
    setFilaments(data);
  }, []);

  // Updated to accept an optional search query
  const refreshBudgets = useCallback(async (query?: string) => {
    const data = await trpc.getBudgets.query({ query });
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
            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
              <PrinterIcon className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Orçamento Impressão 3D</h1>
              <p className="text-slate-600">OI3D</p>
            </div>
          </div>
          
          {/* Stats Cards - Updated to be responsive with a single column on extra small screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <PrinterIcon className="size-5 text-slate-700" />
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
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Package className="size-5 text-slate-700" />
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
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="size-5 text-slate-700" />
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
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Settings className="size-5 text-slate-700" />
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
              <Calculator className="size-5" /> Calculadora
            </TabsTrigger>
            <TabsTrigger value="budgets" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <ClipboardList className="size-5" /> Orçamentos
            </TabsTrigger>
            <TabsTrigger value="printers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <PrinterIcon className="size-5" /> Impressoras
            </TabsTrigger>
            <TabsTrigger value="filaments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Package className="size-5" /> Filamentos
            </TabsTrigger>
            <TabsTrigger value="costs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Settings className="size-5" /> Custos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="size-5 text-slate-700" />
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
                  onBudgetCreated={() => refreshBudgets()} // Refresh budgets after creation
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="size-5 text-slate-700" />
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
                  onBudgetDeleted={() => refreshBudgets()} // Refresh budgets after deletion
                  onBudgetListRefresh={refreshBudgets} // Pass the new prop
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="printers" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <PrinterIcon className="size-5 text-slate-700" />
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
                  <Package className="size-5 text-slate-700" />
                  Gerenciar Filamentos
                </CardTitle>
                <CardDescription>
                  Cadastre e gerencie seus materiais de impressão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FilamentManagement 
                  filaments={filaments}
                  onFilamentListRefresh={refreshFilaments}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="size-5 text-slate-700" />
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
