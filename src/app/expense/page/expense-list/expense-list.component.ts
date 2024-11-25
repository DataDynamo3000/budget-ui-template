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
import { ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, alertCircleOutline, arrowBack, arrowForward, pricetag, search, swapVertical } from 'ionicons/icons';
import { CurrencyPipe, DatePipe } from '@angular/common';
import ExpenseModalComponent from '../../component/expense-modal/expense-modal.component';
import { Expense, ExpenseCriteria } from '../../../shared/domain';
import { ExpenseService } from '../../Service/expense.service';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';

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

  date = set(new Date(), { date: 1 });
  expenseGroups: ExpenseGroup[] | null = null; // Zum Speichern der gruppierten Ausgaben
  loading = false; // Ladezustand
  lastPageReached = false; // Status für unendliches Scrollen

  constructor() {
    // Add all used Ionic icons
    addIcons({ swapVertical, pricetag, search, alertCircleOutline, add, arrowBack, arrowForward });
  }

  ngOnInit(): void {
    console.log('Initializing ExpenseListComponent...');
    this.loadExpenses(); // Daten beim Start der Komponente laden
  }

  private groupExpensesByDate(expenses: Expense[]): ExpenseGroup[] {
    console.log('Raw expenses:', expenses); // Debug-Ausgabe
    const grouped: { [key: string]: Expense[] } = {};
    expenses.forEach(expense => {
      if (!grouped[expense.date]) grouped[expense.date] = [];
      grouped[expense.date].push(expense);
    });

    console.log('Grouped expenses:', grouped); // Debug-Ausgabe
    return Object.keys(grouped).map(date => ({
      date,
      expenses: grouped[date]
    }));
  }

  private loadExpenses(next: () => void = () => {}): void {
    const criteria: ExpenseCriteria = {
      yearMonth: `${this.date.getFullYear()}${(this.date.getMonth() + 1).toString().padStart(2, '0')}`,
      page: 0,
      size: 0,
      sort: 'date,DESC'
    };
    console.log('Loading expenses for yearMonth:', criteria.yearMonth); // Debug-Ausgabe
    this.loading = true;

    this.expenseService.getExpenses(criteria).subscribe({
      next: expensePage => {
        console.log('Loaded expenses from API:', expensePage.content); // Debug-Ausgabe
        this.lastPageReached = expensePage.last;
        this.expenseGroups = this.groupExpensesByDate(expensePage.content);
        next();
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
    this.loadExpenses(() => {
      if (event) {
        void (event.target as HTMLIonRefresherElement).complete(); // Beendet die Refresher-Animation
      }
    });
  }

  onScrollEnd(event: CustomEvent): void {
    if (!this.lastPageReached) {
      // Ermittle die aktuelle Seite basierend auf der Anzahl der geladenen Einträge
      const currentPage = Math.floor(
        (this.expenseGroups?.map((group: ExpenseGroup) => group.expenses).reduce((acc, expenses) => acc.concat(expenses), []).length || 0) /
          10
      );
      const criteria: ExpenseCriteria = {
        yearMonth: `${this.date.getFullYear()}${(this.date.getMonth() + 1).toString().padStart(2, '0')}`,
        page: currentPage,
        size: 10,
        sort: 'date,DESC'
      };

      this.expenseService.getExpenses(criteria).subscribe({
        next: expensePage => {
          const newGroups = this.groupExpensesByDate(expensePage.content);
          this.expenseGroups = [...(this.expenseGroups || []), ...newGroups];
          this.lastPageReached = expensePage.last;

          (event.target as HTMLIonInfiniteScrollElement).complete();
        },
        error: err => {
          console.error('Failed to load more expenses:', err);
          (event.target as HTMLIonInfiniteScrollElement).complete();
        }
      });
    } else {
      (event.target as HTMLIonInfiniteScrollElement).complete();
    }
  }

  addMonths = (number: number): void => {
    this.date = addMonths(this.date, number); // Monat ändern
    console.log('Updated date:', this.date); // Debug-Ausgabe
    this.loadExpenses(); // Daten für den neuen Monat laden
  };

  async openModal() {
    const formattedDate = this.date.toISOString().split('T')[0];
    console.log('Opening modal with date:', formattedDate); // Debugging-Ausgabe

    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
      componentProps: {
        date: formattedDate
      }
    });

    await modal.present();

    const { role } = await modal.onWillDismiss();
    if (role === 'save') {
      this.reloadExpenses();
    }
  }
}
