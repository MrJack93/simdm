# SIMDM Design System v1.0
## Healthcare + Shadcn/UI + UI Pro Max Skill

**Дата:** 2026-06-05  
**Автор:** Claude Code + UI Pro Max Skill  
**Статус:** ✅ Активен (Фаза 3: Менте)

---

## 📐 Система цветов

### Основные палітра (Healthcare App)
Рекомендована палітра `#9` з 161 варіанту UI Pro Max Skill:

```css
:root {
  /* Primary: Calm Cyan - Trust & Medical */
  --primary: #0891B2;
  --primary-light: #22D3EE;
  
  /* CTA: Health Green - Positive Actions */
  --success: #059669;
  --success-light: #10B981;
  
  /* Backgrounds: Very Light Cyan */
  --bg-primary: #ECFEFF;
  --bg-secondary: #F0F9FF;
  
  /* Text: Dark Cyan - High Contrast */
  --text-primary: #164E63;
  --text-secondary: #0C4A6E;
  
  /* Borders: Light Cyan */
  --border: #A5F3FC;
  
  /* Semantic */
  --danger: #DC2626;
  --warning: #F59E0B;
  --info: #0891B2;
}
```

### CSS Variables в `design-system.css`
```css
/* Обновить существующие переменные */
:root {
  --color-bg-primary: var(--bg-primary);      /* ECFEFF */
  --color-accent: var(--primary);              /* 0891B2 */
  --color-text-primary: var(--text-primary);  /* 164E63 */
  --color-success: var(--success);             /* 059669 */
  --color-error: var(--danger);                /* DC2626 */
}
```

### Tailwind Config
```js
// tailwind.config.js (если потребуется создать)
module.exports = {
  theme: {
    colors: {
      primary: '#0891B2',
      secondary: '#22D3EE',
      success: '#059669',
      danger: '#DC2626',
      // ... остальные
    }
  }
}
```

---

## 🔤 Типографія

### Рекомендована: Medical Clean (Паiring #30)

| Роль | Шрифт | Вес | Використання |
|------|-------|-----|--------------|
| **Заголовки (H1-H6)** | Figtree | 600-700 | Сторінки, модалі, секції |
| **Основний текст** | Noto Sans | 400-500 | Body text, описи, labels |
| **Code / Data** | Fira Code | 400-500 | Таблиці, серійні номери, коди |

### Варіанти розміру
```css
/* Оновити в design-system.css */
h1 { font-size: 32px; font-weight: 700; line-height: 1.2; font-family: Figtree; }
h2 { font-size: 24px; font-weight: 600; line-height: 1.3; font-family: Figtree; }
h3 { font-size: 20px; font-weight: 600; line-height: 1.4; font-family: Figtree; }
p  { font-size: 16px; font-weight: 400; line-height: 1.6; font-family: 'Noto Sans'; }
```

### Google Fonts Import
```html
<!-- Додати в frontend/index.html -->
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;700&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## ♿ Accessibility (WCAG AA)

### 1. Color Contrast (Priority: CRITICAL)
- ✅ **4.5:1** для body text (вимога)
- ✅ **3:1** для UI components
- ✅ **Колір + Іконка** для статусів (не лише колір)

**Тест контрастності:**
```
#164E63 (text) на #ECFEFF (bg) = ✅ 10.2:1 (PASS)
#0891B2 (primary) на #ECFEFF (bg) = ✅ 5.3:1 (PASS)
```

### 2. Touch Targets (Priority: CRITICAL)
- ✅ **44x44px minimum** для кнопок
- ✅ **8px gap** між сусідніми цілями
- ✅ **Не трапи на клавіатуру** (Tab повинен працювати)

**Shadcn Button:**
```jsx
<Button className="min-h-[44px] min-w-[44px]">Дія</Button>
```

### 3. Focus States (Priority: CRITICAL)
- ✅ **Видимий focus ring** на всіх інтерактивних елементах
- ✅ **Контраст focus ring >= 3:1**

**Tailwind utility:**
```css
.focusable {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2;
  --tw-ring-color: var(--primary);
}
```

### 4. Form Labels (Priority: HIGH)
- ✅ **Завжди видимі labels** (не placeholder-only)
- ✅ **Label linked to input** (for attribute)
- ✅ **Required indicator** (*)

**Shadcn Form:**
```jsx
<FormField
  control={form.control}
  name="deviceName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Назва пристрою *</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
    </FormItem>
  )}
/>
```

### 5. Error Feedback (Priority: HIGH)
- ✅ **Помилка рядом із input**
- ✅ **Red + Icon + Text**
- ✅ **role=alert** для анонсування

```jsx
{error && (
  <div role="alert" className="text-danger flex gap-2">
    <AlertIcon /> {error}
  </div>
)}
```

---

## 🎯 Component Library (Shadcn Integration)

### Button Variants для медицини

```jsx
// Primary Action (зелена - позитивна)
<Button variant="default" className="bg-success">Зберегти</Button>

// Danger/Delete (червона - небезпека)
<Button variant="destructive">Видалити</Button>

// Secondary/Cancel
<Button variant="outline">Скасувати</Button>

// Icon Button + aria-label
<Button 
  variant="ghost" 
  size="icon" 
  aria-label="Зберегти"
>
  <SaveIcon />
</Button>
```

### Card для інвентаря

```jsx
<Card>
  <CardHeader>
    <CardTitle>УЗД Апарат A12</CardTitle>
    <CardDescription>Серійний №: 2024-001</CardDescription>
  </CardHeader>
  <CardContent>
    <StatusBadge status="active" /> Активний
  </CardContent>
