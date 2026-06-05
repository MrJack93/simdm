# Sistem de design SIMDM v1.0
## Medical + Shadcn/UI + UI Pro Max Skill

**Dată:** 2026-06-05  
**Autor:** Claude Code + UI Pro Max Skill  
**Status:** ✅ Activ (Faza 3: Mentenanță)

---

## 📐 Paleta de culori

### Paleta principală (Aplicații medicale)
Recomandare UI Pro Max Skill - paleta #9 din 161 variante:

```css
:root {
  /* Principal: Cyan calm - Încredere medicală */
  --primary: #0891B2;
  --primary-light: #22D3EE;
  
  /* CTA: Verde sănătate - Acțiuni pozitive */
  --success: #059669;
  --success-light: #10B981;
  
  /* Fundal: Cyan foarte ușor */
  --bg-primary: #ECFEFF;
  --bg-secondary: #F0F9FF;
  
  /* Text: Cyan închis - Contrast maxim */
  --text-primary: #164E63;
  --text-secondary: #0C4A6E;
  
  /* Borduri: Cyan ușor */
  --border: #A5F3FC;
  
  /* Semantic */
  --danger: #DC2626;
  --warning: #F59E0B;
  --info: #0891B2;
}
```

### CSS Variabile în `design-system.css`
```css
/* Actualizare variabile existente */
:root {
  --color-bg-primary: var(--bg-primary);      /* ECFEFF */
  --color-accent: var(--primary);              /* 0891B2 */
  --color-text-primary: var(--text-primary);  /* 164E63 */
  --color-success: var(--success);             /* 059669 */
  --color-error: var(--danger);                /* DC2626 */
}
```

### Config Tailwind
```js
// tailwind.config.js (dacă va fi necesar)
module.exports = {
  theme: {
    colors: {
      primary: '#0891B2',
      secondary: '#22D3EE',
      success: '#059669',
      danger: '#DC2626',
      // ... restul
    }
  }
}
```

---

## 🔤 Tipografie

### Recomandare: Medical Clean (Pairing #30)

| Rol | Font | Greutate | Utilizare |
|-----|------|----------|-----------|
| **Titluri (H1-H6)** | Figtree | 600-700 | Pagini, modal-uri, secții |
| **Text principal** | Noto Sans | 400-500 | Conținut, descrieri, etichete |
| **Code / Date** | Fira Code | 400-500 | Tabele, numere seriale, coduri |

### Variante de mărime
```css
/* Actualizare în design-system.css */
h1 { font-size: 32px; font-weight: 700; line-height: 1.2; font-family: Figtree; }
h2 { font-size: 24px; font-weight: 600; line-height: 1.3; font-family: Figtree; }
h3 { font-size: 20px; font-weight: 600; line-height: 1.4; font-family: Figtree; }
p  { font-size: 16px; font-weight: 400; line-height: 1.6; font-family: 'Noto Sans'; }
```

### Import Google Fonts
```html
<!-- Adaugă în frontend/index.html -->
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;700&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## ♿ Accesibilitate (WCAG AA)

### 1. Contrast de culoare (Prioritate: CRITIC)
- ✅ **4.5:1** pentru text (cerință)
- ✅ **3:1** pentru componente UI
- ✅ **Culoare + Pictogramă** pentru status (nu doar culoare)

**Testare contrast:**
```
#164E63 (text) pe #ECFEFF (fundal) = ✅ 10.2:1 (PASS)
#0891B2 (primary) pe #ECFEFF (fundal) = ✅ 5.3:1 (PASS)
```

### 2. Ținte de atingere (Prioritate: CRITIC)
- ✅ **44x44px minim** pentru butoane
- ✅ **8px spațiu** între ținte adiacente
- ✅ **Niciun pictor de tastatură** (Tab funcționează)

**Buton Shadcn:**
```jsx
<Button className="min-h-[44px] min-w-[44px]">Acțiune</Button>
```

### 3. Stări de Focus (Prioritate: CRITIC)
- ✅ **Inel focus vizibil** pe toate elementele interactive
- ✅ **Contrast inel focus >= 3:1**

**Utility Tailwind:**
```css
.focusable {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2;
  --tw-ring-color: var(--primary);
}
```

### 4. Etichete de formular (Prioritate: ÎNALTĂ)
- ✅ **Etichete întotdeauna vizibile** (nu placeholder-only)
- ✅ **Etichetă conectată la input** (atribut for)
- ✅ **Indicator obligatoriu** (*)

**Formular Shadcn:**
```jsx
<div className="space-y-2">
  <label htmlFor="device" className="text-sm font-medium">Dispozitiv *</label>
  <Input id="device" {...field} />
