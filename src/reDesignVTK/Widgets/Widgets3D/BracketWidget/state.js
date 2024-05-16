/*
 * @Description: 
 * @Version: 1.0
 * @Autor: ZhuYichen
 * @Date: 2024-05-10 11:05:17
 * @LastEditors: ZhuYichen
 * @LastEditTime: 2024-05-10 13:23:23
 */
import vtkStateBuilder from '@kitware/vtk.js/Widgets/Core/StateBuilder.js';

// Defines the structure of the widget state.
// See https://kitware.github.io/vtk-js/docs/concepts_widgets.html.
function stateGenerator() {
    return vtkStateBuilder.createBuilder()
    // The handle used only for during initial placement.
    .addStateFromMixin({
      labels: ['centerHandle'],
      mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
      name: 'centerHandle',
      initialValues: {
        scale1: 20,
        visible: true
      }
    }).build();
  }
  
  export { stateGenerator as default };
  