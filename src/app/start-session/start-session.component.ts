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

  constructor(private router: Router, private http: HttpClient) {}

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
      (response: any) => {
        if (response && response.videoIds && response.videoIds.length >= 3) {
          const queryParams = {
            vid_id1: response.videoIds[0],
            vid_id2: response.videoIds[1],
            vid_id3: response.videoIds[2]
          };
          this.router.navigate(['/display-content'], { queryParams });
        } else {
          console.error('Invalid response format:', response);
        }
      },
      error => {
        console.error('Error fetching top 3 videos:', error);
      }
    );
  }

  navigateToSettings() {
    this.router.navigate(['/settings']);
  }


}
