import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckBox, CheckBoxOutlineBlank, Close, KeyboardArrowDown } from '@mui/icons-material';

const MultiSelect = ({
  value = [],
  onChange,
  options = [],
  placeholder = 'Tanlang',
  emptyText = 'Topilmadi',
  searchable = true,
  disabled = false,
  size = 'sm',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const selectedValues = useMemo(
    () => (Array.isArray(value) ? value.map(String) : []),
    [value]
  );

  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!searchable || !query) return options;
    return options.filter((option) =>
      String(option.label ?? '').toLowerCase().includes(query)
    );
  }, [options, search, searchable]);

  const selectedLabels = useMemo(() => {
    const map = new Map(options.map((opt) => [String(opt.value), opt.label]));
    return selectedValues.map((id) => map.get(id) || id).filter(Boolean);
  }, [options, selectedValues]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const toggleValue = (optionValue) => {
    const next = String(optionValue);
    const exists = selectedSet.has(next);
    const updated = exists
      ? selectedValues.filter((item) => item !== next)
      : [...selectedValues, next];
    onChange(updated);
  };

  const clearAll = (event) => {
    event.stopPropagation();
    onChange([]);
  };

  const buttonPadding = size === 'md' ? 'py-3' : 'py-2';
  const count = selectedValues.length;
  const displayLabel =
    count === 0
      ? placeholder
      : count === 1
        ? selectedLabels[0]
        : `${count} ta tanlandi`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full rounded-xl border border-slate-200 px-3 ${buttonPadding} bg-slate-50 text-left text-sm disabled:opacity-60 flex items-center justify-between gap-2`}
      >
        <span className={`truncate ${count === 0 ? 'text-slate-400' : 'text-slate-800'}`}>
          {displayLabel}
        </span>
        <span className="inline-flex items-center gap-1 shrink-0">
          {count > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={clearAll}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') clearAll(e);
              }}
              className="p-0.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              title="Tozalash"
            >
              <Close sx={{ fontSize: 16 }} />
            </span>
          )}
          <KeyboardArrowDown
            sx={{ fontSize: 18 }}
            className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-40 mt-2 w-full min-w-[16rem] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-slate-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Qidirish..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto py-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-500">{emptyText}</p>
            ) : (
              filteredOptions.map((option) => {
                const optionValue = String(option.value ?? '');
                const isActive = selectedSet.has(optionValue);
                return (
                  <button
                    key={optionValue || '__empty__'}
                    type="button"
                    onClick={() => toggleValue(optionValue)}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isActive ? (
                      <CheckBox sx={{ fontSize: 18 }} className="shrink-0 text-indigo-600" />
                    ) : (
                      <CheckBoxOutlineBlank sx={{ fontSize: 18 }} className="shrink-0 text-slate-400" />
                    )}
                    <span className="block truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
          {count > 0 && (
            <div className="border-t border-slate-100 px-3 py-2 flex flex-wrap gap-1.5">
              {selectedLabels.slice(0, 6).map((label) => (
                <span
                  key={label}
                  className="inline-flex max-w-full truncate px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs border border-indigo-100"
                >
                  {label}
                </span>
              ))}
              {selectedLabels.length > 6 && (
                <span className="text-xs text-slate-500 self-center">
                  +{selectedLabels.length - 6}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
