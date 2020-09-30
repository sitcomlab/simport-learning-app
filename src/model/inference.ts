class Inference {
    name: string;
    description: string;
    location?: [number, number];
    accuracy?: number;

    constructor(name: string, description: string, location?: [number, number], accuracy?: number) {
        this.name = name;
        this.description = description;
        this.location = location;
        this.accuracy = accuracy;
    }
}