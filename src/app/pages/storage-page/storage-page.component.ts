import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { StorageManagerComponent } from '../../components/storage-manager/storage-manager.component';
import { NavbarComponent } from "../../components/navbar/navbar.component";
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FixCostInputComponent } from "../../components/fix-cost-input/fix-cost-input.component";
import { CommonModule } from '@angular/common';
import { ColorService } from '../../services/color.service';
import { BudgetListComponent } from "../../components/budget-list/budget-list.component";
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-storage-page',
  standalone: true,
  imports: [StorageManagerComponent, NavbarComponent, MatTabsModule, MatButtonModule, MatIconModule, FixCostInputComponent,
    CommonModule, BudgetListComponent],
  templateUrl: './storage-page.component.html',
  styleUrl: './storage-page.component.scss'
})
export class StoragePageComponent implements OnInit, AfterViewInit {
  colorService = inject(ColorService)

  @ViewChild('toTop') toTop!: ElementRef;

  selectedTabIndex = 0;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    /** Subscribe to query params */
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab !== undefined) {
        this.selectedTabIndex = +tab;  // Convert the query parameter to a number
        console.log('Tab: ' + this.selectedTabIndex);
      }
    });

  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollToTop();
    }, 120)
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    this.updateQueryParams(index);
  }

  scrollToTop(): void {
    if (!this.toTop) return
    this.toTop.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** update query params on search bar link */
  updateQueryParams(index: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: index },
      queryParamsHandling: 'merge' // Preserve other existing query parameters
    });
  }
}
