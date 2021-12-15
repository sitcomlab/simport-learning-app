import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { DiaryEntry } from 'src/app/model/diary-entry'
import { DiaryService } from 'src/app/shared-services/diary/diary.service'

@Component({
  selector: 'app-diary-edit',
  templateUrl: './diary-edit.component.html',
  styleUrls: ['./diary-edit.component.scss'],
})
export class DiaryEditComponent implements OnInit {
  id: string
  date: string
  content: string

  constructor(
    private diaryService: DiaryService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')

    if (this.id && this.id !== 'new') {
      const entry = await this.diaryService.getDiaryEntry(this.id)
      this.date = entry.date.toISOString()
      this.content = entry.content
    } else {
      this.date = new Date().toISOString()
    }
  }

  async saveEntry() {
    try {
      if (this.id === 'new') {
        await this.diaryService.createDiaryEntry(
          new Date(this.date),
          this.content
        )
      } else {
        await this.diaryService.updateDiaryEntry(
          this.id,
          new Date(this.date),
          this.content
        )
      }
      this.router.navigate([`/diary`])
    } catch (e) {
      console.log(e)
    }
  }
}
