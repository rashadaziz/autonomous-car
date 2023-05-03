import * as paper from "paper";

type RoadBoarders = { left: paper.Path; right: paper.Path };

export function generateRoad() {
  const canvasBounds = paper.view.bounds;
  const roadPath = new paper.Path.Ellipse({
    center: [canvasBounds.width * 0.5, canvasBounds.height * 0.5],
    radius: [500, 300],
    strokeColor: new paper.Color(0.4, 0.4, 0.4),
    strokeWidth: 4,
    dashArray: [10, 12],
    data: {
      entity: "ROAD",
    },
  });

  const roadBorders = {
    left: new paper.Path(),
    right: new paper.Path(),
  };

  initHandles(roadPath, roadBorders);
  initRoadEditor(roadPath, roadBorders);
  updateRoadBorders(roadPath, roadBorders);

  return roadBorders;
}

function updateRoadBorders(roadPath: paper.Path, borders: RoadBoarders) {
  borders.left.remove();
  borders.right.remove();
  borders.left = new paper.Path({
    closed: true,
    strokeColor: new paper.Color(0, 0, 0),
    strokeWidth: 5,
  });
  borders.right = new paper.Path({
    closed: true,
    strokeColor: new paper.Color(0, 0, 0),
    strokeWidth: 5,
  });
  const ROAD_WIDTH = 150;
  for (const segment of roadPath.segments) {
    let forward = new paper.Point(0, 0);
    forward = forward.add(segment.point.subtract(segment.previous.point));
    forward = forward.add(segment.next.point.subtract(segment.point));
    forward = forward.normalize();
    const left = new paper.Point(-forward.y, forward.x);
    const anchorLeft = segment.point.add(left.multiply(ROAD_WIDTH * 0.5));
    const anchorRight = segment.point.subtract(left.multiply(ROAD_WIDTH * 0.5));
    borders.left.add(anchorLeft);
    borders.right.add(anchorRight);
  }
  borders.left.smooth({ continuous: true });
  borders.right.smooth({ continuous: true });
}

function initRoadEditor(path: paper.Path, borders: RoadBoarders) {
  path.onMouseDown = (e: paper.MouseEvent) => {
    const hitResult = paper.project.hitTest(e.point, {
      segments: true,
      stroke: true,
      tolerance: 20,
    });
    if (hitResult && hitResult.type === "stroke") {
      const location = hitResult.location;
      hitResult.segment = path.insert(location.index + 1, e.point);
      path.smooth({ continuous: true });
      updateRoadBorders(path, borders);
    }
  };
}

function initHandles(path: paper.Path, borders: RoadBoarders) {
  let handles: paper.Path[] = [];
  paper.view.on("frame", () => {
    handles.forEach((handle) => handle.remove());

    handles = drawHandles(path);
    updateRoadBorders(path, borders);

    handles.forEach((handle, i) => {
      const segment = path.segments[i];
      handle.onMouseDrag = (e: paper.MouseEvent) => {
        if (e.modifiers.control) return;
        segment.point = e.point;
        path.smooth({ continuous: true });
      };
      handle.onMouseDown = (e: paper.MouseEvent) => {
        if (e.modifiers.control) {
          segment.remove();
          path.smooth({ continuous: true });
        }
      };
    });
  });
}

function drawHandles(path: paper.Path) {
  const handles: paper.Path[] = [];
  for (const segment of path.segments) {
    const segmentHandle = segment.point;
    const handle = new paper.Path.Circle({ center: segmentHandle, radius: 6 });
    handle.strokeColor = new paper.Color(0, 0, 0.4);
    handle.fillColor = new paper.Color(0, 0.2, 0.7, 0.4);
    handle.strokeWidth = 3;
    handles.push(handle);
  }

  return handles;
}
