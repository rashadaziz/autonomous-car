import "./style.css";
import { setupCanvas } from "./frontend/canvas";
import { generateRoad } from "./frontend/road";
import { spawnCar } from "./frontend/car";
import { NeuralNetwork } from "./backend/neural-network";

function main() {
  const canvas = setupCanvas();
  const borders = generateRoad();
  let car = spawnCar([1000, 180], borders);

  let currentBest = car;

  canvas.on("frame", () => {
    if (car.fitness > currentBest.fitness) {
      currentBest = car;
    }

    if (car.isDead) {
      car = spawnCar([1000, 180], borders)
      car.brain = currentBest.brain
      NeuralNetwork.mutate(car.brain, 0.1);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "r" && e.shiftKey) {
      car.isDead = true;
      car = spawnCar([1000, 180], borders);
    }
  });
}

main();
