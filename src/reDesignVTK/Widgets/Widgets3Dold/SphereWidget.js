import _defineProperty from '@babel/runtime/helpers/defineProperty';
import { f as distance2BetweenPoints } from '@kitware/vtk.js/Common/Core/Math/index.js';
import vtkAbstractWidgetFactory from '../Core/AbstractWidgetFactory.js';
import vtkPlanePointManipulator from '@kitware/vtk.js/Widgets/Manipulators/PlaneManipulator.js';
import vtkSphereHandleRepresentation from '../Representations/SphereHandleRepresentation.js';
import vtkSphereContextRepresentation from '@kitware/vtk.js/Widgets/Representations/SphereContextRepresentation.js';
import macro from '@kitware/vtk.js/macros.js';
import widgetBehavior from '../Widgets3Dold/SphereWidget/behavior.js';
import stateGenerator from '../Widgets3Dold/SphereWidget/state.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function vtkSphereWidget(publicAPI, model) {
  model.classHierarchy.push('vtkSphereWidget');

  var superClass = _objectSpread({}, publicAPI);

  model.methodsToLink = ['scaleInPixels'];
  // SphereWidget由4个handle组成
  publicAPI.getRepresentationsForViewType = function (viewType) {
    return [
      // 控制handle生成的交互，若不返回，则无法正常通过单击生成center与border
      // 但可以直接通过设置圆心半径来生成球
      // {
      //   builder: vtkSphereHandleRepresentation,
      //   labels: ['moveHandle']
      // }, 
      // 球心handle，不返回可以正常生成，但球心不会显示
      {
        builder: vtkSphereHandleRepresentation,
        labels: ['centerHandle'],
        initialValues: {
          radius: 0.25,
        }
        // 可以带initalValues
      }, 
      // 半径handle，不返回可以正常生成，但半径点不会显示
      // {
      //   builder: vtkSphereHandleRepresentation,
      //   labels: ['borderHandle']
      // },
      // 球体handle，不返回可以正常生成，但球体不会显示
      // {
      //   builder: vtkSphereContextRepresentation,
      //   labels: ['sphereHandle']
      // }
  ];
  }; // --- Public methods -------------------------------------------------------


  publicAPI.getRadius = function () {
    var h1 = model.widgetState.getCenterHandle();
    var h2 = model.widgetState.getBorderHandle();
    var h3 = model.widgetState.getSphereHandle();
    h1.setOrigin([0,0,0]);
    
    return Math.sqrt(distance2BetweenPoints(h1.getOrigin(), h2.getOrigin()));
  };

  publicAPI.setManipulator = function (manipulator) {
    superClass.setManipulator(manipulator);
    model.widgetState.getMoveHandle().setManipulator(manipulator);
    model.widgetState.getCenterHandle().setManipulator(manipulator);
    // model.widgetState.getBorderHandle().setManipulator(manipulator);
  }; // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------


  publicAPI.setManipulator(model.manipulator || vtkPlanePointManipulator.newInstance({
    useCameraNormal: true
  }));
}

var defaultValues = function defaultValues(initialValues) {
  return _objectSpread({
    behavior: widgetBehavior,
    widgetState: stateGenerator()
  }, initialValues);
};

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, defaultValues(initialValues));
  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['manipulator', 'widgetState']);
  vtkSphereWidget(publicAPI, model);
}
var newInstance = macro.newInstance(extend, 'vtkSphereWidget');
var index = {
  newInstance: newInstance,
  extend: extend
};

export { index as default, extend, newInstance };
