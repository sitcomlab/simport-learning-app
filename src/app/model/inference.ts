export class Inference {
  constructor(
    public name: string,
    public description: string,
    public trajectoryId: string,
    public lonLat: [number, number],
    public confidence?: number,
    public accuracy?: number
  ) {}
}
