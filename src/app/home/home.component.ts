import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  queuedVideos: { video_id: string, title: string }[] = [];

  reviewItems = [
    { title: 'Review Article 1' },
    { title: 'Review Video 2' },
    { title: 'Review Product 3' }
  ];

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.fetchQueuedVideos();
  }

  fetchQueuedVideos() {
    const token = localStorage.getItem('token');
    this.http.get<any>('/api/video/get-queue', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe(
      (response) => {
        console.log('API response:', response);
        if (Array.isArray(response)) {
          this.queuedVideos = response;
        } else if (response && Array.isArray(response.queue)) {
          this.queuedVideos = response.queue;
        } else {
          console.error('Unexpected response format:', response);
          this.queuedVideos = [];
        }
      },
      (error) => {
        console.error('Error fetching queued videos:', error);
        this.queuedVideos = [];
      }
    );
  }
  

  navigateToSettings() {
    this.router.navigate(['/settings']);
  }

  startSession() {
    this.router.navigate(['/start-session']);
  }

  submitRating(videoId: string, rating: number) {
    const token = localStorage.getItem('token');
    console.log('Submitting rating:', { videoId, rating });
    this.http.post('/api/video/rate-video', { videoId, rating }, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe(
      (response) => {
        console.log('Rating submitted successfully', response);
      },
      (error) => {
        console.error('Error submitting rating:', error);
        if (error.error && error.error.message) {
          console.error('Server error message:', error.error.message);
        }
      }
    );

    this.http.post('/api/video/remove-from-queue', { videoId }, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe(
      (response) => {
        console.log('Video removed from queue', response);
        this.fetchQueuedVideos();
      },
      (error) => {
        console.error('Error removing from queue:', error);
        if (error.error && error.error.message) {
          console.error('Server error message:', error.error.message);
        }
      }
    ); 

  }

}
