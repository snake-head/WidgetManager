import { e as distance2BetweenPoints } from '@kitware/vtk.js/Common/Core/Math/index.js';
import vtkAbstractWidgetFactory from '../Core/AbstractWidgetFactory.js';
import vtkPlanePointManipulator from '@kitware/vtk.js/Widgets/Manipulators/PlaneManipulator.js';
import vtkSphereHandleRepresentation from '../Representations/SphereHandleRepresentation.js';
import vtkSphereContextRepresentation from '@kitware/vtk.js/Widgets/Representations/SphereContextRepresentation.js';
import { m as macro } from '@kitware/vtk.js/macros2.js';
import widgetBehavior from './SphereWidget/behavior.js';
import stateGenerator from './SphereWidget/state.js';

function vtkSphereWidget(publicAPI, model) {
  model.classHierarchy.push('vtkSphereWidget');
  const superClass = {
    ...publicAPI
  };
  model.methodsToLink = ['scaleInPixels'];
  publicAPI.getRepresentationsForViewType = viewType => [{
    builder: vtkSphereHandleRepresentation,
    labels: ['centerHandle'],
    initialValues: {
      activeColor: model.activeColor,
      activeScaleFactor: model.activeScaleFactor,
      dependingPoints: model.dependingPoints,
    }
  }];

  // --- Public methods -------------------------------------------------------

  publicAPI.getRadius = () => {
    const h1 = model.widgetState.getCenterHandle();
    return 1;
  };
  publicAPI.setManipulator = manipulator => {
    superClass.setManipulator(manipulator);
    model.widgetState.getCenterHandle().setManipulator(manipulator);
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
  vtkSphereWidget(publicAPI, model);
}
const newInstance = macro.newInstance(extend, 'vtkSphereWidget');
var vtkSphereWidget$1 = {
  newInstance,
  extend
};

export { vtkSphereWidget$1 as default, extend, newInstance };
