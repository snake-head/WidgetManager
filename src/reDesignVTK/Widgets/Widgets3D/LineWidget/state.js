import vtkStateBuilder from '@kitware/vtk.js/Widgets/Core/StateBuilder.js';

// separately from the rest of the widget state.

var linePosState = vtkStateBuilder.createBuilder().addField({
  name: 'posOnLine',
  initialValue: 0.5
}).build();
function generateState() {
  return vtkStateBuilder.createBuilder().addStateFromMixin({
    labels: ['moveHandle'],
    mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator', 'shape'],
    name: 'moveHandle',
    initialValues: {
      scale1: 30,
      visible: true
    }
  }).addStateFromMixin({
    labels: ['handle1'],
    mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator', 'shape'],
    name: 'handle1',
    initialValues: {
      scale1: 30
    }
  }).addStateFromMixin({
    labels: ['handle2'],
    mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator', 'shape'],
    name: 'handle2',
    initialValues: {
      scale1: 30
    }
  }).addStateFromMixin({
    labels: ['SVGtext'],
    mixins: ['origin', 'color', 'text', 'visible'],
    name: 'text',
    initialValues: {
      /* text is empty to set a text filed in the SVGLayer and to avoid
       * displaying text before positioning the handles */
      text: ''
    }
  }).addStateFromInstance({
    name: 'positionOnLine',
    instance: linePosState
  }).addField({
    name: 'lineThickness'
  }).build();
}

export { generateState as default };
