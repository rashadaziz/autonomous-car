import * as paper from "paper";
import { lerp } from "../helpers/utils";
import { NeuralNetwork } from "../backend/neural-network";
import { calcFitness } from "../backend/calculate-fitness";

const TARGET_FPS = 60;

type Point = { x: number; y: number };
type SensorReading = { x: number | null; y: number | null; offset: number | null };
type SpeedReading = {
  heading: Point;
  vx: number;
  vy: number;
};

export type CarInMemory = {
  isDead: boolean;
  brain: NeuralNetwork,
  distanceTravelled: number;
  fitness: number;
  spawnPoint: Point;
  path: paper.Path;
  prevAngle: number;
  angle: number;
  speed: number;
  velocity: SpeedReading;
  sensors: SensorReading[];
  controls: {
    gas: (intensity: number) => void;
    brake: (intensity: number) => void;
    left: (intensity: number) => void;
    right: (intensity: number) => void;
  };
};

export function spawnCar(
  spawnPoint: [number, number],
  borders: { left: paper.Path; right: paper.Path }
) {
  const height = 30;
  const width = 50;
  const centerPoint = new paper.Point(
    spawnPoint[0] - width * 0.5,
    spawnPoint[1] - height * 0.5
  );

  const car = new paper.Path.Rectangle({
    position: centerPoint,
    height,
    width,
    fillColor: new paper.Color(0, 0, 0.4),
  });

  const acceleration = 0.4;
  const max = 10;
  const friction = 0.1;
  const turningRadius = 8;
  const sensorCount = 10;
  const sensorLength = 120;
  const sensorSpread = Math.PI / 2;

  const brain = new NeuralNetwork([sensorCount, 6, 4]);
  const memCar: CarInMemory = {
    isDead: false,
    distanceTravelled: 0,
    brain,
    fitness: 0,
    spawnPoint: { x: spawnPoint[0], y: spawnPoint[1] },
    path: car,
    prevAngle: 0,
    angle: 0,
    speed: 0,
    velocity: { heading: { x: 0, y: 0 }, vx: 0, vy: 0 },
    sensors: [],
    controls: {
      gas: function (intensity) {
        memCar.speed += acceleration * intensity;
      },
      brake: function (intensity) {
        memCar.speed -= acceleration * intensity;
      },
      left: function (intensity) {
        memCar.angle -= turningRadius * intensity;
      },
      right: function (intensity) {
        memCar.angle += turningRadius * intensity;
      },
    },
  };

  car.onMouseDrag = function (event: paper.MouseEvent) {
    const dy = event.point.y - car.position.y;
    const dx = event.point.x - car.position.x;
    const rad = Math.atan2(dy, dx);
    const deg = (rad * 180) / Math.PI;
    const dAngle = deg - memCar.angle;
    memCar.angle += dAngle;
  };

  car.on("frame", () => {
    if (memCar.speed > max) {
      memCar.speed = max;
    }
    if (memCar.speed < -max / 2) {
      memCar.speed = -max / 2;
    }
    if (memCar.speed > 0) {
      memCar.speed -= friction;
    }
    if (memCar.speed < 0) {
      memCar.speed += friction;
    }
    if (Math.abs(memCar.speed) < friction) {
      memCar.speed = 0;
    }
  });

  drawCar(memCar, borders);
  initSensors(memCar, borders, {
    sensorLength,
    sensorCount,
    sensorSpread,
  });
  initBrain(memCar, brain);

  return memCar;
}

