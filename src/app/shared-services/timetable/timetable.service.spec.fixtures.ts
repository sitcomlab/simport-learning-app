import { Inference } from 'src/app/model/inference'
import { InferenceType } from '../inferences/engine/types'

export const oneMondayFiveToNine = new Inference(
  'inferenceId',
  'poi',
  InferenceType.poi,
  '',
  '',
  [51.9, 7.5],
  [[51.9, 7.5]],
  1,
  1,
  [[new Date(2021, 2, 15, 5), new Date(2021, 2, 15, 9, 10)]]
)

export const threeTuesdaysNine = new Inference(
  'inferenceId',
  'poi',
  InferenceType.poi,
  '',
  '',
  [51.9, 7.5],
  [[51.9, 7.5]],
  1,
  1,
  [
    [new Date(2021, 1, 16, 8), new Date(2021, 1, 16, 10, 10)],
    [new Date(2021, 1, 23, 9), new Date(2021, 1, 23, 11, 11)],
    [new Date(2021, 2, 2, 9), new Date(2021, 2, 2, 11, 11)],
    [new Date(2021, 2, 3, 9), new Date(2021, 2, 3, 11, 11)],
  ]
)

export const twoTuesdaysNine = new Inference(
  'inferenceId2',
  'poi',
  InferenceType.poi,
  '',
  '',
  [51.9, 7.5],
  [[51.9, 7.5]],
  1,
  1,
  [
    [new Date(2021, 1, 16, 8), new Date(2021, 1, 16, 10, 10)],
    [new Date(2021, 2, 2, 9), new Date(2021, 2, 2, 11, 11)],
  ]
)

export const multiDayMonToWedFive = new Inference(
  'inferenceId2',
  'poi',
  InferenceType.poi,
  '',
  '',
  [51.9, 7.5],
  [[51.9, 7.5]],
  1,
  1,
  [[new Date(2021, 1, 15, 5), new Date(2021, 1, 17, 5, 10)]]
)

export const timetableOneMondayFiveToNine = [
  {
    weekday: 1,
    hour: 5,
    inference: oneMondayFiveToNine.id,
    count: 1,
  },
  {
    weekday: 1,
    hour: 6,
    inference: oneMondayFiveToNine.id,
    count: 1,
  },
  {
    weekday: 1,
    hour: 7,
    inference: oneMondayFiveToNine.id,
    count: 1,
  },
  {
    weekday: 1,
    hour: 8,
    inference: oneMondayFiveToNine.id,
    count: 1,
  },
  {
    weekday: 1,
    hour: 9,
    inference: oneMondayFiveToNine.id,
    count: 1,
  },
]
