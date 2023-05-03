import * as paper from "paper";

export function setupCanvas() {
  const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
  paper.setup(canvas);

  const fpsCounter = new paper.PointText({
    point: [10, 20],
    strokeColor: "green",
    content: "0",
  });

  let lastCalled: number;
  let fps: number;

  paper.view.on("frame", (e: any) => {
    if (!lastCalled) {
      lastCalled = Date.now();
      fps = 0;
      return;
    }
    const delta = (Date.now() - lastCalled) / 1000;
    lastCalled = Date.now();
    fps = 1 / delta;
    fpsCounter.content = fps.toFixed(0).toString();
  });

  return paper.view;
}