import { Component } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-display-content',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './display-content.component.html',
  styleUrl: './display-content.component.scss'
})

export class DisplayContentComponent {
  vidId1: SafeResourceUrl;
  vidId2: SafeResourceUrl;
  vidId3: SafeResourceUrl;

  constructor(private route: ActivatedRoute, private router: Router, private sanitizer: DomSanitizer) {
    this.route.queryParams.subscribe(params => {
      this.vidId1 = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/' + params['vid_id1']);
      this.vidId2 = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/' + params['vid_id2']);
      this.vidId3 = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/' + params['vid_id3']);
    });
  }

  navigateToSettings() {
    this.router.navigate(['/settings']);
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }
}
