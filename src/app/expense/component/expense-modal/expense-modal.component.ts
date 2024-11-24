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
    this.initializeForm();
    this.loadAllCategories();
  }

  //Initialisiert
  private initializeForm(): void {
    this.expenseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      categoryId: [null], // Optional
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [formatISO(new Date(), { representation: 'date' }), Validators.required]
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

    const expense: ExpenseUpsertDto = {
      ...this.expenseForm.value,
      date: formatISO(new Date(this.expenseForm.value.date), { representation: 'date' })
    };

    console.log('API URL:', this.expenseService['baseUrl']); // Debugging der URL
    console.log('Payload:', expense); // Debugging des Payloads

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
