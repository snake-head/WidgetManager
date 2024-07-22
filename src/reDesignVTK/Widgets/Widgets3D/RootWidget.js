/*
 * @Description: 
 * @Version: 1.0
 * @Autor: ZhuYichen
 * @Date: 2024-07-03 10:55:43
 * @LastEditors: ZhuYichen
 * @LastEditTime: 2024-07-04 16:26:06
 */
import { e as distance2BeSpheretweenPoints } from '@kitware/vtk.js/Common/Core/Math/index.js';
import vtkAbstractWidgetFactory from '../Core/AbstractWidgetFactory.js';
import vtkPlanePointManipulator from '@kitware/vtk.js/Widgets/Manipulators/PlaneManipulator.js';
import vtkRootHandleRepresentation from '../Representations/RootHandleRepresentation.js';
import vtkPolyLineRepresentation from '@kitware/vtk.js/Widgets/Representations/PolyLineRepresentation.js';
import vtkConeRepresentation from '../Representations/ConeRepresentation.js';
import { m as macro } from '@kitware/vtk.js/macros2.js';
import widgetBehavior from './RootWidget/behavior.js';
import stateGenerator from './RootWidget/state.js';

function vtkRootWidget(publicAPI, model) {
  model.classHierarchy.push('vtkRootWidget');
  const superClass = {
    ...publicAPI
  };
  model.methodsToLink = ['scaleInPixels'];
  publicAPI.getRepresentationsForViewType = viewType => [{
    builder: vtkRootHandleRepresentation,
    labels: ['bottomSphereCenterHandle'],
    initialValues: {
      activeColor: model.activeColor,
      activeScaleFactor: model.activeScaleFactor,
    }
  },
  {
    builder: vtkRootHandleRepresentation,
    labels: ['topSphereCenterHandle'],
    initialValues: {
      activeColor: model.activeColor,
      activeScaleFactor: model.activeScaleFactor,
    }
  },
  {
    builder: vtkRootHandleRepresentation,
    labels: ['radiusSphereCenterHandle'],
    initialValues: {
      activeColor: model.activeColor,
      activeScaleFactor: model.activeScaleFactor,
    }
  }, {
    builder: vtkPolyLineRepresentation,
    labels: ['bottomSphereCenterHandle', 'topSphereCenterHandle'],
    initialValues: {
      lineThickness: 0.02
    }
  }, {
    builder: vtkPolyLineRepresentation,
    labels: ['bottomSphereCenterHandle', 'radiusSphereCenterHandle'],
    initialValues: {
      lineThickness: 0.02
    }
  }, {
    builder: vtkConeRepresentation,
    labels: ['bottomSphereCenterHandle', 'topSphereCenterHandle', 'radiusSphereCenterHandle']
  }
];

  // --- Public methods -------------------------------------------------------

  publicAPI.getRadius = () => {
    const h1 = model.widgetState.getCenterHandle();
    return 1;
  };
  publicAPI.setManipulator = manipulator => {
    superClass.setManipulator(manipulator);
    model.widgetState.getBottomSphereCenterHandle().setManipulator(manipulator);
    model.widgetState.getTopSphereCenterHandle().setManipulator(manipulator);
    model.widgetState.getRadiusSphereCenterHandle().setManipulator(manipulator);
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  publicAPI.setManipulator(model.manipulator || vtkPlanePointManipulator.newInstance({
    useCameraNormal: true
  }));
}
const defaultValues = initialValues => ({
  behavior: widgetBehavior,
  widgetState: stateGenerator(),
  ...initialValues
});
function extend(publicAPI, model) {
  let initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, defaultValues(initialValues));
  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['manipulator', 'widgetState']);
  vtkRootWidget(publicAPI, model);
}
const newInstance = macro.newInstance(extend, 'vtkRootWidget');
var vtkRootWidget$1 = {
  newInstance,
  extend
};

export { vtkRootWidget$1 as default, extend, newInstance };
