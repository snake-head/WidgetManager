import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import _defineProperty from '@babel/runtime/helpers/defineProperty';
import macro from '@kitware/vtk.js/macros.js';
import vtkAbstractWidget from './AbstractWidget.js';
import { extractRenderingComponents } from './WidgetManager.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function NoOp() {} // ----------------------------------------------------------------------------


function vtkAbstractWidgetFactory(publicAPI, model) {
  model.classHierarchy.push('vtkAbstractWidgetFactory'); // DO NOT share on the model ------------------------------------------------

  var viewToWidget = {}; // DO NOT share on the model ------------------------------------------------
  // Can be called with just ViewId after the widget has been registered

  publicAPI.getWidgetForView = function (_ref) {
    var viewId = _ref.viewId,
        renderer = _ref.renderer,
        viewType = _ref.viewType,
        initialValues = _ref.initialValues;
    if (!viewToWidget[viewId]) {
      if (!renderer) {
        return null;
      }

      var _extractRenderingComp = extractRenderingComponents(renderer),
          interactor = _extractRenderingComp.interactor,
          apiSpecificRenderWindow = _extractRenderingComp.apiSpecificRenderWindow,
          camera = _extractRenderingComp.camera;

      var widgetModel = {};
      var widgetPublicAPI = {};
      macro.obj(widgetPublicAPI, widgetModel);
      Object.assign(widgetPublicAPI, {
        onWidgetChange: publicAPI.onWidgetChange
      });
      // 把一些属性添加到widgetModel上, 包括renderer、camera等
      // 并且factory把这里的整个publicAPI方法都存下来了
      Object.assign(widgetModel, {
        widgetState: model.widgetState,
        manipulator: model.manipulator,
        viewType: viewType,
        renderer: renderer,
        camera: camera,
        apiSpecificRenderWindow: apiSpecificRenderWindow,
        factory: publicAPI
      });
      // 实际操作时把widgetModel里的4个属性加上前置下划线
      // 如 widgetModel._renderer = widgetModel.renderer, delete widgetModel.renderer
      // 可能是这样一般的getset就不能直接作用于该属性了
      macro.moveToProtected(widgetPublicAPI, widgetModel, ['renderer', 'camera', 'apiSpecificRenderWindow', 'factory']);
      // safeArrays的主要操作是把widgetModel中所有的数组做一次深拷贝, 比如classHierarchy
      // 遍历key, 如果widgetModel[key]是数组, 则
      // widgetModel[key] = [].concat(model[key])
      macro.safeArrays(widgetModel);
      vtkAbstractWidget.extend(widgetPublicAPI, widgetModel, initialValues); // Create representations for that view
      // 原型链: vtkProp->vtkInteractorObserver->vtkAbstractWidget
      // 此时widgetModel的classHierarchy = ['vtkObject', 'vtkProp', 'vtkInteractorObserver', 'vtkAbstractWidget']

      /* eslint-disable no-shadow */
      // Create representations for that view
      // 开始向widget上添加representations, 这里球的representations有4种，但这里只需要球心即可
      // getRepresentationsForViewType()在widget文件中
      var widgetInitialValues = initialValues; // Avoid shadowing

      widgetModel.representations = publicAPI.getRepresentationsForViewType(viewType).map(function (_ref2) {
        var builder = _ref2.builder,
            labels = _ref2.labels,
            initialValues = _ref2.initialValues;
        return builder.newInstance(_objectSpread(_objectSpread({
          _parentProp: widgetPublicAPI,
          labels: labels
        }, initialValues), widgetInitialValues));
      });
      /* eslint-enable no-shadow */
      widgetModel.representations.forEach(function (r) {
        r.setInputData(widgetModel.widgetState);
        r.getActors().forEach(function (actor) {
          widgetModel.actorToRepresentationMap.set(actor, r);
        });
      });
      // 重要: 向widgetPublicAPI, widgetModel上添加方法和属性, 具体都在behavior.js中
      
      model.behavior(widgetPublicAPI, widgetModel); // Forward representation methods
      widgetModel.dependingPoints = model.dependingPoints;
      
      ['coincidentTopologyParameters'].concat(_toConsumableArray(model.methodsToLink || [])).forEach(function (methodName) {
        var _methods;

        var set = "set".concat(macro.capitalize(methodName));
        var get = "get".concat(macro.capitalize(methodName));
        var methods = (_methods = {}, _defineProperty(_methods, methodName, []), _defineProperty(_methods, set, []), _defineProperty(_methods, get, []), _methods);
        widgetModel.representations.forEach(function (representation) {
          if (representation[methodName]) {
            methods[methodName].push(representation[methodName]);
          }

          if (representation[set]) {
            methods[set].push(representation[set]);
          }

          if (representation[get]) {
            methods[get].push(representation[get]);
          }
        });
        Object.keys(methods).forEach(function (name) {
          var calls = methods[name];

          if (calls.length === 1) {
            widgetPublicAPI[name] = calls[0];
          } else if (calls.length > 1) {
            widgetPublicAPI[name] = macro.chain.apply(macro, _toConsumableArray(calls));
          }
        });
      }); // Custom delete to detach from parent

      widgetPublicAPI.delete = macro.chain(function () {
        delete viewToWidget[viewId];
      }, widgetPublicAPI.delete);
      widgetPublicAPI.setInteractor(interactor);
      var viewWidget = Object.freeze(widgetPublicAPI);
      viewToWidget[viewId] = viewWidget;
      return viewWidget;
    }
    console.log(viewToWidget[viewId])
    return viewToWidget[viewId];
  }; // List of all the views the widget has been registered to.


  publicAPI.getViewIds = function () {
    return Object.keys(viewToWidget);
  }; // --------------------------------------------------------------------------
  // Widget visibility / enable
  // --------------------------------------------------------------------------
  // Call methods on all its view widgets


  publicAPI.setVisibility = function (value) {
    var viewIds = Object.keys(viewToWidget);

    for (var i = 0; i < viewIds.length; i++) {
      viewToWidget[viewIds[i]].setVisibility(value);
    }
  };

  publicAPI.setPickable = function (value) {
    var viewIds = Object.keys(viewToWidget);

    for (var i = 0; i < viewIds.length; i++) {
      viewToWidget[viewIds[i]].setPickable(value);
    }
  };

  publicAPI.setDragable = function (value) {
    var viewIds = Object.keys(viewToWidget);

    for (var i = 0; i < viewIds.length; i++) {
      viewToWidget[viewIds[i]].setDragable(value);
    }
  };

  publicAPI.setContextVisibility = function (value) {
    var viewIds = Object.keys(viewToWidget);

    for (var i = 0; i < viewIds.length; i++) {
      viewToWidget[viewIds[i]].setContextVisibility(value);
    }
  };

  publicAPI.setHandleVisibility = function (value) {
    var viewIds = Object.keys(viewToWidget);

    for (var i = 0; i < viewIds.length; i++) {
      viewToWidget[viewIds[i]].setHandleVisibility(value);
    }
  }; // --------------------------------------------------------------------------
  // Place Widget API
  // --------------------------------------------------------------------------


  publicAPI.placeWidget = function (bounds) {
    return model.widgetState.placeWidget(bounds);
  };

  publicAPI.getPlaceFactor = function () {
    return model.widgetState.getPlaceFactor();
  };

  publicAPI.setPlaceFactor = function (factor) {
    return model.widgetState.setPlaceFactor(factor);
  }; // --------------------------------------------------------------------------
  // Event Widget API
  // --------------------------------------------------------------------------


  var unsubscribe = NoOp;
  publicAPI.delete = macro.chain(publicAPI.delete, function () {
    return unsubscribe();
  });

  if (model.widgetState) {
    unsubscribe = model.widgetState.onModified(function () {
      return publicAPI.invokeWidgetChange(model.widgetState);
    }).unsubscribe;
  }
} // ----------------------------------------------------------------------------


function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, initialValues);
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['widgetState']);
  macro.event(publicAPI, model, 'WidgetChange');
  vtkAbstractWidgetFactory(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkAbstractWidget'); // ----------------------------------------------------------------------------

var vtkAbstractWidgetFactory$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkAbstractWidgetFactory$1 as default, extend, newInstance };
