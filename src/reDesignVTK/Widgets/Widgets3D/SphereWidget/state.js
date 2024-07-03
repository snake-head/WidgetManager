/*
 * @Description: 
 * @Version: 1.0
 * @Autor: ZhuYichen
 * @Date: 2024-06-14 12:20:56
 * @LastEditors: ZhuYichen
 * @LastEditTime: 2024-06-14 15:36:23
 */
import vtkStateBuilder from '@kitware/vtk.js/Widgets/Core/StateBuilder.js';

// Defines the structure of the widget state.
// See https://kitware.github.io/vtk-js/docs/concepts_widgets.html.
function stateGenerator() {
  return vtkStateBuilder.createBuilder()
  // The handle for the center of the sphere.
  .addStateFromMixin({
    labels: ['centerHandle'],
    mixins: ['origin', 'color3', 'scale1', 'visible', 'manipulator'],
    name: 'centerHandle',
    initialValues: {
      scale1: 20,
      visible: true,
      color3: [64, 64, 204],
    }
  }).build();
}

export { stateGenerator as default };
