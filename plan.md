# План улучшений для one_breath

## Общая оценка: 8/10

Приложение в хорошем состоянии, безопасно и готово к использованию. Ниже приведён план улучшений для повышения надёжности, UX и качества кода.

---

## Фаза 1: Критичные исправления (1-2 часа)

### 1.1 Очистка структуры проекта
**Приоритет: ВЫСОКИЙ**

**Проблема:**
- Пустые директории `src/lib/api/`, `src/server/` (содержит подпапки db, http, routes) засоряют структуру
- Вводят в заблуждение о существующей функциональности

**Решение:**
```bash
rm -rf src/lib/api
rm -rf src/server
```

**Файлы для изменения:**
- Удаление директорий

**Оценка времени:** 5 минут

---

### 1.2 Сохранение черновика записи
**Приоритет: ВЫСОКИЙ**

**Проблема:**
- При перезагрузке страницы Today пользователь теряет набранный текст
- Особенно критично на мобильных устройствах
- Локация: `src/pages/Today/index.tsx:17`

**Решение:**
1. Сохранять `content` в `sessionStorage` при каждом изменении
2. Восстанавливать черновик при загрузке компонента
3. Показывать индикатор "Черновик восстановлен"
4. Очищать черновик после успешного сохранения

**Файлы для изменения:**
- `src/pages/Today/index.tsx`

**Новый функционал:**
```typescript
// Добавить в Today компонент
const DRAFT_KEY = 'one-breath-today-draft';

useEffect(() => {
  // Восстановление черновика при загрузке
  const savedDraft = sessionStorage.getItem(DRAFT_KEY);
  if (savedDraft) {
    setContent(savedDraft);
    // Опционально: показать toast "Draft restored"
  }
}, []);

useEffect(() => {
  // Автосохранение черновика
  if (content.trim()) {
    sessionStorage.setItem(DRAFT_KEY, content);
  } else {
    sessionStorage.removeItem(DRAFT_KEY);
  }
}, [content]);

// После успешного сохранения
sessionStorage.removeItem(DRAFT_KEY);
```

**Оценка времени:** 30 минут

---

### 1.3 Улучшенная валидация Entry
**Приоритет: ВЫСОКИЙ**

**Проблема:**
- Слабая валидация в `isValidEntry()` (строки 32-48)
- Не проверяется формат `ymd` (может быть "invalid-date")
- Не валидируется корректность ISO даты в `createdAt`
- Нет проверки длины `content` при чтении

**Решение:**
Улучшить функцию `isValidEntry`:

**Файлы для изменения:**
- `src/lib/storage/index.ts`

**Новая валидация:**
```typescript
const isValidYMD = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
};

const isValidISODate = (value: string): boolean => {
  try {
    const date = new Date(value);
    return !isNaN(date.getTime()) && date.toISOString() === value;
  } catch {
    return false;
  }
};

const isValidEntry = (value: unknown): value is Entry => {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.ymd === "string" &&
    isValidYMD(record.ymd) &&
    typeof record.content === "string" &&
    record.content.length <= MAX_THOUGHT_LENGTH &&
    typeof record.createdAt === "string" &&
    isValidISODate(record.createdAt) &&
    (record.replacedAt === undefined ||
      record.replacedAt === null ||
      (typeof record.replacedAt === "string" && isValidISODate(record.replacedAt)))
  );
};
```

**Оценка времени:** 30 минут

---

## Фаза 2: Надёжность и стабильность (3-4 часа)

### 2.1 Версионирование схемы данных
**Приоритет: ВЫСОКИЙ**

**Проблема:**
- Нет версионирования формата хранилища
- При изменении структуры Entry пользователи потеряют все данные
- Локация: `src/lib/storage/index.ts:5`

**Решение:**
1. Добавить поле `version` в StoredState
2. Создать migration utilities
3. Проверять версию при загрузке и мигрировать при необходимости

**Файлы для изменения:**
- `src/lib/storage/index.ts`
- `src/lib/storage/types.ts`
- Новый файл: `src/lib/storage/migrations.ts`

