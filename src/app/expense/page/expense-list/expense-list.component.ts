import { Component, inject } from '@angular/core';
import { addMonths, set } from 'date-fns';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonMenuButton,
  IonNote,
  IonProgressBar,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ModalController
} from '@ionic/angular/standalone';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, alertCircleOutline, arrowBack, arrowForward, pricetag, search, swapVertical } from 'ionicons/icons';
import { CurrencyPipe, DatePipe } from '@angular/common';
import ExpenseModalComponent from '../../component/expense-modal/expense-modal.component';
import { Category, Expense, ExpenseCriteria } from '../../../shared/domain';
import { ExpenseService } from '../../Service/expense.service';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
import { CategoryService } from '../../../category/service/category.service';

interface ExpenseGroup {
  date: string;
  expenses: Expense[];
}

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,

    // Ionic
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonProgressBar,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonList,
    IonItemGroup,
    IonItemDivider,
    IonLabel,
    IonSkeletonText,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonFab,
    IonFabButton,
    IonFooter,
    IonButton,
    IonNote
  ]
})
export default class ExpenseListComponent implements OnInit {
  // DI
  private readonly modalCtrl = inject(ModalController);
  private readonly expenseService = inject(ExpenseService);
  private currentPage = 0;
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly categoryService = inject(CategoryService);
  readonly searchForm = this.formBuilder.group({
    search: [''], // Volltextsuche
    sort: ['date,DESC'], // Standard-Sortierung
    categoryIds: [[]] // Filter für Kategorien (Multiselect)
  });
  readonly sortOptions = [
    { label: 'Created at (newest first)', value: 'createdAt,DESC' },
    { label: 'Created at (oldest first)', value: 'createdAt,ASC' },
    { label: 'Date (newest first)', value: 'date,DESC' },
    { label: 'Date (oldest first)', value: 'date,ASC' },
    { label: 'Name (A-Z)', value: 'name,ASC' },
    { label: 'Name (Z-A)', value: 'name,DESC' }
  ];
  date = set(new Date(), { date: 1 });
  expenseGroups: ExpenseGroup[] | null = null; // Zum Speichern der gruppierten Ausgaben
  loading = false; // Ladezustand
  lastPageReached = false; // Status für unendliches Scrollen
  categories: Category[] = []; // Speichert die Kategorien

  constructor() {
    // Add all used Ionic icons
    addIcons({ swapVertical, pricetag, search, alertCircleOutline, add, arrowBack, arrowForward });
  }

  ngOnInit(): void {
    console.log('Initializing ExpenseListComponent...');
    this.loadCategories(); // Kategorien laden
    this.loadExpenses(); // Daten laden
    this.searchForm.valueChanges.subscribe(formValues => {
      console.log('Form values changed:', formValues); // Debugging-Ausgabe
      this.currentPage = 0; // Seite zurücksetzen
      this.expenseGroups = null; // Gruppen zurücksetzen
      this.lastPageReached = false; // Infinite Scroll zurücksetzen
      this.loadExpenses(); // Neue Daten laden
    });
  }

  private groupExpensesByDate(expenses: Expense[]): ExpenseGroup[] {
    console.log('Raw expenses:', expenses); // Debug-Ausgabe
    const grouped: { [key: string]: Expense[] } = {};
    expenses.forEach(expense => {
      if (!grouped[expense.date]) grouped[expense.date] = [];
      // Verhindere doppelte Einträge
      if (!grouped[expense.date].some(e => e.id === expense.id)) {
        grouped[expense.date].push(expense);
      }
    });

    console.log('Grouped expenses:', grouped); // Debug-Ausgabe
    return Object.keys(grouped).map(date => ({
      date,
      expenses: grouped[date]
    }));
  }

  private mergeExpenseGroups(existingGroups: ExpenseGroup[], newGroups: ExpenseGroup[]): ExpenseGroup[] {
    const mergedGroups = [...existingGroups];

    newGroups.forEach(newGroup => {
      const existingGroup = mergedGroups.find(group => group.date === newGroup.date);
      if (existingGroup) {
        existingGroup.expenses = [...existingGroup.expenses, ...newGroup.expenses];
      } else {
        mergedGroups.push(newGroup);
      }
    });

    return mergedGroups;
  }

