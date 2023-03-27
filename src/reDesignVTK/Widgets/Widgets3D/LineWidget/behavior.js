import _defineProperty from '@babel/runtime/helpers/defineProperty';
import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import Constants from './Constants.js';
import macro from '@kitware/vtk.js/macros.js';
import { s as subtract, l as add, m as normalize, d as dot, x as multiplyScalar, f as distance2BetweenPoints, O } from '@kitware/vtk.js/Common/Core/Math/index.js';
import { getNumberOfPlacedHandles, isHandlePlaced, calculateTextPosition, updateTextPosition, getPoint } from './helpers.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var ShapeType = Constants.ShapeType; // Total number of points to place

var MAX_POINTS = 2;
var handleGetters = ['getHandle1', 'getHandle2', 'getMoveHandle'];
function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkLineWidgetProp');
  model._isDragging = false;
  /**
   * Returns the handle at the handleIndex'th index.
   * @param {number} handleIndex 0, 1 or 2
   */

  publicAPI.getHandle = function (handleIndex) {
    return model.widgetState[handleGetters[handleIndex]]();
  };
  /**
   * Return the index in the of tbe handle in `representations` array,
   * or -1 if the handle is not present in the widget state.
   */


  publicAPI.getHandleIndex = function (handle) {
    switch (handle) {
      case model.widgetState.getHandle1():
        return 0;

      case model.widgetState.getHandle2():
        return 1;

      case model.widgetState.getMoveHandle():
        return 2;

      default:
        return -1;
    }
  };

  publicAPI.isPlaced = function () {
    return getNumberOfPlacedHandles(model.widgetState) === MAX_POINTS;
  }; // --------------------------------------------------------------------------
  // Interactor event
  // --------------------------------------------------------------------------


  function ignoreKey(e) {
    return e.altKey || e.controlKey || e.shiftKey;
  }

  function updateCursor(callData) {
    var _model$activeState$ge, _model$activeState, _model$activeState$ge2;

    model._isDragging = true;
    var manipulator = (_model$activeState$ge = (_model$activeState = model.activeState) === null || _model$activeState === void 0 ? void 0 : (_model$activeState$ge2 = _model$activeState.getManipulator) === null || _model$activeState$ge2 === void 0 ? void 0 : _model$activeState$ge2.call(_model$activeState)) !== null && _model$activeState$ge !== void 0 ? _model$activeState$ge : model.manipulator;
    model.previousPosition = _toConsumableArray(manipulator.handleEvent(callData, model._apiSpecificRenderWindow));

    model._apiSpecificRenderWindow.setCursor('grabbing');

    model._interactor.requestAnimation(publicAPI);
  } // --------------------------------------------------------------------------
  // Text methods
  // --------------------------------------------------------------------------

  /**
   * check for handle 2 position in comparison to handle 1 position
   * and sets text offset to not overlap on the line representation
   */


  function getOffsetDirectionForTextPosition() {
    var pos1 = publicAPI.getHandle(0).getOrigin();
    var pos2 = publicAPI.getHandle(1).getOrigin();
    var dySign = 1;

    if (pos1 && pos2) {
      if (pos1[0] <= pos2[0]) {
        dySign = pos1[1] <= pos2[1] ? 1 : -1;
      } else {
        dySign = pos1[1] <= pos2[1] ? -1 : 1;
      }
    }

    return dySign;
  }
  /**
   * place SVGText on line according to both handle positions
   * which purpose is to never have text representation overlapping
   * on PolyLine representation
   * */


  publicAPI.placeText = function () {
    var dySign = getOffsetDirectionForTextPosition();

    var textPropsCp = _objectSpread({}, model.representations[3].getTextProps());

    textPropsCp.dy = dySign * Math.abs(textPropsCp.dy);
    model.representations[3].setTextProps(textPropsCp);

    model._interactor.render();
  };

  publicAPI.setText = function (text) {
    model.widgetState.getText().setText(text);

    model._interactor.render();
  }; // --------------------------------------------------------------------------
  // Handle positioning methods
  // --------------------------------------------------------------------------
  // Handle utilities ---------------------------------------------------------


  function getLineDirection(p1, p2) {
    var dir = subtract(p1, p2, []);
    normalize(dir);
    return dir;
  } // Handle orientation & rotation ---------------------------------------------------------


  function computeMousePosition(p1, callData) {
    var displayMousePos = publicAPI.computeWorldToDisplay.apply(publicAPI, [model._renderer].concat(_toConsumableArray(p1)));
    var worldMousePos = publicAPI.computeDisplayToWorld(model._renderer, callData.position.x, callData.position.y, displayMousePos[2]);
    return worldMousePos;
  }
  /**
   * Returns the  handle orientation to match the direction vector of the polyLine from one tip to another
   * @param {number} handleIndex 0 for handle1, 1 for handle2
   * @param {object} callData if specified, uses mouse position as 2nd point
   */


  function getHandleOrientation(handleIndex) {
    var callData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var point1 = getPoint(handleIndex, model.widgetState);
    var point2 = callData ? computeMousePosition(point1, callData) : getPoint(1 - handleIndex, model.widgetState);
    return point1 && point2 ? getLineDirection(point1, point2) : null;
  }
  /**
   * Orient handle
   * @param {number} handleIndex 0, 1 or 2
   * @param {object} callData optional, see getHandleOrientation for details.
   */


  function updateHandleOrientation(handleIndex) {
    var orientation = getHandleOrientation(Math.min(1, handleIndex));
    model.representations[handleIndex].setOrientation(orientation);
  }

  publicAPI.updateHandleOrientations = function () {
    updateHandleOrientation(0);
    updateHandleOrientation(1);
    updateHandleOrientation(2);
  };

  publicAPI.rotateHandlesToFaceCamera = function () {
    model.representations[0].setViewMatrix(Array.from(model._camera.getViewMatrix()));
    model.representations[1].setViewMatrix(Array.from(model._camera.getViewMatrix()));
  }; // Handles visibility ---------------------------------------------------------

  /**
   * Set actor visibility to true unless it is a NONE handle
   * and uses state visibility variable for the displayActor visibility to
   * allow pickable handles even when they are not displayed on screen
   * @param handle : the handle state object
   * @param handleNb : the handle number according to its label in widget state
   */


  publicAPI.updateHandleVisibility = function (handleIndex) {
    var handle = publicAPI.getHandle(handleIndex);
    var visibility = handle.getVisible() && isHandlePlaced(handleIndex, model.widgetState);
    model.representations[handleIndex].setVisibilityFlagArray([visibility, visibility && handle.getShape() !== ShapeType.NONE]);
    model.representations[handleIndex].updateActorVisibility();

    model._interactor.render();
  };
  /**
   * Called when placing a point from the first time.
   * @param {number} handleIndex
   */


  publicAPI.placeHandle = function (handleIndex) {
    var handle = publicAPI.getHandle(handleIndex);
    handle.setOrigin.apply(handle, _toConsumableArray(model.widgetState.getMoveHandle().getOrigin()));
    publicAPI.updateHandleOrientations();
    publicAPI.rotateHandlesToFaceCamera();
    model.widgetState.getText().setOrigin(calculateTextPosition(model));
    publicAPI.updateHandleVisibility(handleIndex);

    if (handleIndex === 0) {
      var _publicAPI$getHandle;

      // For the line (handle1, handle2, moveHandle) to be displayed
      // correctly, handle2 origin must be valid.
      (_publicAPI$getHandle = publicAPI.getHandle(1)).setOrigin.apply(_publicAPI$getHandle, _toConsumableArray(model.widgetState.getMoveHandle().getOrigin())); // Now that handle2 has a valid origin, hide it


      publicAPI.updateHandleVisibility(1);
      model.widgetState.getMoveHandle().setShape(publicAPI.getHandle(1).getShape());
    }

    if (handleIndex === 1) {
      publicAPI.placeText();
      publicAPI.loseFocus();
    }
  }; // --------------------------------------------------------------------------
  
  var initDirection=[];
    /**
   * 直接给定两端点位置
   * @param {number} handleIndex
   */


     publicAPI.placeHandleByCoords = function (coords0, coords1) {
      initDirection = getLineDirection(coords0,coords1)
      var handle0 = publicAPI.getHandle(0);
      var handle1 = publicAPI.getHandle(1);
      handle0.setOrigin.apply(handle0, [coords0])
      handle1.setOrigin.apply(handle1, [coords1])
      // handle.setOrigin.apply(handle, _toConsumableArray(model.widgetState.getMoveHandle().getOrigin()));
      publicAPI.updateHandleOrientations();
      publicAPI.rotateHandlesToFaceCamera();
      model.widgetState.getText().setOrigin(calculateTextPosition(model));
      publicAPI.updateHandleVisibility(0);
      publicAPI.updateHandleVisibility(1);
  
      // if (handleIndex === 0) {
      //   var _publicAPI$getHandle;
  
      //   // For the line (handle1, handle2, moveHandle) to be displayed
      //   // correctly, handle2 origin must be valid.
      //   (_publicAPI$getHandle = publicAPI.getHandle(1)).setOrigin.apply(_publicAPI$getHandle, _toConsumableArray(model.widgetState.getMoveHandle().getOrigin())); // Now that handle2 has a valid origin, hide it
  
  
      //   publicAPI.updateHandleVisibility(1);
      //   model.widgetState.getMoveHandle().setShape(publicAPI.getHandle(1).getShape());
      // }
  
      // if (handleIndex === 1) {
      //   publicAPI.placeText();
      //   publicAPI.loseFocus();
      // }
    }; // --------------------------------------------------------------------------
  
  // Left press: Select handle to drag
  // --------------------------------------------------------------------------


  publicAPI.handleLeftButtonPress = function (e) {
    if (!model.activeState || !model.activeState.getActive() || !model.pickable || ignoreKey(e)) {
      return macro.VOID;
    }

    if (model.activeState === model.widgetState.getMoveHandle() && getNumberOfPlacedHandles(model.widgetState) === 0) {
      publicAPI.placeHandle(0);
    } else if (model.widgetState.getMoveHandle().getActive() && getNumberOfPlacedHandles(model.widgetState) === 1) {
      publicAPI.placeHandle(1);
    } else if (model.dragable && !model.widgetState.getText().getActive()) {
      // Grab handle1, handle2 or whole widget
      updateCursor(e);
    }

    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  }; // --------------------------------------------------------------------------
  // Mouse move: Drag selected handle / Handle follow the mouse
  // --------------------------------------------------------------------------

  publicAPI.handleMouseMove = function (callData) {
    var _model$activeState$ge3, _model$activeState2, _model$activeState2$g;

    var manipulator = (_model$activeState$ge3 = (_model$activeState2 = model.activeState) === null || _model$activeState2 === void 0 ? void 0 : (_model$activeState2$g = _model$activeState2.getManipulator) === null || _model$activeState2$g === void 0 ? void 0 : _model$activeState2$g.call(_model$activeState2)) !== null && _model$activeState$ge3 !== void 0 ? _model$activeState$ge3 : model.manipulator;

    if (manipulator && model.pickable && model.dragable && model.activeState && model.activeState.getActive() && !ignoreKey(callData)) {
      var worldCoords = manipulator.handleEvent(callData, model._apiSpecificRenderWindow);
      var translation = model.previousPosition ? subtract(worldCoords, model.previousPosition, []) : [0, 0, 0];
      model.previousPosition = worldCoords;

      if ( // is placing first or second handle
      model.activeState === model.widgetState.getMoveHandle() || // is dragging already placed first or second handle
      model._isDragging) {
        if (model.activeState.setOrigin) {
          var handle0 = publicAPI.getHandle(0); //作为点B
          var handle1 = publicAPI.getHandle(1); //作为点A
          var coords0 = handle0.getOrigin();
          var coords1 = handle1.getOrigin();
          const middlePoint = multiplyScalar(add(coords0,coords1,[]),0.5)
          var AB = subtract(coords0, coords1, []) //B-A，也就是A->B
          var AP = subtract(worldCoords,coords1,[]); //光标所在位置作为P点
          var AC = multiplyScalar(AB,dot(AP,AB)/dot(AB,AB)) //P点投影到AB向量上的点C
          var coordC = add(AC,coords1,[]) // 点C坐标
          var MB = subtract(coords0, middlePoint, [])
          var MA = subtract(coords1, middlePoint, [])
          var MC = subtract(coordC, middlePoint, [])
          //限制小球的移动范围
          var limitDist = 0.1;//两小球可达到的最近距离
          if(model.activeState === handle0){//如果移动的是B
            if (dot(initDirection,MC)>0&&
            Math.sqrt(distance2BetweenPoints(coordC,middlePoint))>limitDist){
              handle0.setOrigin(coordC);
              handle1.setOrigin(add(multiplyScalar(MC,-1),middlePoint,[]));
            }else{
              handle0.setOrigin(add([
                getLineDirection(coords0,coords1)[0]*limitDist,
                getLineDirection(coords0,coords1)[1]*limitDist,
                getLineDirection(coords0,coords1)[2]*limitDist
              ],middlePoint,[]));
              handle1.setOrigin(add([
                getLineDirection(coords0,coords1)[0]*-limitDist,
                getLineDirection(coords0,coords1)[1]*-limitDist,
                getLineDirection(coords0,coords1)[2]*-limitDist
              ],middlePoint,[]));
            }
          }
          if(model.activeState === handle1){//如果移动的是A
            if (dot(initDirection,MC)<0&&
            Math.sqrt(distance2BetweenPoints(coordC,middlePoint))>limitDist){
              handle1.setOrigin(coordC);
              handle0.setOrigin(add(multiplyScalar(MC,-1),middlePoint,[]));
            }else{
              handle0.setOrigin(add([
                getLineDirection(coords0,coords1)[0]*limitDist,
                getLineDirection(coords0,coords1)[1]*limitDist,
                getLineDirection(coords0,coords1)[2]*limitDist
              ],middlePoint,[]));
              handle1.setOrigin(add([
                getLineDirection(coords0,coords1)[0]*-limitDist,
                getLineDirection(coords0,coords1)[1]*-limitDist,
                getLineDirection(coords0,coords1)[2]*-limitDist
              ],middlePoint,[]));
            }
          }
          
          publicAPI.updateHandleVisibility(publicAPI.getHandleIndex(model.activeState));
        }

        publicAPI.updateHandleOrientations();
        updateTextPosition(model);
        publicAPI.invokeInteractionEvent();
        return macro.EVENT_ABORT;
      }
    }

    return macro.VOID;
  }; // --------------------------------------------------------------------------
  // Left release: Finish drag
  // --------------------------------------------------------------------------


  publicAPI.handleLeftButtonRelease = function () {
    if (!model.activeState || !model.activeState.getActive() || !model.pickable) {
      publicAPI.rotateHandlesToFaceCamera();
      return macro.VOID;
    }

    if (model.hasFocus && publicAPI.isPlaced()) {
      publicAPI.loseFocus();
      return macro.VOID;
    }

    if (model._isDragging && publicAPI.isPlaced()) {
      var wasTextActive = model.widgetState.getText().getActive(); // Recompute offsets

      publicAPI.placeText();
      model.widgetState.deactivate();
      model.activeState = null;

      if (!wasTextActive) {
        model._interactor.cancelAnimation(publicAPI);
      }

      model._apiSpecificRenderWindow.setCursor('pointer');

      model.hasFocus = false;
      model._isDragging = false;
    } else if (model.activeState !== model.widgetState.getMoveHandle()) {
      model.widgetState.deactivate();
    }

    if (model.hasFocus && !model.activeState || model.activeState && !model.activeState.getActive()) {
      model._widgetManager.enablePicking();

      model._interactor.render();
    }

    publicAPI.invokeEndInteractionEvent();
    return macro.EVENT_ABORT;
  }; // --------------------------------------------------------------------------
  // Focus API - moveHandle follow mouse when widget has focus
  // --------------------------------------------------------------------------


  publicAPI.grabFocus = function () {
    if (!model.hasFocus && !publicAPI.isPlaced()) {
      model.activeState = model.widgetState.getMoveHandle();
      model.activeState.setShape(publicAPI.getHandle(0).getShape());
      model.activeState.activate();

      model._interactor.requestAnimation(publicAPI);

      publicAPI.invokeStartInteractionEvent();
    }

    model.hasFocus = true;
  }; // --------------------------------------------------------------------------


  publicAPI.loseFocus = function () {
    if (model.hasFocus) {
      model._interactor.cancelAnimation(publicAPI);

      publicAPI.invokeEndInteractionEvent();
    }

    model.widgetState.deactivate();
    model.widgetState.getMoveHandle().deactivate();
    model.widgetState.getMoveHandle().setOrigin(null);
    model.activeState = null;
    model.hasFocus = false;

    model._widgetManager.enablePicking();

    model._interactor.render();
  };

  publicAPI.reset = function () {
    model.widgetState.deactivate();
    model.widgetState.getMoveHandle().deactivate();
    model.widgetState.getHandle1().setOrigin(null);
    model.widgetState.getHandle2().setOrigin(null);
    model.widgetState.getMoveHandle().setOrigin(null);
    model.widgetState.getText().setOrigin(null);
    model.widgetState.getText().setText('');
    model.activeState = null;
  };
}

export { widgetBehavior as default };
