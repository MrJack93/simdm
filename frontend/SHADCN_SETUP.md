# Shadcn/UI + UI Pro Max Skill - Configurare

## Ce a fost instalat (2026-06-05)

### Shadcn/UI (nou)
- **Versiune:** Latest (v2.x)
- **Componente instalate:**
  - `button` — butoane cu mai multe variante de stil
  - `card` — carduri (containere cu padding + shadow)
  - `dialog` — ferestre modale (pe baza Radix UI Dialog)
  - `input` — câmpuri de text
  - `select` — liste dropdown
  - `table` — tabele (pentru inventar și liste)
  - `badge` — etichete și status-uri
  - `tabs` — file (pentru comutare între secțiuni)
  - `tooltip` — sugestii (necesită TooltipProvider)
  - `form` — wrapper pentru React Hook Form (simplifică lucrul cu formulare)

### UI Pro Max Skill CLI
- **Pachet:** `uipro-cli`
- **Scop:** Generare sistem de design pentru UI pe bază de AI
- **Utilizare:** `npx uipro-cli` sau `npm run design-system`

### Configurație
- **jsconfig.json** — adăugat pentru path aliases (`@/components`, `@/lib`)
- **components.json** — config shadcn/ui (stil: `base-nova`, pictograme: `lucide`)
- **index.css** — actualizat cu stiluri shadcn/ui

---

## Cum să folosiți componente Shadcn

### 1. Import component
```jsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
```

### 2. Exemplu simplu (Buton)
```jsx
<Button variant="default" size="lg">
  Adaugă dispozitiv
</Button>
```

**Variante:** `default`, `secondary`, `destructive`, `outline`, `ghost`  
**Dimensiuni:** `sm`, `default`, `lg`

### 3. Card pentru blocuri de date
```jsx
<Card>
  <CardHeader>
    <CardTitle>Inventar</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Conținut card */}
  </CardContent>
</Card>
```

### 4. Formular cu React Hook Form
```jsx
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function DeviceForm() {
  const form = useForm()
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label htmlFor="name">Nume dispozitiv</label>
        <Input 
          id="name"
          placeholder="Aparat USG" 
          {...form.register('name')} 
        />
      </div>
      <Button type="submit">Salvare</Button>
    </form>
  )
}
```

### 5. Tabel pentru liste
```jsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nume</TableHead>
      <TableHead>Număr serial</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {devices.map(device => (
      <TableRow key={device.id}>
        <TableCell>{device.name}</TableCell>
        <TableCell>{device.serialNumber}</TableCell>
        <TableCell>{device.status}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## Adăugare componente noi

Shadcn registry-ul conține sute de componente. Pentru a adăuga una nouă:

```bash
npm run add-component checkbox
npm run add-component progress
npm run add-component alert
```

Sau direct:
```bash
npx shadcn add checkbox -y
```

Lista disponibilă: https://ui.shadcn.com/docs/components/

---

## UI Pro Max Skill

### Scop
Generează recomandări de sistem de design pe bază de:
- Tip de aplicație (medicală)
- Alți parametri (accesibilitate, contrast)
- Analiza AI a celor mai bune practici

### Cum să folosiți

1. **Obțineți recomandări pentru SIMDM:**
   ```bash
   npm run design-system -- --type healthcare
   ```

2. **Integrare cu Shadcn:**
   Din 161 palete de culori, selectați cea care se potrivește aplicației medicale și actualizați `components.json`

3. **Aplicare tipografie:**
   Din 57 perechi de fonturi, selectați două pentru titluri și text de corp

---

## Integrare cu componente existente

SIMDM are deja componente proprii:
- `frontend/src/components/Button.jsx`
- `frontend/src/components/Card.jsx`
- `frontend/src/components/Input.jsx`

**Plan de migrare:**
1. **Faza 1** (curentă): Ambele seturi coexistă
2. **Faza 2** (Mentenanță, săptămâna 3): Înlocuiți cu shadcn pe pagini noi
3. **Faza 3** (Mentenanță, săptămâna 4): Migrați pagini vechi la shadcn

---

## Teme & Personalizare

### Tema curentă (base-nova)
- **Culori întunecat:** Compatibile cu tema existentă SIMDM
- **CSS variabile:** Pot fi redefinite în `design-system.css`

### Personalizare paletă
Definiți variabile în `design-system.css`:
```css
:root {
  --primary: #0891B2;
  --secondary: #64748b;
  --destructive: #ef4444;
}
```

---

## Probleme posibile

### 1. TooltipProvider nu se importă
Dacă aveți nevoie de componenta Tooltip pe pagină (de ex., pentru sfaturi):
```jsx
// main.jsx
import { TooltipProvider } from "@/components/ui/tooltip"

// Înconjurați tot conținutul
<TooltipProvider>
  <App />
</TooltipProvider>
```

### 2. Conflicte de stil
Dacă apar conflicte între Shadcn și CSS existentă:
- Verificați `design-system.css`
- Ștergeți utilități duplicate
- Folosiți CSS specificity dacă trebuie să suprascrieți

### 3. Dimensiune bundle
Dimensiune curentă: **828.90 kB (239.93 kB gzipped)**

Pentru optimizare (dacă necesar):
- Folosiți `npm run build` cu flag `--analyze`
- Activați dynamic imports pentru rute mari
- Verificați code splitting

---

## Următorii pași

1. **Faza 3 Mentenanță (2026-06-05):** Folosiți Shadcn pentru noi formulare
2. **Formulare:** Device, Maintenance, Incident folosesc input/select
3. **Tabele:** Inventory, Consumables folosesc `shadcn/table`
4. **Sistem de design:** Lansați UI Pro Max Skill pentru tema medicală

---

## Link-uri

- Shadcn/UI: https://ui.shadcn.com
- UI Pro Max Skill: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Radix UI (bază Shadcn): https://www.radix-ui.com
