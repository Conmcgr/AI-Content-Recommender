import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  reviewItems = [
    { title: 'Review Article 1' },
    { title: 'Review Video 2' },
    { title: 'Review Product 3' }
  ];

  constructor(private router: Router) {}

  navigateToSettings() {
    this.router.navigate(['/settings']);
  }

  startSession() {
    this.router.navigate(['/start-session']);
  }
}
