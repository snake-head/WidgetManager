import _asyncToGenerator from '@babel/runtime/helpers/asyncToGenerator';
import _slicedToArray from '@babel/runtime/helpers/slicedToArray';
import _regeneratorRuntime from '@babel/runtime/regenerator';
import { r as radiansFromDegrees } from '@kitware/vtk.js/Common/Core/Math/index.js';
import { FieldAssociations } from '@kitware/vtk.js/Common/DataModel/DataSet/Constants.js';
import macro from '@kitware/vtk.js/macros.js';
import vtkSelectionNode from '@kitware/vtk.js/Common/DataModel/SelectionNode.js';
import WidgetManagerConst from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants.js';
import vtkSVGRepresentation from '@kitware/vtk.js/Widgets/SVG/SVGRepresentation.js';
import { WIDGET_PRIORITY } from '@kitware/vtk.js/Widgets/Core/AbstractWidget/Constants.js';
import { diff } from '@kitware/vtk.js/Widgets/Core/WidgetManager/vdom.js';

var ViewTypes = WidgetManagerConst.ViewTypes,
    RenderingTypes = WidgetManagerConst.RenderingTypes,
    CaptureOn = WidgetManagerConst.CaptureOn;
var vtkErrorMacro = macro.vtkErrorMacro,
    vtkWarningMacro = macro.vtkWarningMacro;
var createSvgElement = vtkSVGRepresentation.createSvgElement,
    createSvgDomElement = vtkSVGRepresentation.createSvgDomElement;
var viewIdCount = 1; // ----------------------------------------------------------------------------
// Helper
// ----------------------------------------------------------------------------

// 根据得到的renderer把camera, interactor等设置全部拿出来
function extractRenderingComponents(renderer) {
  var camera = renderer.getActiveCamera();
  var renderWindow = renderer.getRenderWindow();
  var interactor = renderWindow.getInteractor();
  var apiSpecificRenderWindow = interactor.getView();
  return {
    renderer: renderer,
    renderWindow: renderWindow,
    interactor: interactor,
    apiSpecificRenderWindow: apiSpecificRenderWindow,
    camera: camera
  };
} // ----------------------------------------------------------------------------

function createSvgRoot(id) {
  var svgRoot = createSvgDomElement('svg');
  svgRoot.setAttribute('version', '1.1');
  svgRoot.setAttribute('baseProfile', 'full');
  return svgRoot;
} // ----------------------------------------------------------------------------
// vtkWidgetManager methods
// ----------------------------------------------------------------------------


