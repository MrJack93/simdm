import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SignatureCanvas from 'react-signature-canvas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, Save, Download, Trash2 } from 'lucide-react';
import api from '../api/axios';

// Schema validare
const executionSchema = z.object({
  engineer: z.string().min(1, 'Selectați inginerul'),
  executionDate: z.string().min(1, 'Selectați data execuției'),
  inspectionResult: z.string().min(10, 'Descrieți rezultatul inspecției'),
  partiesReplaced: z.string().optional(),
  technicalNotes: z.string().optional(),
});

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  scheduled: 'bg-blue-100 text-blue-800',
};

export default function MaintenanceExecutionPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [hasSignature, setHasSignature] = useState(false);
  const signatureRef = useRef();

  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(executionSchema),
    defaultValues: {
      engineer: '',
      executionDate: new Date().toISOString().split('T')[0],
      inspectionResult: '',
      partiesReplaced: '',
      technicalNotes: '',
    },
  });

  // Planuri de mentenanță planificate
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['maintenancePlans'],
    queryFn: async () => {
      const res = await api.get('/maintenance-plans?status=scheduled');
      return res.data;
    },
  });

  // Ingineri disponibili
  const { data: engineers = [] } = useQuery({
    queryKey: ['engineers'],
    queryFn: async () => {
      const res = await api.get('/engineers');
      return res.data;
    },
  });

  // Execuții finalizate
  const { data: executions = [] } = useQuery({
    queryKey: ['maintenanceExecutions'],
    queryFn: async () => {
      const res = await api.get('/maintenance-executions');
      return res.data;
    },
  });

  // Creare execuție
  const createExecutionMutation = useMutation({
    mutationFn: async (data) => {
      const signature = signatureRef.current?.toDataURL('image/png');
      return api.post('/maintenance-executions', {
        ...data,
        maintenancePlanId: selectedPlan.id,
        signature,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenancePlans', 'maintenanceExecutions'] });
      setIsDialogOpen(false);
      setSelectedPlan(null);
      form.reset();
      setHasSignature(false);
      signatureRef.current?.clear();
    },
  });

  // Ștergere execuție
  const deleteExecutionMutation = useMutation({
    mutationFn: (id) => api.delete(`/maintenance-executions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceExecutions'] });
    },
  });

  const onSubmit = (data) => {
    if (!hasSignature) {
      alert('Semnătura digitală este obligatorie!');
      return;
    }
    createExecutionMutation.mutate(data);
  };

  const handleSignatureClear = () => {
    signatureRef.current?.clear();
    setHasSignature(false);
  };

  const handleSignatureEnd = () => {
    const isEmpty = signatureRef.current?.isEmpty();
    setHasSignature(!isEmpty);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Se încarcă...</div>;
  }

  // Planuri care așteptă execuție
  const pendingPlans = plans.filter(p => p.status === 'scheduled');

  return (
    <main className="space-y-6 p-4 md:p-8">
      {/* Antet */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--healthcare-primary)' }}>
            Execuție mentenanță
          </h1>
          <p className="text-secondary-foreground">Raportare execuție MPP și mentenanță corectivă cu semnătură digitală</p>
        </div>
      </div>

      {/* Planuri în așteptare */}
      {pendingPlans.length > 0 && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench size={20} />
              Planuri în așteptare execuție
            </CardTitle>
            <CardDescription>
              {pendingPlans.length} dispozitiv(e) programat(e) pentru mentenanță
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingPlans.map(plan => (
                <Card key={plan.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="font-semibold">{plan.deviceName}</p>
                      <p className="text-sm text-secondary-foreground">
                        Data programată: {new Date(plan.scheduledDate).toLocaleDateString('ro-RO')}
                      </p>
                      <p className="text-sm">
                        Tip: {plan.type === 'preventive' ? 'Preventivă' : 'Corectivă'}
                      </p>
                      <Dialog open={isDialogOpen && selectedPlan?.id === plan.id}
                              onOpenChange={(open) => {
                                setIsDialogOpen(open);
                                if (open) setSelectedPlan(plan);
                              }}>
                        <DialogTrigger asChild>
                          <Button className="w-full mt-4" style={{ backgroundColor: 'var(--color-success)' }}>
                            Execută mentenanță
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Raport execuție - {plan.deviceName}</DialogTitle>
                          </DialogHeader>

                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Inginer */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">Inginer responsabil *</label>
                              <Select
                                onValueChange={(value) => form.setValue('engineer', value)}
                                defaultValue={form.getValues('engineer')}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selectați inginerul" />
                                </SelectTrigger>
                                <SelectContent>
                                  {engineers.map(eng => (
                                    <SelectItem key={eng.id} value={eng.id}>
                                      {eng.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {form.formState.errors.engineer && (
                                <p className="text-sm text-destructive">{form.formState.errors.engineer.message}</p>
                              )}
                            </div>

                            {/* Data execuție */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">Data execuției *</label>
                              <Input
                                type="date"
                                {...form.register('executionDate')}
                              />
                              {form.formState.errors.executionDate && (
                                <p className="text-sm text-destructive">{form.formState.errors.executionDate.message}</p>
                              )}
                            </div>

                            {/* Rezultat inspecție */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">Rezultat inspecție *</label>
                              <textarea
                                {...form.register('inspectionResult')}
                                className="w-full px-3 py-2 border rounded-md bg-background"
                                rows="4"
                                placeholder="Descrieți rezultatul inspecției și măsurătorile efectuate..."
                              />
                              {form.formState.errors.inspectionResult && (
                                <p className="text-sm text-destructive">{form.formState.errors.inspectionResult.message}</p>
                              )}
                            </div>

                            {/* Piese înlocuite */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">Piese înlocuite (opțional)</label>
                              <textarea
                                {...form.register('partiesReplaced')}
                                className="w-full px-3 py-2 border rounded-md bg-background"
                                rows="2"
                                placeholder="Ex: Filtru aer, Baterii, Lubrifiant..."
                              />
                            </div>

                            {/* Observații tehnice */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">Observații tehnice (opțional)</label>
                              <textarea
                                {...form.register('technicalNotes')}
                                className="w-full px-3 py-2 border rounded-md bg-background"
                                rows="2"
                                placeholder="Orice observații relevante pentru următoarea mentenanță..."
                              />
                            </div>

                            {/* Semnătură digitală */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">Semnătură digitală *</label>
                              <div className="border-2 border-dashed rounded-lg p-4 bg-white">
                                <p className="text-xs text-secondary-foreground mb-2">
                                  Desenați semnătura dvs. mai jos
                                </p>
                                <SignatureCanvas
                                  ref={signatureRef}
                                  canvasProps={{
                                    width: 500,
                                    height: 120,
                                    className: 'border rounded w-full cursor-crosshair bg-white',
                                  }}
                                  onEnd={handleSignatureEnd}
                                />
                              </div>
                              {hasSignature && (
                                <p className="text-xs text-green-600">✅ Semnătură înregistrată</p>
                              )}
                              {!hasSignature && (
                                <p className="text-xs text-orange-600">⚠️ Semnătură obligatorie</p>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSignatureClear}
                                disabled={!hasSignature}
                              >
                                Curățare semnătură
                              </Button>
                            </div>

                            {/* Butoane acțiune */}
                            <div className="flex gap-2 pt-4">
                              <Button
                                type="submit"
                                className="flex-1"
                                style={{ backgroundColor: 'var(--color-success)' }}
                                disabled={createExecutionMutation.isPending || !hasSignature}
                              >
                                <Save size={16} className="mr-2" />
                                {createExecutionMutation.isPending ? 'Se salvează...' : 'Salvare & Generare PDF'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                              >
                                Anulare
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Istoric execuții */}
      <Card>
        <CardHeader>
          <CardTitle>Execuții finalizate</CardTitle>
          <CardDescription>Rapoarte mentenanță salvate și generate</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispozitiv</TableHead>
                <TableHead>Data execuției</TableHead>
                <TableHead>Inginer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map(execution => (
                <TableRow key={execution.id}>
                  <TableCell className="font-medium">{execution.deviceName}</TableCell>
                  <TableCell>
                    {new Date(execution.executionDate).toLocaleDateString('ro-RO')}
                  </TableCell>
                  <TableCell>{execution.engineerName}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[execution.status]}>
                      Finalizat ✅
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                    >
                      <Download size={16} />
                      <span className="hidden sm:inline">PDF</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteExecutionMutation.mutate(execution.id)}
                      disabled={deleteExecutionMutation.isPending}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {executions.length === 0 && (
                <TableRow>
                  <TableCell colSpan="5" className="text-center py-8 text-secondary-foreground">
                    Nu sunt execuții finalizate încă
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
