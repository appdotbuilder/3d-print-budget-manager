
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createPrinterInputSchema, 
  updatePrinterInputSchema,
  createFilamentInputSchema,
  updateFilamentInputSchema,
  costsConfigInputSchema,
  createBudgetInputSchema,
  getBudgetsInputSchema
} from './schema';

// Import handlers
import { createPrinter } from './handlers/create_printer';
import { getPrinters } from './handlers/get_printers';
import { updatePrinter } from './handlers/update_printer';
import { deletePrinter } from './handlers/delete_printer';
import { createFilament } from './handlers/create_filament';
import { getFilaments } from './handlers/get_filaments';
import { updateFilament } from './handlers/update_filament';
import { deleteFilament } from './handlers/delete_filament';
import { getCostsConfig } from './handlers/get_costs_config';
import { updateCostsConfig } from './handlers/update_costs_config';
import { calculateBudget } from './handlers/calculate_budget';
import { createBudget } from './handlers/create_budget';
import { getBudgets } from './handlers/get_budgets';
import { getBudgetWithDetails } from './handlers/get_budget_with_details';
import { updateBudget } from './handlers/update_budget';
import { deleteBudget } from './handlers/delete_budget';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Printer routes
  createPrinter: publicProcedure
    .input(createPrinterInputSchema)
    .mutation(({ input }) => createPrinter(input)),
  
  getPrinters: publicProcedure
    .query(() => getPrinters()),
  
  updatePrinter: publicProcedure
    .input(updatePrinterInputSchema)
    .mutation(({ input }) => updatePrinter(input)),
  
  deletePrinter: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePrinter(input.id)),

  // Filament routes  
  createFilament: publicProcedure
    .input(createFilamentInputSchema)
    .mutation(({ input }) => createFilament(input)),
  
  getFilaments: publicProcedure
    .query(() => getFilaments()),
  
  updateFilament: publicProcedure
    .input(updateFilamentInputSchema)
    .mutation(({ input }) => updateFilament(input)),
  
  deleteFilament: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteFilament(input.id)),

  // Costs configuration routes
  getCostsConfig: publicProcedure
    .query(() => getCostsConfig()),
  
  updateCostsConfig: publicProcedure
    .input(costsConfigInputSchema)
    .mutation(({ input }) => updateCostsConfig(input)),

  // Budget routes
  calculateBudget: publicProcedure
    .input(createBudgetInputSchema)
    .query(({ input }) => calculateBudget(input)),
  
  createBudget: publicProcedure
    .input(createBudgetInputSchema)
    .mutation(({ input }) => createBudget(input)),
  
  getBudgets: publicProcedure
    .input(getBudgetsInputSchema.optional())
    .query(({ input }) => getBudgets(input || {})),
  
  getBudgetWithDetails: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getBudgetWithDetails(input.id)),
  
  updateBudget: publicProcedure
    .input(z.object({ 
      id: z.number(),
      data: createBudgetInputSchema 
    }))
    .mutation(({ input }) => updateBudget(input.id, input.data)),
  
  deleteBudget: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteBudget(input.id)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: cors({
      origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }),
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