  private loadExpenses(next: () => void = () => {}): void {
    const formValues = this.searchForm.value;
    const criteria: ExpenseCriteria = {
      yearMonth: `${this.date.getFullYear()}${(this.date.getMonth() + 1).toString().padStart(2, '0')}`,
      page: this.currentPage,
      size: 10,
      sort: formValues.sort || 'date,DESC',
      name: formValues.search?.trim(), // Volltextsuche
      categoryIds: formValues.categoryIds // Kategorien
    };
    console.log('Loading expenses with criteria:', criteria); // Debugging

    this.loading = true;

    this.expenseService.getExpenses(criteria).subscribe({
      next: expensePage => {
        const newGroups = this.groupExpensesByDate(expensePage.content);
        this.expenseGroups = this.mergeExpenseGroups(this.expenseGroups || [], newGroups);

        if (!expensePage.last && expensePage.content.length > 0 && this.expenseGroups.length < 10) {
          console.log('Not enough entries for scrolling. Loading next page...');
          this.currentPage++;
          this.loadExpenses(next); // Rekursiv weitere Seiten laden
        } else {
          this.lastPageReached = expensePage.last;
          next();
        }
      },
      error: err => {
        console.error('Failed to load expenses:', err);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  reloadExpenses(event?: CustomEvent): void {
    this.currentPage = 0; // Seitenzähler zurücksetzen
    this.expenseGroups = null; // Vorhandene Gruppen löschen
    this.lastPageReached = false; // Infinite Scroll zurücksetzen
    this.loadExpenses(() => {
      if (event) {
        void (event.target as HTMLIonRefresherElement).complete(); // Beendet die Refresher-Animation
      }
    });
  }

  private loadCategories(): void {
    this.categoryService.getAllCategories({ sort: 'name,asc' }).subscribe({
      next: categories => {
        this.categories = categories; // Speichert die geladenen Kategorien
        console.log('Loaded categories:', this.categories); // Debugging
      },
      error: error => console.error('Failed to load categories:', error)
    });
  }

  onScrollEnd(event: CustomEvent): void {
    console.log('onScrollEnd triggered. Current page:', this.currentPage);
    console.log('Last page reached status:', this.lastPageReached);
    if (this.lastPageReached) {
      (event.target as HTMLIonInfiniteScrollElement).complete(); // Beende den Infinite Scroll, wenn alle Daten geladen sind
      return;
    }

    const criteria: ExpenseCriteria = {
      yearMonth: `${this.date.getFullYear()}${(this.date.getMonth() + 1).toString().padStart(2, '0')}`,
      page: this.currentPage + 1, // Lade die nächste Seite
      size: 10,
      sort: 'date,DESC'
    };

    console.log('Loading next page with criteria:', criteria); // Debug-Ausgabe

    this.expenseService.getExpenses(criteria).subscribe({
      next: expensePage => {
        console.log('Loaded expenses for next page:', expensePage.content); // Debug-Ausgabe

        const newGroups = this.groupExpensesByDate(expensePage.content);
        this.expenseGroups = this.mergeExpenseGroups(this.expenseGroups || [], newGroups);

        this.lastPageReached = expensePage.last; // Aktualisiere den Status für die letzte Seite
        this.currentPage++; // Erhöhe die Seitenzahl
        (event.target as HTMLIonInfiniteScrollElement).complete();
      },
      error: err => {
        console.error('Failed to load more expenses:', err);
        (event.target as HTMLIonInfiniteScrollElement).complete();
      }
    });
  }

  addMonths = (number: number): void => {
    this.date = addMonths(this.date, number); // Monat ändern
    console.log('Updated date:', this.date); // Debug-Ausgabe

    this.expenseGroups = null; // Alte Gruppen zurücksetzen
    this.lastPageReached = false; // Infinite Scroll zurücksetzen
    this.currentPage = 0; // Seitenzähler zurücksetzen

    this.loadExpenses(); // Daten für den neuen Monat laden
  };

  async openModal(expense?: Expense) {
    const formattedDate = this.date.toISOString().split('T')[0];
    console.log('Opening modal with date:', formattedDate); // Debugging-Ausgabe

    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
      componentProps: {
        date: formattedDate,
        expense
      }
    });

    await modal.present();

    const { role } = await modal.onWillDismiss();
    if (['save', 'delete'].includes(role || '')) {
      this.reloadExpenses();
    }
  }
  async openEditModal(expense: Expense): Promise<void> {
    console.log('Opening Edit Modal for expense:', expense); // Debugging
    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
      componentProps: {
        expense: expense, // Übergebe die ausgewählte Ausgabe
        date: expense.date // Optional: Aktuelles Datum setzen
      }
    });

    await modal.present();

    const { role } = await modal.onWillDismiss();
    if (role === 'save' || role === 'delete') {
      this.reloadExpenses(); // Liste nach Änderungen neu laden
    }
  }
}
