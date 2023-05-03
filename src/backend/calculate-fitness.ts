import { CarInMemory } from "../frontend/car";

// TODO: honestly I still don't know how to implement proper fitness functions
// maybe I should implement checkpoints

const euclidean = (x1: number, x2: number, y1: number, y2: number) => {
  return Math.sqrt((x2 - x1) ** 2 - (y2 - y1) ** 2);
};

export function calcFitness(car: CarInMemory) {
  if (car.speed === 0) {
    car.fitness -= 500;
  }
  if (Math.abs(car.speed) > 0) {
    car.fitness += 10;
  }
  if (car.speed >= 10) {
    car.fitness += 125;
  }

  if (euclidean(car.spawnPoint.x, car.path.position.x, car.spawnPoint.y, car.path.position.y) > 10 * car.fitness * 0.01) {
    car.fitness += 200;
  } else {
    car.fitness -= 50;
  }
}
