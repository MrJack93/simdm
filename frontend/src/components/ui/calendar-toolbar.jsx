import { ChevronLeft, ChevronRight, Search, Plus } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export function CalendarToolBar({
  onPrevious,
  onNext,
  onViewChange,
  currentView = 'month',
  currentDate = new Date(),
  onAddEvent,
  onSearch,
  isMobile = false,
  views = ['day', 'week', 'month', 'year'],
}) {
  const dateFormat = new Intl.DateTimeFormat('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: isMobile ? undefined : 'numeric',
  }).format(currentDate);

  return (
    <div className="rbc-toolbar">
      {/* Left Section: Navigation & Date */}
      <div className="flex items-center gap-4">
        <button
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          onClick={onPrevious}
          aria-label="Luna anterioară"
          title="Trecere la luna anterioară"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="font-medium text-sm min-w-max">
          {dateFormat}
        </span>

        <button
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          onClick={onNext}
          aria-label="Luna următoare"
          title="Trecere la luna următoare"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Center Section: View Selector */}
      <div className="flex gap-2 items-center">
        {!isMobile && (
          <div className="border border-accent rounded px-2 py-1 flex gap-1">
            {views.map((view) => (
              <button
                key={view}
                className={cn(
                  'text-xs font-medium px-2 py-1 rounded transition-colors',
                  currentView === view
                    ? 'bg-accent text-white'
                    : 'text-accent hover:bg-accent/10'
                )}
                onClick={() => onViewChange?.(view)}
                aria-label={`Schimbă la ${view}`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        )}

        {isMobile && (
          <select
            className="text-xs font-medium px-2 py-1 rounded border border-accent"
            value={currentView}
            onChange={(e) => onViewChange?.(e.target.value)}
          >
            {views.map((view) => (
              <option key={view} value={view}>
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Right Section: Actions */}
      <div className="flex gap-2 items-center">
        <button
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          onClick={onSearch}
          aria-label="Caută"
          title="Deschide căutarea"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded font-medium text-sm transition-colors',
            'bg-accent text-white hover:bg-accent/90'
          )}
          onClick={onAddEvent}
          aria-label="Adaugă eveniment"
          title="Creează eveniment nou"
        >
          {!isMobile && 'Adaugă eveniment'}
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function CalendarViewToggle({ currentView, onViewChange, isMobile = false }) {
  const views = ['day', 'week', 'month', 'year'];

  return (
    <div className="flex gap-1 border border-accent rounded p-1">
      {views.map((view) => (
        <button
          key={view}
          className={cn(
            'text-xs font-medium px-3 py-1 rounded transition-colors',
            currentView === view
              ? 'bg-accent text-white'
              : 'text-accent hover:bg-accent/10'
          )}
          onClick={() => onViewChange?.(view)}
          aria-label={`Schimbă la ${view}`}
        >
          {isMobile ? view.charAt(0).toUpperCase() : view.charAt(0).toUpperCase() + view.slice(1)}
        </button>
      ))}
    </div>
  );
}