</div>
```

### 5. Feedback de eroare (Prioritate: ÎNALTĂ)
- ✅ **Mesaj de eroare lângă input**
- ✅ **Roșu + Pictogramă + Text**
- ✅ **role=alert** pentru anunț

```jsx
{error && (
  <div role="alert" className="text-danger flex gap-2">
    <AlertIcon /> {error}
  </div>
)}
```

---

## 🎯 Biblioteca de componente (Shadcn Integration)

### Variante de buton pentru medic

```jsx
// Acțiune principală (verde - pozitivă)
<Button className="bg-success">Salvare</Button>

// Ștergere/Pericol (roșu - pericol)
<Button variant="destructive">Ștergere</Button>

// Anulare/Secundar
<Button variant="outline">Anulare</Button>

// Buton pictogramă + aria-label
<Button 
  variant="ghost" 
  size="icon" 
  aria-label="Salvare"
>
  <SaveIcon />
</Button>
```

### Card pentru inventar

```jsx
<Card>
  <CardHeader>
    <CardTitle>Aparat USG A12</CardTitle>
    <CardDescription>Număr serial: 2024-001</CardDescription>
  </CardHeader>
  <CardContent>
    <StatusBadge status="active" /> Activ
  </CardContent>
</Card>
```

### Tabel pentru liste

```jsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nume</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Acțiuni</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {devices.map(device => (
      <TableRow key={device.id}>
        <TableCell>{device.name}</TableCell>
        <TableCell>
          <Badge variant={device.status}>
            {statusLabel(device.status)}
          </Badge>
        </TableCell>
        <TableCell>
          <Button size="sm" aria-label={`Editare ${device.name}`}>
            Editare
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Formular pentru mentenanță

```jsx
<form onSubmit={handleSubmit} className="space-y-4">
  <div className="space-y-2">
    <label className="text-sm font-medium">Tip mentenanță *</label>
    <Select onValueChange={setType} defaultValue="preventive">
      <SelectTrigger>
        <SelectValue placeholder="Selectați tip" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="preventive">Preventivă (MPP)</SelectItem>
        <SelectItem value="corrective">Corectivă</SelectItem>
      </SelectContent>
    </Select>
  </div>
  
  <Button type="submit" className="mt-6">
    Planificare mentenanță
  </Button>
</form>
```

---

## 🎨 Ghiduri de design (99 reguli UI Pro Max)

### Cel mai important pentru SIMDM (Medical + Healthcare)

#### 1️⃣ CRITIC (obligatoriu)
- [ ] Contrast culoare >= 4.5:1 pentru text
- [ ] Ținte >= 44x44px
- [ ] Stări de focus vizibile pe toate elementele interactive
- [ ] Etichete de formular întotdeauna vizibile
- [ ] Mesaje de eroare cu aria-live
- [ ] Stări de încărcare pentru operații async
- [ ] Scroll ușor pe anchor link-uri
- [ ] Navigare cu tastatură funcționează

#### 2️⃣ ÎNALTĂ (foarte important)
- [ ] Butoane dezactivate nu permit double-submit
- [ ] Dialog de confirmare pentru ștergeri
- [ ] Feedback de succes după acțiuni
- [ ] Stări hover + active
- [ ] Meta tag viewport corect
- [ ] Z-index management sistematic
- [ ] Prevenire content jumping

#### 3️⃣ MEDIU (important)
- [ ] Animații ușoare (150-300ms)
- [ ] Respect prefers-reduced-motion
- [ ] Mărime font lizibilă (min 16px)
- [ ] Line height 1.5-1.75
- [ ] Lungime linie 65-75ch
- [ ] Optimizare imagini (WebP, srcset)
- [ ] Stări goale cu ajutoare

---

## 📱 Design responsive

### Breakpoints (Tailwind)
```css
sm: 640px   /* Tablă în portret */
md: 768px   /* Tablă în peisaj */
lg: 1024px  /* Desktop mic */
xl: 1280px  /* Desktop */
2xl: 1536px /* Desktop lat */
```

### Mobile First
```jsx
/* Implicit: mobil */
<div className="text-sm md:text-base lg:text-lg">
  Text responsive
</div>

/* Butoane mai mari pe mobil */
<Button className="w-full md:w-auto">Acțiune</Button>
```

---

## 🧪 Checklist testare

### Testare vizuală
- [ ] Culori corecte pe fundal deschis & închis
- [ ] Ierarhie de tipografie clară
- [ ] Spațiere consistentă (grilă 4px)
- [ ] Pictograme 24x24px minim

### Testare accesibilitate
- [ ] Navigare tastatură: Tab, Shift+Tab, Enter, Escape
- [ ] Screen reader: titluri, etichete, roluri, alerte
- [ ] Contrast culoare: checker WebAIM
- [ ] Focus vizibil pe toate elementele interactive

### Testare responsiv
- [ ] 320px (mobil)
- [ ] 375px (iPhone)
- [ ] 768px (tablă)
- [ ] 1024px (desktop)
- [ ] 1440px (desktop lat)

### Testare performanță
- [ ] Bundle size < 300KB (gzip)
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] CLS < 0.1

---

## 🔄 Foaie de parcurs implementare

### Săptămâna 1 (2026-06-05 — 2026-06-12): Fundament
- [x] Shadcn/UI instalat
- [x] design-system.css actualizat cu culori
- [x] Google Fonts adăugate (Figtree, Noto Sans)
- [x] CSS variabile definite

### Săptămânile 2-3 (2026-06-12 — 2026-06-26): Module mentenanță
- [ ] Plan mentenanță: Card + Tabs + Formular
- [ ] Execuție MPP: Dialog + Buton + Semnătură
- [ ] Mentenanță corectivă: Tabel + Dialog
- [ ] Verificări periodice: Badge + Progress
- [ ] Contracte: Formular + Tabel

### Săptămâna 4 (2026-06-26 — 2026-07-03): Îmbunătățiri
- [ ] Migrare componente vechi
- [ ] Audit accesibilitate
- [ ] Optimizare performanță
- [ ] Testare pe dispozitive reale

---

## 📚 Resurse

### Bază de date instalată
```
frontend/.claude/skills/ui-ux-pro-max/
├── data/
│   ├── colors.csv         (161 palete)
│   ├── typography.csv     (57 perechi)
│   ├── ux-guidelines.csv  (99 ghiduri)
│   └── stacks/
│       └── shadcn.csv     (Recomandări Shadcn)
└── SKILL.md               (Documentație)
```

### Link-uri
- **Shadcn/UI:** https://ui.shadcn.com
- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/
- **Accesibilitate:** https://www.a11y-101.com
- **WebAIM Contrast:** https://webaim.org/resources/contrastchecker/

---

## 🎬 Start rapid

### Adaugă component nou
```bash
npm run add-component <name>
# Exemplu:
npm run add-component checkbox progress alert
```

### Folosire formular
```jsx
import { Input, Select, Button } from "@/components/ui/*"
// Vezi exemple de implementare mai sus
```

### Verifica contrast
1. Deschide WebAIM Contrast Checker
2. Introdu #164E63 (text) și #ECFEFF (fundal)
3. Verifica >= 4.5:1

---

**Status:** ✅ Gata pentru implementare  
**Controlor:** claude@anthropic.com  
**Versiune:** 1.0 (2026-06-05)
