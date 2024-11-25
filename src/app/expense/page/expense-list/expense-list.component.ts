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

interface ExpenseGroup {
  date: string;
  expenses: Expense[];
}

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  standalone: true,
  imports: [
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
    IonButton
  ]
})
export default class ExpenseListComponent {
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

  private groupExpensesByDate(expenses: Expense[]): ExpenseGroup[] {
    const grouped: { [key: string]: Expense[] } = {};
    expenses.forEach(expense => {
      if (!grouped[expense.date]) grouped[expense.date] = [];
      grouped[expense.date].push(expense);
    });

    return Object.keys(grouped).map(date => ({
      date,
      expenses: grouped[date]
    }));
  }

  private loadExpenses(next: () => void = () => {}): void {
    const criteria: ExpenseCriteria = {
      // Dein Filterkriterium
      yearMonth: `${this.date.getFullYear()}-${(this.date.getMonth() + 1).toString().padStart(2, '0')}`,
      page: 0,
      size: 10,
      sort: 'date,desc' // Beispiel: Nach Datum sortieren
    };

    this.loading = true;

    this.expenseService.getExpenses(criteria).subscribe({
      next: expensePage => {
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

  reloadExpenses(): void {
    console.log('Reloading expenses...');
  }

  addMonths = (number: number): void => {
    this.date = addMonths(this.date, number);
  };

  async openModal() {
    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
      componentProps: {
        date: this.date
      }
    });
    await modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'save') {
      this.reloadExpenses(); // Neu laden, wenn ein Expense gespeichert wurde
    }
  }
}
