import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardArrowDown } from '@mui/icons-material';

const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Tanlang',
  emptyText = 'Topilmadi',
  searchable = false,
  allowClear = true,
  clearLabel = 'Barchasi',
  disabled = false,
  size = 'sm',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const normalizedOptions = useMemo(() => {
    const mapped = options.map((option) => ({
      value: option.value ?? '',
      label: option.label ?? String(option.value ?? ''),
    }));
    if (!allowClear) return mapped;
    if (mapped.some((option) => option.value === '')) return mapped;
    return [{ value: '', label: clearLabel }, ...mapped];
  }, [options, allowClear, clearLabel]);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!searchable || !query) return normalizedOptions;
    return normalizedOptions.filter((option) => option.label.toLowerCase().includes(query));
  }, [normalizedOptions, search, searchable]);

  const selectedOption = useMemo(
    () => normalizedOptions.find((option) => String(option.value) === String(value ?? '')),
    [normalizedOptions, value]
  );

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

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const buttonPadding = size === 'md' ? 'py-3' : 'py-2';
  const displayLabel = selectedOption?.label || placeholder;
  const isPlaceholder = !selectedOption || selectedOption.value === '';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full rounded-xl border border-slate-200 px-3 ${buttonPadding} bg-slate-50 text-left text-sm disabled:opacity-60 flex items-center justify-between gap-2`}
      >
        <span className={`truncate ${isPlaceholder ? 'text-slate-400' : 'text-slate-800'}`}>
          {displayLabel}
        </span>
        <KeyboardArrowDown
          sx={{ fontSize: 18 }}
          className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-40 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
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
                const isActive = String(option.value) === String(value ?? '');
                const key = option.value === '' ? '__clear__' : String(option.value);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-3 py-2 text-left text-sm ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
