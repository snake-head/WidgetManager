import { s as subtract, x as multiplyScalar, l as add, C as areEquals } from '@kitware/vtk.js/Common/Core/Math/index.js';

function calculateTextPosition(model) {
  var vector = [0, 0, 0];
  var handle1WorldPos = model.widgetState.getHandle1().getOrigin();
  var handle2WorldPos = model.widgetState.getHandle2().getOrigin();

  if (!handle1WorldPos || !handle2WorldPos) {
    return null;
  }

  var statePositionOnLine = model.widgetState.getPositionOnLine().getPosOnLine();
  statePositionOnLine = 1 - statePositionOnLine;
  subtract(handle1WorldPos, handle2WorldPos, vector);
  multiplyScalar(vector, statePositionOnLine);
  add(vector, handle2WorldPos, vector);
  return vector;
}
function updateTextPosition(model) {
  var SVGTextState = model.widgetState.getText();
  SVGTextState.setOrigin(calculateTextPosition(model));
}
function isHandlePlaced(handleIndex, widgetState) {
  if (handleIndex === 2) {
    return widgetState.getMoveHandle().getOrigin() != null;
  }

  var handle1Origin = widgetState.getHandle1().getOrigin();

  if (handleIndex === 0) {
    return handle1Origin != null;
  }

  var handle2Origin = widgetState.getHandle2().getOrigin();
  return handle1Origin && handle2Origin && !areEquals(handle1Origin, handle2Origin, 0);
}
/**
 * Returns the world position of line extremities (placed or not).
 * Returns null if no extremity exist.
 * @param {number} handleIndex 0 or 1
 * @param {object} widgetState state of line widget
 * @param {bool} moveHandle Get move handle position if moveHandle is true and handle is not placed
 */

function getPoint(handleIndex, widgetState) {
  var moveHandle = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var handle = moveHandle && !isHandlePlaced(handleIndex, widgetState) ? widgetState.getMoveHandle() : widgetState["getHandle".concat(handleIndex + 1)]();
  var origin = handle.getOrigin();
  return origin || null;
}
/**
 * Returns the number of handle placed on the scene by checking
 * handle positions. Returns 2 when the user is still
 * placing 2nd handle
 * */

function getNumberOfPlacedHandles(widgetState) {
  var numberOfPlacedHandles = 0;

  if (isHandlePlaced(0, widgetState)) {
    numberOfPlacedHandles = 1 + isHandlePlaced(1, widgetState);
  }

  return numberOfPlacedHandles;
}

export { calculateTextPosition, getNumberOfPlacedHandles, getPoint, isHandlePlaced, updateTextPosition };
