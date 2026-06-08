import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Plus, Edit, Trash2, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';

// Validare schema
const maintenancePlanSchema = z.object({
  deviceId: z.string().min(1, 'Selectați dispozitivul'),
  type: z.enum(['preventive', 'corrective'], { errorMap: () => ({ message: 'Selectați tipul' }) }),
  frequency: z.enum(['monthly', 'quarterly', 'yearly'], { errorMap: () => ({ message: 'Selectați frecvența' }) }),
  startDate: z.string().min(1, 'Selectați data'),
});

const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

/**
 * Culori pentru badge-uri status — folosesc CSS variables pentru a respecta
 * automat theme toggle-ul (dark/light). Anterior erau clase Tailwind hardcodate
 * (bg-blue-100 text-blue-800) care ignorau modul întunecat al aplicației.
 */
const STATUS_STYLES = {
  scheduled: { bg: 'var(--color-info-bg)',    color: 'var(--color-info)'    },
  completed: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  overdue:   { bg: 'var(--color-error-bg)',   color: 'var(--color-error)'   },
};

const STATUS_LABELS = {
  scheduled: 'Planificat',
  completed: 'Finalizat',
  overdue: 'Datorat',
};

export default function MaintenancePlanPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [_editingId, setEditingId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(maintenancePlanSchema),
    defaultValues: {
      deviceId: '',
      type: 'preventive',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  // Obțineți planurile de mentenanță
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['maintenancePlans'],
    queryFn: async () => {
      const res = await api.get('/maintenance-plans');
      return res.data;
    },
  });

  // Obțineți dispozitivele — reutilizează același queryKey ['devices'] ca InventoryPageV2.
  // API răspunde cu { devices: [...] }, NU cu un array direct.
  // Anterior: res.data era un obiect → devices.map() itera pe undefined → select gol.
  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await api.get('/devices');
      return res.data; // { devices: [...], total: N }
    },
    staleTime: 2 * 60 * 1000,
  });
  const devices = devicesData?.devices ?? [];

  // Creare plan
  const createPlanMutation = useMutation({
    mutationFn: (data) => api.post('/maintenance-plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenancePlans'] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  // Ștergere plan — cu toast feedback (anterior: onSuccess fără notificare utilizator)
  const deletePlanMutation = useMutation({
    mutationFn: (id) => api.delete(`/maintenance-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenancePlans'] });
      toast.success('Plan de mentenanță șters');
    },
    onError: () => {
      toast.error('Eroare la ștergerea planului. Încearcă din nou.');
    },
  });

  const onSubmit = (data) => {
    createPlanMutation.mutate(data);
  };

  // Evenimente pentru luna selectată
  const currentYear = new Date().getFullYear();
  const monthEvents = plans.filter(plan => {
    const planDate = new Date(plan.scheduledDate);
    return planDate.getMonth() === selectedMonth && planDate.getFullYear() === currentYear;
  });

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        <div className="loading-spinner" />
        <p style={{ color: 'var(--color-text-secondary)' }}>Se încarcă planurile…</p>
      </div>
    );
  }

  return (
    <main className="space-y-6 p-4 md:p-8">
      {/* Antet */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--healthcare-primary)' }}>
            Plan de mentenanță
          </h1>
          <p className="text-secondary-foreground">Gestionați mentenanța preventivă și corectivă conform standardelor medicale</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="gap-2"
                style={{ backgroundColor: 'var(--healthcare-success)', color: '#fff' }}
                aria-label="Adăugați plan de mentenanță nou"
              >
                <Plus size={20} />
                Adaugă plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Plan de mentenanță nou</DialogTitle>
              </DialogHeader>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Selectare dispozitiv */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Dispozitiv *</label>
                  <Select
                    onValueChange={(value) => form.setValue('deviceId', value)}
                    defaultValue={form.getValues('deviceId')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectați dispozitivul" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map(device => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.deviceId && (
                    <p className="text-sm text-destructive">{form.formState.errors.deviceId.message}</p>
                  )}
                </div>

                {/* Tip mentenanță */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Tip mentenanță *</label>
                  <Select
                    onValueChange={(value) => form.setValue('type', value)}
                    defaultValue={form.getValues('type')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">Preventivă (MPP)</SelectItem>
                      <SelectItem value="corrective">Corectivă</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.type && (
                    <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
                  )}
                </div>

                {/* Frecvență */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Frecvență *</label>
                  <Select
                    onValueChange={(value) => form.setValue('frequency', value)}
                    defaultValue={form.getValues('frequency')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Lunar</SelectItem>
                      <SelectItem value="quarterly">Trimestrial</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.frequency && (
                    <p className="text-sm text-destructive">{form.formState.errors.frequency.message}</p>
                  )}
                </div>

                {/* Data început */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Prima dată *</label>
                  <Input
                    type="date"
                    {...form.register('startDate')}
                  />
                  {form.formState.errors.startDate && (
                    <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  style={{ backgroundColor: 'var(--healthcare-success)', color: '#fff' }}
                  disabled={createPlanMutation.isPending}
                  aria-label="Creare plan de mentenanță"
                >
                  {createPlanMutation.isPending ? 'Se creează...' : 'Creare'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="gap-2">
            <Download size={20} />
            <span className="hidden sm:inline">Exportă</span>
          </Button>
        </div>
      </div>

      {/* Calendar cu luni */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar {currentYear}</CardTitle>
          <CardDescription>Selectați luna pentru a vedea planurile de mentenanță</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
            <TabsList className="grid grid-cols-6 md:grid-cols-12 gap-1 mb-6">
              {MONTHS.map((month, idx) => (
                <TabsTrigger key={month} value={idx.toString()} className="text-xs px-2">
                  {month.slice(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>

            {MONTHS.map((month, idx) => (
              <TabsContent key={month} value={idx.toString()} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {monthEvents.length === 0 ? (
                    <div className="text-center py-8 text-secondary-foreground col-span-2">
                      <Calendar className="mx-auto mb-2 opacity-50" size={40} />
                      <p>Nu sunt planuri pentru {month}</p>
                    </div>
                  ) : (
                    monthEvents.map(event => (
                      <Card key={event.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-semibold">{event.deviceName}</p>
                              <p className="text-sm text-secondary-foreground">
                                {new Date(event.scheduledDate).toLocaleDateString('ro-RO')}
                              </p>
                            </div>
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: STATUS_STYLES[event.status]?.bg   ?? 'var(--color-bg-tertiary)',
                                color:           STATUS_STYLES[event.status]?.color ?? 'var(--color-text-primary)',
                              }}
                            >
                              {STATUS_LABELS[event.status]}
                            </span>
                          </div>

                          <div className="text-sm">
                            <span className="text-secondary-foreground">Tip: </span>
                            <span>{event.type === 'preventive' ? 'Preventivă' : 'Corectivă'}</span>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(event.id)}
                              className="gap-1"
                              aria-label={`Editare plan ${event.deviceName}`}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deletePlanMutation.mutate(event.id)}
                              disabled={deletePlanMutation.isPending && deletePlanMutation.variables === event.id}
                              aria-label={`Ștergere plan ${event.deviceName}`}
                              className="gap-1"
                            >
                              {deletePlanMutation.isPending && deletePlanMutation.variables === event.id
                                ? <span className="loading-spinner loading-spinner-sm" />
                                : <Trash2 size={16} />}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Tabel cu toate evenimentele */}
      <Card>
        <CardHeader>
          <CardTitle>Toate planurile de mentenanță</CardTitle>
          <CardDescription>Lista completă pentru {currentYear}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispozitiv</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map(plan => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.deviceName}</TableCell>
                  <TableCell>
                    {plan.type === 'preventive' ? 'Preventivă' : 'Corectivă'}
                  </TableCell>
                  <TableCell>
                    {new Date(plan.scheduledDate).toLocaleDateString('ro-RO')}
                  </TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: STATUS_STYLES[plan.status]?.bg   ?? 'var(--color-bg-tertiary)',
                        color:           STATUS_STYLES[plan.status]?.color ?? 'var(--color-text-primary)',
                      }}
                    >
                      {STATUS_LABELS[plan.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(plan.id)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePlanMutation.mutate(plan.id)}
                      disabled={deletePlanMutation.isPending && deletePlanMutation.variables === plan.id}
                      aria-label={`Ștergere plan ${plan.deviceName}`}
                    >
                      {deletePlanMutation.isPending && deletePlanMutation.variables === plan.id
                        ? <span className="loading-spinner loading-spinner-sm" />
                        : <Trash2 size={16} />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