function vtkWidgetManager(publicAPI, model) {
  if (!model.viewId) {
    model.viewId = "view-".concat(viewIdCount++);
  }

  model.classHierarchy.push('vtkWidgetManager');
  var propsWeakMap = new WeakMap();
  var widgetToSvgMap = new WeakMap();
  var svgVTrees = new WeakMap();
  var subscriptions = []; // --------------------------------------------------------------------------
  // Internal variable
  // --------------------------------------------------------------------------

  model.svgRoot = createSvgRoot(model.viewId); // --------------------------------------------------------------------------
  // API internal
  // --------------------------------------------------------------------------

  function updateWidgetWeakMap(widget) {
    var representations = widget.getRepresentations();

    for (var i = 0; i < representations.length; i++) {
      var representation = representations[i];
      var origin = {
        widget: widget,
        representation: representation
      };
      var actors = representation.getActors();

      for (var j = 0; j < actors.length; j++) {
        var actor = actors[j];
        propsWeakMap.set(actor, origin);
      }
    }
  }

  function getViewWidget(widget) {
    return widget && (widget.isA('vtkAbstractWidget') ? widget : widget.getWidgetForView({
      viewId: model.viewId
    }));
  } // --------------------------------------------------------------------------
  // internal SVG API
  // --------------------------------------------------------------------------


  var pendingSvgRenders = new WeakMap();

  function enableSvgLayer() {
    var container = model._apiSpecificRenderWindow.getReferenceByName('el');

    var canvas = model._apiSpecificRenderWindow.getCanvas();

    container.insertBefore(model.svgRoot, canvas.nextSibling);
    var containerStyles = window.getComputedStyle(container);

    if (containerStyles.position === 'static') {
      container.style.position = 'relative';
    }
  }

  function disableSvgLayer() {
    var container = model._apiSpecificRenderWindow.getReferenceByName('el');

    container.removeChild(model.svgRoot);
  }

  function removeFromSvgLayer(viewWidget) {
    var group = widgetToSvgMap.get(viewWidget);

    if (group) {
      widgetToSvgMap.delete(viewWidget);
      svgVTrees.delete(viewWidget);
      model.svgRoot.removeChild(group);
    }
  }

  function setSvgSize() {
    var _model$_apiSpecificRe = model._apiSpecificRenderWindow.getViewportSize(model._renderer),
        _model$_apiSpecificRe2 = _slicedToArray(_model$_apiSpecificRe, 2),
        cwidth = _model$_apiSpecificRe2[0],
        cheight = _model$_apiSpecificRe2[1];

    var ratio = model._apiSpecificRenderWindow.getComputedDevicePixelRatio();

    var bwidth = String(cwidth / ratio);
    var bheight = String(cheight / ratio);
    var viewBox = "0 0 ".concat(cwidth, " ").concat(cheight);
    var origWidth = model.svgRoot.getAttribute('width');
    var origHeight = model.svgRoot.getAttribute('height');
    var origViewBox = model.svgRoot.getAttribute('viewBox');

    if (origWidth !== bwidth) {
      model.svgRoot.setAttribute('width', bwidth);
    }

    if (origHeight !== bheight) {
      model.svgRoot.setAttribute('height', bheight);
    }

    if (origViewBox !== viewBox) {
      model.svgRoot.setAttribute('viewBox', viewBox);
    }
  }

  function setSvgRootStyle() {
    var viewport = model._renderer.getViewport().map(function (v) {
      return v * 100;
    });

    model.svgRoot.setAttribute('style', "position: absolute; left: ".concat(viewport[0], "%; top: ").concat(100 - viewport[3], "%; width: ").concat(viewport[2] - viewport[0], "%; height: ").concat(viewport[3] - viewport[1], "%;"));
  }

  function updateSvg() {
    if (model.useSvgLayer) {
      var _loop = function _loop(i) {
        var widget = model.widgets[i];
        var svgReps = widget.getRepresentations().filter(function (r) {
          return r.isA('vtkSVGRepresentation');
        });
        var pendingContent = [];

        if (widget.getVisibility()) {
          pendingContent = svgReps.filter(function (r) {
            return r.getVisibility();
          }).map(function (r) {
            return r.render();
          });
        }

        var promise = Promise.all(pendingContent);
        var renders = pendingSvgRenders.get(widget) || [];
        renders.push(promise);
        pendingSvgRenders.set(widget, renders);
        promise.then(function (vnodes) {
          var pendingRenders = pendingSvgRenders.get(widget) || [];
          var idx = pendingRenders.indexOf(promise);

          if (model.deleted || widget.isDeleted() || idx === -1) {
            return;
          } // throw away previous renders


          pendingRenders = pendingRenders.slice(idx + 1);
          pendingSvgRenders.set(widget, pendingRenders);
          var oldVTree = svgVTrees.get(widget);
          var newVTree = createSvgElement('g');

          for (var ni = 0; ni < vnodes.length; ni++) {
            newVTree.appendChild(vnodes[ni]);
          }

          var widgetGroup = widgetToSvgMap.get(widget);
          var node = widgetGroup;
          var patchFns = diff(oldVTree, newVTree);

          for (var j = 0; j < patchFns.length; j++) {
            node = patchFns[j](node);
          }

          if (!widgetGroup && node) {
            // add
            model.svgRoot.appendChild(node);
            widgetToSvgMap.set(widget, node);
          } else if (widgetGroup && !node) {
            // delete
            widgetGroup.remove();
            widgetToSvgMap.delete(widget);
          }

          svgVTrees.set(widget, newVTree);
        });
      };

      for (var i = 0; i < model.widgets.length; i++) {
        _loop(i);
      }
    }
  } // --------------------------------------------------------------------------
  // Widget scaling
  // --------------------------------------------------------------------------


  function updateDisplayScaleParams() {
    var _apiSpecificRenderWindow = model._apiSpecificRenderWindow,
        _camera = model._camera,
        _renderer = model._renderer;

    if (_renderer && _apiSpecificRenderWindow && _camera) {
      var _apiSpecificRenderWin = _apiSpecificRenderWindow.getSize(),
          _apiSpecificRenderWin2 = _slicedToArray(_apiSpecificRenderWin, 2),
          rwW = _apiSpecificRenderWin2[0],
          rwH = _apiSpecificRenderWin2[1];

      var _renderer$getViewport = _renderer.getViewport(),
          _renderer$getViewport2 = _slicedToArray(_renderer$getViewport, 4),
          vxmin = _renderer$getViewport2[0],
          vymin = _renderer$getViewport2[1],
          vxmax = _renderer$getViewport2[2],
          vymax = _renderer$getViewport2[3];

      var pixelRatio = _apiSpecificRenderWindow.getComputedDevicePixelRatio();

      var rendererPixelDims = [rwW * (vxmax - vxmin) / pixelRatio, rwH * (vymax - vymin) / pixelRatio];

      var cameraPosition = _camera.getPosition();

      var cameraDir = _camera.getDirectionOfProjection();

      var isParallel = _camera.getParallelProjection();

      var dispHeightFactor = isParallel ? 2 * _camera.getParallelScale() : 2 * Math.tan(radiansFromDegrees(_camera.getViewAngle()) / 2);
      model.widgets.forEach(function (w) {
        w.getNestedProps().forEach(function (r) {
          if (r.getScaleInPixels()) {
            r.setDisplayScaleParams({
              dispHeightFactor: dispHeightFactor,
              cameraPosition: cameraPosition,
              cameraDir: cameraDir,
              isParallel: isParallel,
              rendererPixelDims: rendererPixelDims
            });
          }
        });
      });
    }
  } // --------------------------------------------------------------------------
  // API public
  // --------------------------------------------------------------------------


  function updateSelection(_x, _x2, _x3) {
    return _updateSelection.apply(this, arguments);
  }

  function _updateSelection() {
    _updateSelection = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(callData, fromTouchEvent, callID) {
      var position, _yield$publicAPI$getS, requestCount, selectedState, representation, widget, activateHandle, i, w;

      return _regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              activateHandle = function _activateHandle(w) {
                if (fromTouchEvent) {
                  // release any previous left button interaction
                  model._interactor.invokeLeftButtonRelease(callData);
                }

                w.activateHandle({
                  selectedState: selectedState,
                  representation: representation
                });

                if (fromTouchEvent) {
                  // re-trigger the left button press to pick the now-active widget
                  model._interactor.invokeLeftButtonPress(callData);
                }
              };

              position = callData.position;
              _context3.next = 4;
              return publicAPI.getSelectedDataForXY(position.x, position.y);

            case 4:
              _yield$publicAPI$getS = _context3.sent;
              requestCount = _yield$publicAPI$getS.requestCount;
              selectedState = _yield$publicAPI$getS.selectedState;
              representation = _yield$publicAPI$getS.representation;
              widget = _yield$publicAPI$getS.widget;

              if (!(requestCount || callID !== model._currentUpdateSelectionCallID)) {
                _context3.next = 11;
                break;
              }

              return _context3.abrupt("return");

            case 11:
              // Default cursor behavior
              model._apiSpecificRenderWindow.setCursor(widget ? 'pointer' : 'default');

              if (model.widgetInFocus === widget && widget.hasFocus()) {
                activateHandle(widget); // Ken FIXME

                model._interactor.render();

                model._interactor.render();
              } else {
                for (i = 0; i < model.widgets.length; i++) {
                  w = model.widgets[i];

                  if (w === widget && w.getNestedPickable()) {
                    activateHandle(w);
                    model.activeWidget = w;
                  } else {
                    w.deactivateAllHandles();
                  }
                } // Ken FIXME


                model._interactor.render();

                model._interactor.render();
              }

            case 13:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));
    return _updateSelection.apply(this, arguments);
  }

  var handleEvent = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(callData) {
      var fromTouchEvent,
          callID,
          _args = arguments;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              fromTouchEvent = _args.length > 1 && _args[1] !== undefined ? _args[1] : false;

              if (!(!model.isAnimating && model.pickingEnabled)) {
                _context.next = 6;
                break;
              }

              callID = Symbol('UpdateSelection');
              model._currentUpdateSelectionCallID = callID;
              _context.next = 6;
              return updateSelection(callData, fromTouchEvent, callID);

            case 6:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function handleEvent(_x4) {
      return _ref.apply(this, arguments);
    };
  }();

  function updateWidgetForRender(w) {
    w.updateRepresentationForRender(model.renderingType);
  }

  function renderPickingBuffer() {
    model.renderingType = RenderingTypes.PICKING_BUFFER;
    model.widgets.forEach(updateWidgetForRender);
  }

  function renderFrontBuffer() {
    model.renderingType = RenderingTypes.FRONT_BUFFER;
    model.widgets.forEach(updateWidgetForRender);
  }

  function captureBuffers(_x5, _x6, _x7, _x8) {
    return _captureBuffers.apply(this, arguments);
  }

  function _captureBuffers() {
    _captureBuffers = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(x1, y1, x2, y2) {
      return _regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              if (!model._captureInProgress) {
                _context4.next = 2;
                break;
              }

              return _context4.abrupt("return");

            case 2:
              model._captureInProgress = true;
              renderPickingBuffer();
              model._capturedBuffers = null;
              _context4.next = 7;
              return model._selector.getSourceDataAsync(model._renderer, x1, y1, x2, y2);

            case 7:
              model._capturedBuffers = _context4.sent;
              model.previousSelectedData = null;
              renderFrontBuffer();
              model._captureInProgress = false;

            case 11:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4);
    }));
    return _captureBuffers.apply(this, arguments);
  }

  publicAPI.enablePicking = function () {
    model.pickingEnabled = true;
    publicAPI.renderWidgets();
  };

  publicAPI.renderWidgets = function () {
    if (model.pickingEnabled && model.captureOn === CaptureOn.MOUSE_RELEASE) {
      var _model$_apiSpecificRe3 = model._apiSpecificRenderWindow.getSize(),
          _model$_apiSpecificRe4 = _slicedToArray(_model$_apiSpecificRe3, 2),
          w = _model$_apiSpecificRe4[0],
          h = _model$_apiSpecificRe4[1];

      captureBuffers(0, 0, w, h);
    }

    renderFrontBuffer();
    publicAPI.modified();
  };

  publicAPI.disablePicking = function () {
    model.pickingEnabled = false;
  };

  //--------------------------------------------------------------------------
  // 设置renderer
  publicAPI.setRenderer = function (renderer) {
    // 根据renderer拿到camera, renderer, renderWindow, interactor, apiSpecificRenderWindow
    // 作为属性添加到model上供后续使用, 因此setRenderer只需要初始时调用一次
    var renderingComponents = extractRenderingComponents(renderer);
    //将renderingComponents对象合并到model中
    Object.assign(model, renderingComponents);
    // 把所有属性名加上下划线, 如 model.renderer -> model._renderer
    macro.moveToProtected({}, model, Object.keys(renderingComponents));
    // 此时的setGet取不到这些属性, 即外部不可访问
    while (subscriptions.length) {
      // 如果之前有设置过任何回调, 这些回调都是跟指定的renderer相关的, 需要全部删除再重新添加,
      // 所以设置任何回调都要保存在subscriptions中
      subscriptions.pop().unsubscribe();
    }
    // model._selector用于后续pickup使用
    model._selector = model._apiSpecificRenderWindow.createSelector();

    model._selector.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_POINTS);

    // 在渲染时更新svg(使用了diff算法)
    // 注意所有的on函数都属于挂钩子, 在interactor触发某个事件时这些钩子会依次被调用
    // 比如下面的updateSvg猜测是在render()时调用
    // 具体解析看reDesignInteractorStyleImage文件
    subscriptions.push(model._interactor.onRenderEvent(updateSvg));
    subscriptions.push(renderer.onModified(setSvgRootStyle));
    setSvgRootStyle();
    subscriptions.push(model._apiSpecificRenderWindow.onModified(setSvgSize));
    setSvgSize();
    subscriptions.push(model._apiSpecificRenderWindow.onModified(updateDisplayScaleParams));
    subscriptions.push(model._camera.onModified(updateDisplayScaleParams));
    updateDisplayScaleParams();
    subscriptions.push(model._interactor.onStartAnimation(function () {
      model.isAnimating = true;
    }));
    subscriptions.push(model._interactor.onEndAnimation(function () {
      model.isAnimating = false;
      publicAPI.renderWidgets();
    }));
    subscriptions.push(model._interactor.onMouseMove(function (eventData) {
      handleEvent(eventData);
      return macro.VOID;
    })); // must be handled after widgets, hence the given priority.

    subscriptions.push(model._interactor.onLeftButtonPress(function (eventData) {
      var deviceType = eventData.deviceType;
      var touchEvent = deviceType === 'touch' || deviceType === 'pen'; // only try selection if the left button press is from touch.

      if (touchEvent) {
        handleEvent(eventData, touchEvent);
      }

      return macro.VOID;
    }, WIDGET_PRIORITY / 2));
    publicAPI.modified();

    if (model.pickingEnabled) {
      publicAPI.enablePicking();
    }

    if (model.useSvgLayer) {
      enableSvgLayer();
    }
  };

  function addWidgetInternal(viewWidget) {
    viewWidget.setWidgetManager(publicAPI);
    updateWidgetWeakMap(viewWidget);
    updateDisplayScaleParams(); // Register to renderer

    model._renderer.addActor(viewWidget);
  }

  publicAPI.addWidget = function (widget, viewType, initialValues) {
    if (!model._renderer) {
      vtkErrorMacro('Widget manager MUST BE link to a view before registering widgets');
      return null;
    }

    var viewId = model.viewId,
        _renderer = model._renderer;
    //AbstractWidgetFactory
    var w = widget.getWidgetForView({
      viewId: viewId,
      renderer: _renderer,
      viewType: viewType || ViewTypes.DEFAULT,
      initialValues: initialValues
    });

    if (w != null && model.widgets.indexOf(w) === -1) {
      model.widgets.push(w);
      addWidgetInternal(w);
      publicAPI.modified();
    }

    return w;
  };

  function removeWidgetInternal(viewWidget) {
    model._renderer.removeActor(viewWidget);

    removeFromSvgLayer(viewWidget);
    viewWidget.delete();
  }

  function onWidgetRemoved() {
    model._renderer.getRenderWindow().getInteractor().render();

    publicAPI.renderWidgets();
  }

  publicAPI.removeWidgets = function () {
    model.widgets.forEach(removeWidgetInternal);
    model.widgets = [];
    model.widgetInFocus = null;
    onWidgetRemoved();
  };

  publicAPI.removeWidget = function (widget) {
    var viewWidget = getViewWidget(widget);
    var index = model.widgets.indexOf(viewWidget);

    if (index !== -1) {
      model.widgets.splice(index, 1);
      var isWidgetInFocus = model.widgetInFocus === viewWidget;

      if (isWidgetInFocus) {
        publicAPI.releaseFocus();
      }

      removeWidgetInternal(viewWidget);
      onWidgetRemoved();
    }
  };

  publicAPI.getSelectedDataForXY = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(x, y) {
      var i, widget, hoveredSVGReps, selection, capturedRegion;
      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              model.selections = null;

              if (!model.pickingEnabled) {
                _context2.next = 24;
                break;
              }

              i = 0;

            case 3:
              if (!(i < model.widgets.length)) {
                _context2.next = 16;
                break;
              }

              widget = model.widgets[i];
              hoveredSVGReps = widget.getRepresentations().filter(function (r) {
                return r.isA('vtkSVGRepresentation') && r.getHover() != null;
              });

              if (!hoveredSVGReps.length) {
                _context2.next = 13;
                break;
              }

              selection = vtkSelectionNode.newInstance();
              selection.getProperties().compositeID = hoveredSVGReps[0].getHover();
              selection.getProperties().widget = widget;
              selection.getProperties().representation = hoveredSVGReps[0];
              model.selections = [selection];
              return _context2.abrupt("return", publicAPI.getSelectedData());

            case 13:
              ++i;
              _context2.next = 3;
              break;

            case 16:
              if (!(!model._capturedBuffers || model.captureOn === CaptureOn.MOUSE_MOVE)) {
                _context2.next = 19;
                break;
              }

              _context2.next = 19;
              return captureBuffers(x, y, x, y);

            case 19:
              // or do we need a pixel that is outside the last capture?
              capturedRegion = model._capturedBuffers.area;

              if (!(x < capturedRegion[0] || x > capturedRegion[2] || y < capturedRegion[1] || y > capturedRegion[3])) {
                _context2.next = 23;
                break;
              }

              _context2.next = 23;
              return captureBuffers(x, y, x, y);

            case 23:
              model.selections = model._capturedBuffers.generateSelection(x, y, x, y);

            case 24:
              return _context2.abrupt("return", publicAPI.getSelectedData());

            case 25:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    return function (_x9, _x10) {
      return _ref2.apply(this, arguments);
    };
  }();

  publicAPI.updateSelectionFromXY = function (x, y) {
    vtkWarningMacro('updateSelectionFromXY is deprecated, please use getSelectedDataForXY');

    if (model.pickingEnabled) {
      // First pick SVG representation
      for (var i = 0; i < model.widgets.length; ++i) {
        var widget = model.widgets[i];
        var hoveredSVGReps = widget.getRepresentations().filter(function (r) {
          return r.isA('vtkSVGRepresentation') && r.getHover() != null;
        });

        if (hoveredSVGReps.length) {
          var selection = vtkSelectionNode.newInstance();
          selection.getProperties().compositeID = hoveredSVGReps[0].getHover();
          selection.getProperties().widget = widget;
          selection.getProperties().representation = hoveredSVGReps[0];
          model.selections = [selection];
          return;
        }
      } // Then pick regular representations.


      if (model.captureOn === CaptureOn.MOUSE_MOVE) {
        captureBuffers(x, y, x, y);
      }
    }
  };

  publicAPI.updateSelectionFromMouseEvent = function (event) {
    vtkWarningMacro('updateSelectionFromMouseEvent is deprecated, please use getSelectedDataForXY');
    var pageX = event.pageX,
        pageY = event.pageY;

    var _model$_apiSpecificRe5 = model._apiSpecificRenderWindow.getCanvas().getBoundingClientRect(),
        top = _model$_apiSpecificRe5.top,
        left = _model$_apiSpecificRe5.left,
        height = _model$_apiSpecificRe5.height;

    var x = pageX - left;
    var y = height - (pageY - top);
    publicAPI.updateSelectionFromXY(x, y);
  };

  publicAPI.getSelectedData = function () {
    if (!model.selections || !model.selections.length) {
      model.previousSelectedData = null;
      return {};
    }

    var _model$selections$0$g = model.selections[0].getProperties(),
        propID = _model$selections$0$g.propID,
        compositeID = _model$selections$0$g.compositeID,
        prop = _model$selections$0$g.prop;

    var _model$selections$0$g2 = model.selections[0].getProperties(),
        widget = _model$selections$0$g2.widget,
        representation = _model$selections$0$g2.representation; // prop is undefined for SVG representation, widget is undefined for handle
    // representation.


    if (model.previousSelectedData && model.previousSelectedData.prop === prop && model.previousSelectedData.widget === widget && model.previousSelectedData.compositeID === compositeID) {
      model.previousSelectedData.requestCount++;
      return model.previousSelectedData;
    }

    if (propsWeakMap.has(prop)) {
      var props = propsWeakMap.get(prop);
      widget = props.widget;
      representation = props.representation;
    }

    if (widget && representation) {
      var selectedState = representation.getSelectedState(prop, compositeID);
      model.previousSelectedData = {
        requestCount: 0,
        propID: propID,
        compositeID: compositeID,
        prop: prop,
        widget: widget,
        representation: representation,
        selectedState: selectedState
      };
      return model.previousSelectedData;
    }

    model.previousSelectedData = null;
    return {};
  };

  publicAPI.grabFocus = function (widget) {
    var viewWidget = getViewWidget(widget);

    if (model.widgetInFocus && model.widgetInFocus !== viewWidget) {
      model.widgetInFocus.loseFocus();
    }

    model.widgetInFocus = viewWidget;

    if (model.widgetInFocus) {
      model.widgetInFocus.grabFocus();
    }
  };

  publicAPI.releaseFocus = function () {
    return publicAPI.grabFocus(null);
  };

  publicAPI.setUseSvgLayer = function (useSvgLayer) {
    if (useSvgLayer !== model.useSvgLayer) {
      model.useSvgLayer = useSvgLayer;

      if (model._renderer) {
        if (useSvgLayer) {
          enableSvgLayer(); // force a render so svg widgets can be drawn

          updateSvg();
        } else {
          disableSvgLayer();
        }
      }

      return true;
    }

    return false;
  };

  var superDelete = publicAPI.delete;

  publicAPI.delete = function () {
    while (subscriptions.length) {
      subscriptions.pop().unsubscribe();
    }

    superDelete();
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  // _camera: null,
  // _selector: null,
  // _currentUpdateSelectionCallID: null,
  viewId: null,
  widgets: [],
  renderer: null,
  viewType: ViewTypes.DEFAULT,
  isAnimating: false,
  pickingEnabled: true,
  selections: null,
  previousSelectedData: null,
  widgetInFocus: null,
  useSvgLayer: true,
  captureOn: CaptureOn.MOUSE_MOVE
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['captureOn', {
    type: 'enum',
    name: 'viewType',
    enum: ViewTypes
  }]);
  macro.get(publicAPI, model, ['selections', 'widgets', 'viewId', 'pickingEnabled', 'useSvgLayer']); // Object specific methods

  vtkWidgetManager(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkWidgetManager'); // ----------------------------------------------------------------------------

var vtkWidgetManager$1 = {
  newInstance: newInstance,
  extend: extend,
  Constants: WidgetManagerConst
};

export { vtkWidgetManager$1 as default, extend, extractRenderingComponents, newInstance };