**Новая структура:**
```typescript
// types.ts
type StoredState = {
  version: number;
  entries: Entry[];
};

const CURRENT_VERSION = 1;
const STORAGE_KEY = "one-breath::entries::v2"; // Новый ключ

// migrations.ts
type Migration = {
  from: number;
  to: number;
  migrate: (data: any) => StoredState;
};

const migrations: Migration[] = [
  {
    from: 0, // старый формат без версии
    to: 1,
    migrate: (data) => ({
      version: 1,
      entries: Array.isArray(data.entries) ? data.entries : []
    })
  }
];

function migrateData(data: any): StoredState {
  let current = data;
  const currentVersion = data.version || 0;

  for (const migration of migrations) {
    if (currentVersion >= migration.to) continue;
    if (currentVersion === migration.from) {
      current = migration.migrate(current);
    }
  }

  return current;
}

// В readState() добавить проверку старого ключа
const oldData = storage.getItem("one-breath::entries::v1");
if (oldData && !storage.getItem(STORAGE_KEY)) {
  // Мигрировать из v1 в v2
  const parsed = JSON.parse(oldData);
  const migrated = migrateData(parsed);
  storage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  storage.removeItem("one-breath::entries::v1");
}
```

**Оценка времени:** 1.5 часа

---

### 2.2 Унифицированный Storage Adapter
**Приоритет: СРЕДНИЙ**

**Проблема:**
- 3 разных файла используют localStorage по-разному:
  - `src/lib/storage/index.ts`
  - `src/i18n/index.ts` (строка 25)
  - `src/app/initTimezone.ts` (строки 18-41)
- Разная обработка ошибок

**Решение:**
Создать единый адаптер для работы с localStorage

**Новый файл:**
- `src/lib/storageAdapter.ts`

**Новый код:**
```typescript
type StorageAdapter = {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): boolean;
  remove(key: string): void;
  has(key: string): boolean;
};

const createStorageAdapter = (): StorageAdapter => {
  let storage: Storage | null = null;
  let tested = false;

  const getStorage = (): Storage | null => {
    if (tested) return storage;

    if (typeof window === "undefined" || !("localStorage" in window)) {
      storage = null;
      tested = true;
      return storage;
    }

    try {
      const test = "__storage_test__";
      window.localStorage.setItem(test, "ok");
      window.localStorage.removeItem(test);
      storage = window.localStorage;
    } catch {
      storage = null;
    }

    tested = true;
    return storage;
  };

  return {
    get<T>(key: string): T | null {
      const store = getStorage();
      if (!store) return null;

      try {
        const raw = store.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },

    set<T>(key: string, value: T): boolean {
      const store = getStorage();
      if (!store) return false;

      try {
        store.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },

    remove(key: string): void {
      const store = getStorage();
      if (!store) return;

      try {
        store.removeItem(key);
      } catch {
        // ignore
      }
    },

    has(key: string): boolean {
      const store = getStorage();
      if (!store) return false;

      try {
        return store.getItem(key) !== null;
      } catch {
        return false;
      }
    }
  };
};

export const storageAdapter = createStorageAdapter();
```

**Файлы для изменения:**
- `src/lib/storage/index.ts` - использовать storageAdapter
- `src/i18n/index.ts` - использовать storageAdapter
- `src/app/initTimezone.ts` - использовать storageAdapter

**Оценка времени:** 1 час

---

### 2.3 Retry механизм для загрузки
**Приоритет: СРЕДНИЙ**

**Проблема:**
- Нет повторных попыток при временных ошибках
- Если localStorage временно недоступен, данные не загрузятся
- Локация: `src/hooks/useEntries.ts`

**Решение:**
Добавить retry с exponential backoff

**Файлы для изменения:**
- `src/hooks/useEntries.ts`
- Новый файл: `src/lib/retry.ts`

**Новая утилита:**
```typescript
// src/lib/retry.ts
type RetryOptions = {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 100,
    maxDelay = 2000,
    backoffFactor = 2
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError!;
}

// В useEntries.ts использовать:
activeRequest = withRetry(
  () => storage.getAll(),
  { maxAttempts: 3, initialDelay: 100 }
)
```

**Оценка времени:** 45 минут

---

## Фаза 3: Оптимизация производительности (2-3 часа)

### 3.1 Миграция на Context API
**Приоритет: СРЕДНИЙ**

**Проблема:**
- Module-level переменные в `useEntries.ts` (строки 12-22)
- Потенциальная утечка памяти в subscribers Set
- Не следует React/Preact паттернам

**Решение:**
Полностью перенести логику в EntriesContext

**Файлы для изменения:**
- `src/context/EntriesContext.tsx` - добавить всю логику из useEntries
- `src/hooks/useEntries.ts` - оставить только как хук для доступа к контексту

