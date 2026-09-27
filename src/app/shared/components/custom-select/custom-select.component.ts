import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  signal,
  computed,
  ElementRef,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface SelectOption<T = any> {
  value: T;
  label: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  badgeColor?: 'blue' | 'gold' | 'green' | 'red' | 'gray';
  disabled?: boolean;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-select.component.html',
  styleUrl: './custom-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true,
    },
  ],
})
export class CustomSelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Selecciona una opción...';
  @Input() label?: string;
  @Input() required = false;
  @Input() disabled = false;
  @Input() clearable = false;
  @Input() searchable = true;
  @Input() searchPlaceholder = 'Buscar...';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  @Output() selectionChange = new EventEmitter<any>();

  isOpen = signal<boolean>(false);
  selectedValue = signal<any>(null);
  searchTerm = signal<string>('');
  highlightedIndex = signal<number>(-1);

  constructor(private elementRef: ElementRef) {}

  // ControlValueAccessor methods
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(val: any): void {
    this.selectedValue.set(val);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Filtered Options
  filteredOptions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.options;
    return this.options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        (opt.subtitle && opt.subtitle.toLowerCase().includes(term)) ||
        (opt.badge && opt.badge.toLowerCase().includes(term))
    );
  });

  // Selected Option Object
  selectedOption = computed(() => {
    const val = this.selectedValue();
    if (val === null || val === undefined || val === '') return null;
    return this.options.find((opt) => opt.value === val) || null;
  });

  toggleDropdown(event?: MouseEvent): void {
    if (this.disabled) return;
    if (event) event.stopPropagation();

    const nextState = !this.isOpen();
    this.isOpen.set(nextState);
    if (nextState) {
      this.searchTerm.set('');
      this.highlightedIndex.set(-1);
    } else {
      this.onTouched();
    }
  }

  selectOption(opt: SelectOption, event?: MouseEvent): void {
    if (opt.disabled) return;
    if (event) event.stopPropagation();

    this.selectedValue.set(opt.value);
    this.onChange(opt.value);
    this.selectionChange.emit(opt.value);
    this.isOpen.set(false);
    this.searchTerm.set('');
    this.onTouched();
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled) return;
    this.selectedValue.set(null);
    this.onChange(null);
    this.selectionChange.emit(null);
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isOpen()) {
        this.isOpen.set(false);
        this.onTouched();
      }
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) return;

    const list = this.filteredOptions();

    if (!this.isOpen()) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.toggleDropdown();
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.isOpen.set(false);
      this.onTouched();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIdx = (this.highlightedIndex() + 1) % list.length;
      this.highlightedIndex.set(nextIdx);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIdx = (this.highlightedIndex() - 1 + list.length) % list.length;
      this.highlightedIndex.set(prevIdx);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.highlightedIndex();
      if (idx >= 0 && idx < list.length) {
        this.selectOption(list[idx]);
      }
    }
  }
}