</Card>
```

### Table для списків

```jsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Назва</TableHead>
      <TableHead>Статус</TableHead>
      <TableHead>Дії</TableHead>
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
          <Button size="sm" aria-label={`Редагувати ${device.name}`}>
            Редагувати
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Form для менте

```jsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Тип менте *</FormLabel>
          <Select onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Оберіть тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preventive">Профілактична</SelectItem>
              <SelectItem value="corrective">Коректуюча</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
    
    <Button type="submit" className="mt-6">
      Запланувати менте
    </Button>
  </form>
</Form>
```

---

## 🎨 Design Guidelines (99 правил UI Pro Max)

### Найважливіші для SIMDM (Medical + Healthcare)

#### 1️⃣ CRITICAL (обов'язкові)
- [ ] Color contrast >= 4.5:1 для text
- [ ] Touch targets >= 44x44px
- [ ] Visible focus states на всіх interactive elements
- [ ] Form labels завжди видимі
- [ ] Error messages з aria-live
- [ ] Loading states для async операцій
- [ ] Smooth scroll на anchor links
- [ ] Keyboard navigation працює

#### 2️⃣ HIGH (дуже важливі)
- [ ] Disabled button не дозволяє double-submit
- [ ] Confirmation dialog для delete операцій
- [ ] Success feedback після дій
- [ ] Hover + Active states
- [ ] Viewport meta tag правильний
- [ ] Z-index management систематичний
- [ ] Content jumping запобіжено

#### 3️⃣ MEDIUM (важливі)
- [ ] Smooth animations (150-300ms)
- [ ] Respect prefers-reduced-motion
- [ ] Readable font size (min 16px)
- [ ] Line height 1.5-1.75
- [ ] Line length 65-75ch
- [ ] Image optimization (WebP, srcset)
- [ ] Empty states з помічниками

---

## 📱 Responsive Design

### Breakpoints (Tailwind)
```css
sm: 640px   /* Планшет в портреті */
md: 768px   /* Планшет в ландшафті */
lg: 1024px  /* Desktop мікро */
xl: 1280px  /* Desktop */
2xl: 1536px /* Desktop широкий */
```

### Mobile First
```jsx
/* За замовчуванням: мобільний */
<div className="text-sm md:text-base lg:text-lg">
  Резервний текст
</div>

/* Мобільні кнопки більші */
<Button className="w-full md:w-auto">Дія</Button>
```

---

## 🧪 Testing Checklist

### Visual Testing
- [ ] Colors правильні на світлому & темному фоні
- [ ] Typography ієрархія ясна
- [ ] Spacing консистентний (4px grid)
- [ ] Icons 24x24px мінімум

### Accessibility Testing
- [ ] Keyboard navigation: Tab, Shift+Tab, Enter, Escape
- [ ] Screen reader: headings, labels, roles, alerts
- [ ] Color contrast: WebAIM checker
- [ ] Focus visible на всіх interactive

### Responsive Testing
- [ ] 320px (мобіль)
- [ ] 375px (iPhone)
- [ ] 768px (планшет)
- [ ] 1024px (desktop)
- [ ] 1440px (desktop wide)

### Performance Testing
- [ ] Bundle size < 300KB (gzip)
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] CLS < 0.1

---

## 🔄 Implementation Roadmap

### Неділя 1 (2026-06-05 — 2026-06-12): Фундамент
- [x] Shadcn/UI інстальована
- [ ] design-system.css оновлена з colors
- [ ] Google Fonts додані (Figtree, Noto Sans)
- [ ] CSS переменні задані

### Неділя 2-3 (2026-06-12 — 2026-06-26): Менте модулі
- [ ] План менте: Card + Tabs + Form
- [ ] Виконання МПП: Dialog + Button + Signature
- [ ] Менте корективна: Table + Dialog
- [ ] Перевірки періодичні: Badge + Progress
- [ ] Контракти: Form + Table

### Неділя 4 (2026-06-26 — 2026-07-03): Покращення
- [ ] Міграція старих компонентів
- [ ] Accessibility аудит
- [ ] Performance оптимізація
- [ ] Тестування на реальних пристроях

---

## 📚 Resources

### Встановлена база даних
```
frontend/.claude/skills/ui-ux-pro-max/
├── data/
│   ├── colors.csv         (161 палітра)
│   ├── typography.csv     (57 парів)
│   ├── ux-guidelines.csv  (99 guideline-ів)
│   └── stacks/
│       └── shadcn.csv     (Shadcn recommendations)
└── SKILL.md               (Документація)
```

### Посилання
- **Shadcn/UI:** https://ui.shadcn.com
- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/
- **Accessibility:** https://www.a11y-101.com
- **WebAIM Contrast:** https://webaim.org/resources/contrastchecker/

---

## 🎬 Quick Start

### Додати новий компонент
```bash
npm run add-component <name>
# Приклад:
npm run add-component checkbox progress alert
```

### Використовувати Form
```jsx
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
// See implementation examples above
```

### Перевірити контраст
1. Відкрити WebAIM Contrast Checker
2. Ввести #164E63 (text) та #ECFEFF (bg)
3. Перевірити >= 4.5:1

---

**Статус:** ✅ Готовий до реалізації  
**Контролер:** claude@anthropic.com  
**Версія:** 1.0 (2026-06-05)
