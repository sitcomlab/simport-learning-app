import { Component, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { TimetableService } from 'src/app/shared-services/timetable/timetable.service'

import {
  ApexAxisChartSeries,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexChart,
  ChartComponent,
  ApexXAxis,
  ApexPlotOptions,
  ApexLegend,
} from 'ng-apexcharts'
import { InferenceService } from 'src/app/shared-services/inferences/inference.service'
import { TimetableEntry } from 'src/app/model/timetable'
import { Inference } from 'src/app/model/inference'
import { InferenceType } from 'src/app/shared-services/inferences/engine/types'
import { TranslateService } from '@ngx-translate/core'

export type ChartOptions = {
  series: ApexAxisChartSeries
  chart: ApexChart
  dataLabels: ApexDataLabels
  title: ApexTitleSubtitle
  colors: any
  xaxis: ApexXAxis
  plotOptions: ApexPlotOptions
  legend: ApexLegend
}

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
})
export class ExplorePage implements OnInit {
  trajectoryId: string
  inferences: Inference[]
  selectedInference: Inference
  timetable: TimetableEntry[]
  @ViewChild('chart') chart: ChartComponent

  public chartOptions: Partial<ChartOptions> = {
    series: [],
    chart: {
      height: 200,
      type: 'heatmap',
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    colors: ['#68347d'],
    xaxis: {
      title: {
        text: this.translateService.instant(
          'trajectory.explore.timetableChart.hour'
        ),
      },
      tooltip: {
        enabled: false,
      },
    },
    plotOptions: {
      heatmap: {
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 0,
              color: '#ededed',
            },
          ],
        },
      },
    },
    legend: {
      show: false,
    },
  }

  constructor(
    private timetableService: TimetableService,
    private inferenceService: InferenceService,
    private route: ActivatedRoute,
    private translateService: TranslateService
  ) {}

  async ngOnInit() {
    this.trajectoryId = this.route.snapshot.paramMap.get('trajectoryId')
  }

  async ionViewWillEnter() {
    this.timetable = await this.timetableService.getTimetable(this.trajectoryId)
    // get all POI inferences
    const allInferences = await this.inferenceService.loadPersistedInferences(
      this.trajectoryId
    )
    this.inferences = allInferences.inferences.filter(
      (i) => i.type === InferenceType.poi
    )

    // create chart for selected inference or empty if undefined
    this.drawChart(this.selectedInference)
  }

  // creates heatmap for inference or empty chart if inference is undefined
  drawChart(inference: Inference) {
    // get timetable for inference
    const inferenceTimetable = this.timetable.filter(
      (te) => te.inference === inference?.id
    )

    // create chart series for apexchart heatmap
    const series = new Array(7).fill({}).map((d, i) => ({
      name: this.dayOfWeekAsString(i),
      data: new Array(24).fill({}).map((h, j) => ({
        x: j,
        y:
          inferenceTimetable.find((t) => t.weekday === i && t.hour === j)
            ?.count || 0,
      })),
    }))

    // move sunday to end of array
    const sunday = series.splice(0, 1)
    series.splice(6, 0, sunday[0])

    this.chartOptions = {
      ...this.chartOptions,
      series: series.reverse(), // reverse to have monday to sunday
      title: {
        text: inference?.addressDisplayName || '',
      },
    }
  }

  drawChartFromEvent(e: CustomEvent) {
    this.selectedInference = e.detail.value
    this.drawChart(this.selectedInference)
  }

  /**
   * Converts a day number to a string.
   * From: https://stackoverflow.com/a/24333274
   *
   * @return Returns day as string
   */
  private dayOfWeekAsString(dayIndex: number): string {
    // https://stackoverflow.com/a/63340931
    const getWeekDays = (locale) =>
      [...Array(7).keys()].map((v) =>
        new Date(Date.UTC(1970, 0, 4 + v)).toLocaleDateString(locale, {
          weekday: 'long',
        })
      )

    return getWeekDays(this.translateService.currentLang)[dayIndex] || ''
  }
}