**Новая структура:**
```typescript
// EntriesContext.tsx
const EntriesContext = createContext<{
  entries: Entry[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<Entry[]>;
} | null>(null);

export function EntriesProvider({ children }) {
  const [state, setState] = useState({
    entries: [],
    loading: false,
    error: null,
    cache: null as Entry[] | null,
    activeRequest: null as Promise<Entry[]> | null
  });

  const loadEntries = useCallback(async (force = false) => {
    // Вся логика из useEntries.ts сюда
  }, []);

  // ...

  return (
    <EntriesContext.Provider value={{ entries, loading, error, refresh }}>
      {children}
    </EntriesContext.Provider>
  );
}

// useEntries.ts
export function useEntries() {
  const context = useContext(EntriesContext);
  if (!context) {
    throw new Error('useEntries must be used within EntriesProvider');
  }
  return context;
}
```

**Оценка времени:** 1 час

---

### 3.2 Индексирование для быстрого поиска
**Приоритет: СРЕДНИЙ**

**Проблема:**
- O(n) поиск при каждом вызове `storage.get(ymd)`
- При 1000+ записях будет заметное замедление
- Локация: `src/lib/storage/index.ts:186-198`

**Решение:**
Создать Map индекс при загрузке данных

**Файлы для изменения:**
- `src/lib/storage/index.ts`

**Новая структура:**
```typescript
// Добавить кеширование индекса
let entriesCache: Entry[] | null = null;
let ymdIndex: Map<string, Entry[]> | null = null;

function buildIndex(entries: Entry[]): Map<string, Entry[]> {
  const index = new Map<string, Entry[]>();

  for (const entry of entries) {
    const existing = index.get(entry.ymd) || [];
    existing.push(entry);
    index.set(entry.ymd, existing);
  }

  return index;
}

function invalidateCache() {
  entriesCache = null;
  ymdIndex = null;
}

const storage = {
  async get(ymd) {
    const { entries } = readState();

    // Построить индекс если нужно
    if (!ymdIndex || entriesCache !== entries) {
      ymdIndex = buildIndex(entries);
      entriesCache = entries;
    }

    // O(1) lookup
    const matches = ymdIndex.get(ymd) || [];
    const activeEntries = matches.filter(e => !e.replacedAt);

    if (activeEntries.length === 0) return null;

    const [latest] = sortEntriesForList(activeEntries);
    return latest ? cloneEntry(latest) : null;
  },

  async put(entry) {
    validateEntry(entry);
    invalidateCache(); // Сбросить кеш
    // ... остальное
  },

  // То же для replace, admin.writeRecord, admin.deleteRecord, admin.clear
};
```

**Оценка времени:** 45 минут

---

### 3.3 Оптимизация ре-рендеров при смене языка
**Приоритет: НИЗКИЙ**

**Проблема:**
- Каждый компонент с `useTranslation()` создаёт свой subscriber
- При смене языка все компоненты ре-рендерятся
- Локация: `src/hooks/useTranslation.ts`

**Решение:**
Использовать мемоизацию или Preact Signals

**Файлы для изменения:**
- `src/hooks/useTranslation.ts`

**Оптимизация:**
```typescript
export function useTranslation() {
  const [language, setLanguage] = useState(getCurrentLanguage());

  useEffect(() => {
    const unsubscribe = subscribeToLanguageChange(() => {
      setLanguage(getCurrentLanguage());
    });
    return unsubscribe;
  }, []);

  // Мемоизировать функцию перевода
  const t = useCallback((key: TranslationKey): string => {
    return getTranslation(key);
  }, [language]); // Зависимость от language

  return { t, language };
}
```

**Оценка времени:** 30 минут

---

## Фаза 4: Тестирование и покрытие (4-6 часов)

### 4.1 Unit-тесты для компонентов
**Приоритет: СРЕДНИЙ**

**Проблема:**
- Статистика: 37 файлов кода, только 2 теста
- Нет тестов для UI компонентов
- Нет тестов для хуков

**Решение:**
Добавить тесты для критичных компонентов

**Новые файлы:**
- `src/pages/Today/Today.test.tsx`
- `src/pages/History/History.test.tsx`
- `src/pages/Export/Export.test.tsx`
- `src/hooks/useEntries.test.ts`
- `src/hooks/useTranslation.test.ts`

**Примерный тест:**
```typescript
// Today.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/preact';
import { Today } from './index';

describe('Today page', () => {
  it('should save entry on button click', async () => {
    const { getByRole, getByText } = render(<Today />);

    const textarea = getByRole('textbox');
    fireEvent.input(textarea, { target: { value: 'Test thought' } });

    const saveButton = getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(textarea.value).toBe(''); // Cleared after save
    });
  });

  it('should show character count', () => {
    const { getByRole, getByText } = render(<Today />);

    const textarea = getByRole('textbox');
    fireEvent.input(textarea, { target: { value: 'Hello' } });

    expect(getByText('5 / 280')).toBeInTheDocument();
  });

  it('should restore draft from sessionStorage', () => {
    sessionStorage.setItem('one-breath-today-draft', 'Saved draft');

    const { getByRole } = render(<Today />);
    const textarea = getByRole('textbox') as HTMLTextAreaElement;

    expect(textarea.value).toBe('Saved draft');
  });
});
```

