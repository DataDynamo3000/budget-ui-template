import { Component, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonNote,
  IonProgressBar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ModalController
} from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, calendar, cash, close, pricetag, save, text, trash } from 'ionicons/icons';
import CategoryModalComponent from '../../../category/component/category-modal/category-modal.component';
import { Category, ExpenseUpsertDto } from '../../../shared/domain';
import { ExpenseService } from '../../Service/expense.service';
import { CategoryService } from '../../../category/service/category.service';
import { ToastService } from '../../../shared/toast.service';
import { formatISO } from 'date-fns';
import { CommonModule } from '@angular/common';
import { EventEmitter, Output } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    // Ionic
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonChip,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonNote,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
    IonFab,
    IonFabButton,
    IonProgressBar
  ]
})
export default class ExpenseModalComponent {
  @Input() date!: string;
  @Output() expenseSaved = new EventEmitter<void>();
  expenseForm!: FormGroup;
  categories: Category[] = [];
  isLoading = false;
  // DI
  private readonly modalCtrl = inject(ModalController);
  private readonly fb = inject(FormBuilder);
  private readonly expenseService = inject(ExpenseService);
  private readonly categoryService = inject(CategoryService);
  private readonly toastService = inject(ToastService);

  constructor() {
    // Add all used Ionic icons
    addIcons({ close, save, text, pricetag, add, cash, calendar, trash });
    this.loadAllCategories();
  }

  ngOnInit() {
    console.log('Received date in modal:', this.date); // Debugging-Ausgabe
    this.initializeForm();
  }

  //Initialisiert
  private initializeForm(): void {
    const defaultDate = this.date || formatISO(new Date(), { representation: 'date' });
    console.log('Initializing form with default date:', defaultDate); // Debugging

    this.expenseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      categoryId: [null],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      date: [defaultDate, Validators.required] // Setze das Datum im Formular
    });
  }

  //ladet alle Kategorien
  private loadAllCategories(): void {
    this.categoryService.getAllCategories({ sort: 'name,asc' }).subscribe({
      next: categories => (this.categories = categories),
      error: error => this.toastService.displayErrorToast('Failed to load categories.', error)
    });
  }

  // Speicher
  save(): void {
    if (this.expenseForm.invalid) {
      this.toastService.displayErrorToast('Please fill out the form correctly.');
      return;
    }

    this.isLoading = true;

    const selectedCategory = this.categories.find(category => category.id === this.expenseForm.value.categoryId);

    const expense: ExpenseUpsertDto = {
      ...this.expenseForm.value,
      date: this.expenseForm.value.date,
      category: selectedCategory
    };

    console.log('Saving expense with payload:', expense); // Debugging-Ausgabe

    this.expenseService.upsertExpense(expense).subscribe({
      next: () => {
        this.toastService.displaySuccessToast('Expense saved successfully.');
        this.expenseSaved.emit();
        this.isLoading = false;
        this.modalCtrl.dismiss(null, 'save');
      },
      error: error => {
        this.toastService.displayErrorToast('Failed to save the expense.', error);
        this.isLoading = false;
      }
    });
  }

  // Abbrechen
  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async showCategoryModal(): Promise<void> {
    const categoryModal = await this.modalCtrl.create({
      component: CategoryModalComponent
    });
    await categoryModal.present();
    const { role } = await categoryModal.onWillDismiss();
    if (role === 'save') {
      this.loadAllCategories();
    }
  }
}