function drawCar(
  carObj: CarInMemory,
  borders: { left: paper.Path; right: paper.Path }
) {
  carObj.path.on("frame", (e: any) => {
    if (carObj.isDead) {
      carObj.path.remove();
      return;
    }
    // idk why it's so hard to get the values for rotation in paper.js
    // when applyMatrix = true, this is really hacky
    const deltaAngle = carObj.angle - carObj.prevAngle;
    const correctedDeltaAngle = deltaAngle * e.delta * TARGET_FPS;
    carObj.path.rotate(correctedDeltaAngle);
    carObj.angle -= deltaAngle;
    carObj.angle += correctedDeltaAngle;
    carObj.prevAngle = carObj.angle;

    const radians = (carObj.angle * Math.PI) / 180;
    const heading = { x: Math.cos(radians), y: Math.sin(radians) };
    const vx = heading.x * carObj.speed * e.delta * TARGET_FPS;
    const vy = heading.y * carObj.speed * e.delta * TARGET_FPS;
    carObj.velocity = { heading, vx, vy };
    carObj.path.position.x += vx;
    carObj.path.position.y += vy;
    carObj.distanceTravelled += (heading.x * vx + heading.y * vy);

    const hitsWithBorders = [
      ...carObj.path.getIntersections(borders.left),
      ...carObj.path.getIntersections(borders.right),
    ];
    if (hitsWithBorders.length) {
      carObj.isDead = true;
    }
  });
}

function initBrain(car: CarInMemory, brain: NeuralNetwork) {
  car.path.on("frame", () => {
    if (car.speed === 0 && car.fitness < 0) {
      car.isDead = true;
    }
    if (car.isDead) return;
    const sensorReadings = car.sensors.map(s => s.offset ? 1 - s.offset : 0);
    const outputs = NeuralNetwork.feedForward(sensorReadings, brain);
    if (outputs[0]) {
      car.controls.gas(1);
    }
    if (outputs[1]) {
      car.controls.brake(1);
    }
    if (outputs[2]) {
      car.controls.left(1);
    }
    if (outputs[3]) {
      car.controls.right(1);
    }
    calcFitness(car);
  });
}

function initSensors(
  carObj: CarInMemory,
  roadBorders: { left: paper.Path; right: paper.Path },
  {
    sensorCount = 3,
    sensorLength = 100,
    sensorSpread = Math.PI / 4,
  }: {
    sensorCount?: number;
    sensorLength?: number;
    sensorSpread?: number;
  }
) {
  let sensors: paper.Path.Line[] = [];
  let hitSpots: paper.Path[] = [];

  for (let i = 0; i < sensorCount; i++) {
    sensors.push(new paper.Path.Line({ strokeColor: "red" }));
  }

  carObj.path.on("frame", () => {
    if (carObj.isDead) {
      sensors.forEach(sensor => sensor.remove());
      hitSpots.forEach(spot => spot.remove());
      sensors = [];
      hitSpots = [];
      return;
    }
    const sensorData: SensorReading[] = [];
    drawSensors(carObj, sensors, sensorSpread, sensorCount, sensorLength);
    hitSpots.forEach((hit) => hit.remove());
    hitSpots = [];

    const intersections = sensors.map((sensor) => {
      const hits = [
        ...sensor.getIntersections(roadBorders.left),
        ...sensor.getIntersections(roadBorders.right),
      ];
      if (hits.length) {
        return hits;
      }
      return null;
    });

    intersections.flat().forEach((hit) => {
      if (hit === null) {
        sensorData.push({
          offset: null,
          x: null,
          y: null,
        });
        return;
      }
      sensorData.push({
        offset: hit.offset / sensorLength,
        x: hit.point.x,
        y: hit.point.y,
      });
      const spot = new paper.Path.Circle({
        center: hit.point,
        radius: 5,
        fillColor: "blue",
      });
      hitSpots.push(spot);
    });

    carObj.sensors = sensorData;
  });
}

function drawSensors(
  carObj: CarInMemory,
  sensors: paper.Path[],
  sensorSpread: number,
  sensorCount: number,
  sensorLength: number
) {
  sensors.forEach((sensor, i) => {
    const sensorAngle = lerp(
      sensorSpread * 0.5,
      -sensorSpread * 0.5,
      i / (sensorCount - 1)
    );

    const correctedAngle = (carObj.angle * Math.PI) / 180 - sensorAngle;
    const carX = carObj.path.position.x;
    const carY = carObj.path.position.y;

    const start = { x: carX, y: carY };
    const end = {
      x: carX + Math.cos(correctedAngle) * sensorLength,
      y: carY + Math.sin(correctedAngle) * sensorLength,
    };

    sensor.segments = [new paper.Segment(start), new paper.Segment(end)];
  });
}