**Оценка времени:** 3 часа

---

### 4.2 E2E тесты с Playwright
**Приоритет: НИЗКИЙ**

**Проблема:**
- Playwright установлен, но не используется
- Нет тестов для основных user flows

**Решение:**
Создать E2E тесты для критичных потоков

**Новые файлы:**
- `tests/e2e/today.spec.ts`
- `tests/e2e/history.spec.ts`
- `tests/e2e/export.spec.ts`
- `playwright.config.ts`

**Примерный E2E тест:**
```typescript
// tests/e2e/today.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Today page flow', () => {
  test('user can create a new entry', async ({ page }) => {
    await page.goto('http://localhost:4173/#/');

    // Заполнить форму
    await page.fill('textarea', 'My first thought');
    await page.click('button:has-text("Save")');

    // Проверить, что форма очистилась
    await expect(page.locator('textarea')).toHaveValue('');

    // Перейти в историю
    await page.click('a:has-text("History")');

    // Проверить, что запись появилась
    await expect(page.locator('text=My first thought')).toBeVisible();
  });

  test('user can replace existing entry', async ({ page }) => {
    await page.goto('http://localhost:4173/#/');

    // Создать первую запись
    await page.fill('textarea', 'First thought');
    await page.click('button:has-text("Save")');

    // Создать вторую (должен появиться диалог замены)
    await page.fill('textarea', 'Second thought');
    await page.click('button:has-text("Save")');

    // Подтвердить замену
    await expect(page.locator('text=Replace Thought')).toBeVisible();
    await page.click('button:has-text("Replace")');

    // Проверить в истории
    await page.click('a:has-text("History")');
    await expect(page.locator('text=Second thought')).toBeVisible();
    await expect(page.locator('text=First thought')).not.toBeVisible();
  });
});
```

**Конфиг Playwright:**
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'bun run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
```

**Оценка времени:** 2 часа

---

### 4.3 Coverage reports
**Приоритет: НИЗКИЙ**

**Решение:**
Настроить coverage для тестов

**Файлы для изменения:**
- `package.json` - добавить скрипты
- `bunfig.toml` (создать новый)

**Новые скрипты:**
```json
{
  "scripts": {
    "test": "bun test",
    "test:coverage": "bun test --coverage",
    "test:watch": "bun test --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

**Оценка времени:** 30 минут

---

## Дополнительные улучшения (опционально)

### Улучшение UX

1. **Toast notifications**
   - Показывать успешное сохранение
   - Уведомление о восстановлении черновика
   - Библиотека: можно использовать `sonner` или написать свой

2. **Keyboard shortcuts**
   - Уже есть Cmd/Ctrl+Enter для сохранения
   - Добавить Esc для закрытия модалок
   - Navigation shortcuts (1, 2, 3 для переключения вкладок)

3. **Loading states**
   - Skeleton loaders вместо простого "Loading..."
   - Progressive loading для истории

4. **Offline support**
   - Service Worker для работы оффлайн
   - Manifest.json для PWA

### Улучшение Developer Experience

1. **Pre-commit hooks**
   - Husky + lint-staged
   - Автоматический запуск `bun run check` перед коммитом

2. **Storybook для компонентов**
   - Изолированная разработка UI компонентов
   - Визуальное тестирование

3. **Bundle analyzer**
   - Проверка размера бандла
   - Поиск дублирующихся зависимостей

---

## Суммарное время выполнения

| Фаза | Время |
|------|-------|
| Фаза 1: Критичные | 1-2 часа |
| Фаза 2: Надёжность | 3-4 часа |
| Фаза 3: Оптимизация | 2-3 часа |
| Фаза 4: Тестирование | 4-6 часов |
| **Итого:** | **10-15 часов** |

---

## Рекомендации по приоритизации

**Если времени мало (2-3 часа):**
- Выполнить только Фазу 1 (критичные исправления)

**Если есть день (6-8 часов):**
- Фаза 1 + Фаза 2 (надёжность)

**Для полного улучшения (2 недели):**
- Все 4 фазы + дополнительные улучшения

---

## Заключение

Приложение уже находится в хорошем состоянии и безопасно для использования. Все предложенные улучшения направлены на:
- Повышение надёжности хранения данных
- Улучшение пользовательского опыта
- Повышение качества кода и покрытия тестами
- Оптимизацию производительности

Критических багов или проблем безопасности **не обнаружено**.
