import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'

@Component({
  selector: 'app-diary',
  templateUrl: './diary.page.html',
  styleUrls: ['./diary.page.scss'],
})
export class DiaryPage implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {}

  exportDiary() {}

  navigateDetail(id: string) {
    this.router.navigate([`/diary/${id}`])
  }

  createEntry() {
    this.router.navigate([`/diary/edit/new`])
  }
}
