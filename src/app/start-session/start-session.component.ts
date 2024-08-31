import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-start-session',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HttpClientModule
  ],
  templateUrl: './start-session.component.html',
  styleUrls: ['./start-session.component.scss']
})
export class StartSessionComponent {
  sessionLength: number = 15;
  format: string[] = [];
  contentKeywords: string = '';
  userId: string = '';
  interests: string[] = [];
  averageVideo: {
    title: Number[],
    description: Number[]
    channel_title: Number[],
    category: Number[]
  };
  videoIds: Number[] = [];

  constructor(private router: Router) {}

  adjustSessionLength(amount: number) {
    const newLength = this.sessionLength + amount;
    if (newLength >= 5 && newLength <= 60) {
      this.sessionLength = newLength;
    }
  }

  toggleFormat(type: string) {
    const index = this.format.indexOf(type);
    if (index > -1) {
      this.format.splice(index, 1);
    } else {
      this.format.push(type);
    }
  }
  
  displayContent() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found');
      this.router.navigate(['/login']);
      return;
    }
    this.http.get<any>('/api/video/top3', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe(
      response => {
        this.videoIds = response.videoIds;
      },
      error => {
        console.log('Error fetching videos', error);
      }
    );
    this.router.navigate(['/display-content'], { queryParams: {'vid_id1': this.videoIds[0], 'vid_id2': this.videoIds[1], 'vid_id3': this.videoIds[2] } });
  }

  navigateToSettings() {
    this.router.navigate(['/settings']);
  }


}
