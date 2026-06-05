# Shadcn/UI + UI Pro Max Skill Integration

## Что было установлено (2026-06-05)

### Shadcn/UI (новое)
- **Версия:** Latest (v2.x)
- **Компоненты инсталированы:**
  - `button` — кнопки с несколькими вариантами стиля
  - `card` — карточки (контейнеры с padding + shadow)
  - `dialog` — модальні вікна (на основі Radix UI Dialog)
  - `input` — текстові поля
  - `select` — выпадающие списки
  - `table` — таблиці (для інвентару и списків)
  - `badge` — етикетки і статуси
  - `tabs` — вкладки (для переключения меж розділами)
  - `tooltip` — підказки (настройка: нужна TooltipProvider в корні)
  - `form` — обгортка для React Hook Form (спрощує роботу з формами)

### UI Pro Max Skill CLI
- **Пакет:** `uipro-cli`
- **Призначение:** Генерація дизайн-систем для UI на базі AI
- **Використання:** `npx uipro-cli` або `npm run design-system`

### Конфігурація
- **jsconfig.json** — добавлен для path aliases (`@/components`, `@/lib`)
- **components.json** — конфиг shadcn/ui (стиль: `base-nova`, иконки: `lucide`)
- **index.css** — обновлена с shadcn/ui стилями

---

## Як використовувати Shadcn компоненти

### 1. Импорт компонента
```jsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
```

### 2. Простой приклад (кнопка)
```jsx
<Button variant="default" size="lg">
  Додати пристрій
</Button>
```

**Варіанти:** `default`, `secondary`, `destructive`, `outline`, `ghost`  
**Розміри:** `sm`, `default`, `lg`

### 3. Карточка для блоків даних
```jsx
<Card>
  <CardHeader>
    <CardTitle>Інвентар</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Вміст карточки */}
  </CardContent>
</Card>
```

### 4. Форма с React Hook Form
```jsx
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

function DeviceForm() {
  const form = useForm()
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="deviceName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Назва пристрою</FormLabel>
              <FormControl>
                <Input placeholder="УЗД апарат" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
```

### 5. Таблиця для списків
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
      <TableHead>Назва</TableHead>
      <TableHead>Серійний номер</TableHead>
      <TableHead>Статус</TableHead>
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

## Додавання нових компонентів

Shadowcn реестр містить сотні компонентів. Щоб додати новий:

```bash
npm run add-component checkbox
npm run add-component progress
npm run add-component alert
```

Або прямо:
```bash
npx shadcn@latest add checkbox -y
```

Список доступних: https://ui.shadcn.com/docs/components/

---

## UI Pro Max Skill

### Призначение
Генерує рекомендації дизайн-систем на основі:
- Типу приложения (медичне)
- Інших параметрів (accessibility, контрастність)
- AI-аналізу лучших практик

### Як використовувати

1. **Отримати рекомендації для SIMDM:**
   ```bash
   npm run design-system -- --type healthcare
   ```

2. **Інтегрувати з Shadcn:**
   Вибрати з 161 кольорової палітри ту, що підходить медичному додатку, і оновити `components.json`

3. **Застосувати типографію:**
   З 57 пар шрифтів обрати дві для題問 та body text

---

## Інтеграція з существуючими компонентами

SIMDM вже має собственні компоненти:
- `frontend/src/components/Button.jsx`
- `frontend/src/components/Card.jsx`
- `frontend/src/components/Input.jsx`

**План переходу:**
1. **Фаза 1** (поточна): Обидва набори компонентів сосуществуют
2. **Фаза 2** (Менте, неделя 3): Замінити власні на shadcn у нових сторінках
3. **Фаза 3** (Менте, неделя 4): Мігрувати старі сторінки на shadcn

---

## Theming & Customization

### Текущий дизайн (база-nova)
- **Темные цвета:** Совместимы с существующей темой SIMDM
- **CSS переменные:** Могут быть переопределены в `design-system.css`

### Кастомизирать палітру
Создай перемінні в `design-system.css`:
```css
:root {
  --primary: #2563eb;
  --secondary: #64748b;
  --destructive: #ef4444;
}
```

---

## Возможные проблемы

### 1. TooltipProvider не импортируется
Если нужен компонент Tooltip в приложении (к примеру, для подказок):
```jsx
// main.jsx
import { TooltipProvider } from "@/components/ui/tooltip"

// Оберни весь контент
<TooltipProvider>
  <App />
</TooltipProvider>
```

### 2. Конфликты стилей
Если есть конфликты между Shadcn и существующей CSS:
- Проверь `design-system.css`
- Удали дублюючи утилиты
- Используй CSS specificity, если нужно переопределить

### 3. Bundle size
Текущий размер бандла: **828.90 kB (239.93 kB gzipped)**

Для оптимизации (если потребуется):
- Используй `npm run build` с флагом `--analyze`
- Включи dynamic imports для больших роутов

---

## Наступні кроки

1. **Фаза 3 Менте (2026-06-05):** Использовать Shadcn для новых компонентов форм
2. **Формы:** Device, Maintenance, Incident используют `shadcn/form`
3. **Таблиці:** Inventory, Consumables используют `shadcn/table`
4. **Дизайн-систем:** Запустити UI Pro Max Skill для медичной тематики

---

## Ссилки

- Shadcn/UI: https://ui.shadcn.com
- UI Pro Max Skill: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Radix UI (основа Shadcn): https://www.radix-ui.com
