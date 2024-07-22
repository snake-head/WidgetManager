/*
 * @Description: 
 * @Version: 1.0
 * @Autor: ZhuYichen
 * @Date: 2024-05-10 10:10:42
 * @LastEditors: ZhuYichen
 * @LastEditTime: 2024-07-09 15:38:56
 */
import macro from '@kitware/vtk.js/macros.js';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor.js';
import vtkGlyphRepresentation from '@kitware/vtk.js/Widgets/Representations/GlyphRepresentation.js';
import vtkCustomSource from '../../Filters/Sources/CustomSource.js';
import vtkPixelSpaceCallbackMapper from '@kitware/vtk.js/Rendering/Core/PixelSpaceCallbackMapper.js';

function vtkBracketHandleRepresentation(publicAPI, model) {
    // Set our className
    model.classHierarchy.push('vtkBracketHandleRepresentation');
  
    // --------------------------------------------------------------------------
    // Generic rendering pipeline
    // --------------------------------------------------------------------------
  
    /*
     * displayActors and displayMappers are used to render objects in HTML, allowing objects
     * to be 'rendered' internally in a VTK scene without being visible on the final output
     */
  
    model.displayMapper = vtkPixelSpaceCallbackMapper.newInstance();
    model.displayActor = vtkActor.newInstance({
      parentProp: publicAPI
    });
    // model.displayActor.getProperty().setOpacity(0); // don't show in 3D
    model.displayActor.setMapper(model.displayMapper);
    model.displayMapper.setInputConnection(publicAPI.getOutputPort());
    publicAPI.addActor(model.displayActor);
    model.alwaysVisibleActors = [model.displayActor];
  
    // --------------------------------------------------------------------------
  
    function callbackProxy(coords) {
      if (model.displayCallback) {
        const filteredList = [];
        const states = publicAPI.getRepresentationStates();
        for (let i = 0; i < states.length; i++) {
          if (states[i].getActive()) {
            filteredList.push(coords[i]);
          }
        }
        if (filteredList.length) {
          model.displayCallback(filteredList);
          return;
        }
      }
      model.displayCallback();
    }
    publicAPI.setDisplayCallback = callback => {
      model.displayCallback = callback;
      model.displayMapper.setCallback(callback ? callbackProxy : null);
    };
  }
  
  // ----------------------------------------------------------------------------
  // Object factory
  // ----------------------------------------------------------------------------
  
  // ----------------------------------------------------------------------------
  function defaultValues(initialValues) {
    return {
      _pipeline: {
        glyph: vtkCustomSource.newInstance(initialValues)
      },
      ...initialValues
    };
  }
  function extend(publicAPI, model) {
    let initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    vtkGlyphRepresentation.extend(publicAPI, model, defaultValues(initialValues));
    // Object specific methods
    vtkBracketHandleRepresentation(publicAPI, model);
  }
  // ----------------------------------------------------------------------------
  
  const newInstance = macro.newInstance(extend, 'vtkBracketHandleRepresentation');
  
  // ----------------------------------------------------------------------------
  
  var vtkBracketHandleRepresentation$1 = {
    newInstance,
    extend
  };
  
  export { vtkBracketHandleRepresentation$1 as default, extend, newInstance };
  