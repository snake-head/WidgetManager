/*
 * @Description: 
 * @Version: 1.0
 * @Autor: ZhuYichen
 * @Date: 2024-05-10 11:05:05
 * @LastEditors: ZhuYichen
 * @LastEditTime: 2024-05-16 09:58:21
 */
import { m as macro } from '@kitware/vtk.js/macros2.js';
import { vec3 } from 'gl-matrix';

function widgetBehavior(publicAPI, model) {
    const state = model.widgetState;
    const centerHandle = state.getCenterHandle();
  
    // Set while moving the center or border handle.
    model._isDragging = false;
    // The last world coordinate of the mouse cursor during dragging.
    model.previousPosition = null;
    model.classHierarchy.push('vtkSphereWidgetProp');
    centerHandle.setVisible(false);
    function isValidHandle(handle) {
      return handle === centerHandle;
    }
    function isPlaced() {
      return !!centerHandle.getOrigin();
    }
  
    // Update the sphereHandle parameters from {center,border}Handle.
    function updateSphere() {
        var center = centerHandle.getOrigin();
        if (!center) return;
        centerHandle.setVisible(true);
        model._interactor.render();
    }
    function currentWorldCoords(e) {
      const manipulator = model.activeState?.getManipulator?.() ?? model.manipulator;
      return manipulator.handleEvent(e, model._apiSpecificRenderWindow).worldCoords;
    }
  
    // Update the sphere's center and radius.  Example:
    // handle.setCenterAndRadius([1,2,3], 10);
    publicAPI.setCenterAndRadius = (newCenter, newRadius) => {
      centerHandle.setOrigin(newCenter);
      updateSphere();
      model._widgetManager.enablePicking();
    };
    publicAPI.handleLeftButtonPress = e => {
      if (!isValidHandle(model.activeState)) {
        model.activeState = null;
        return macro.VOID;
      }
      model._isDragging = true;
      model._apiSpecificRenderWindow.setCursor('grabbing');
      model.previousPosition = [...currentWorldCoords(e)];
      publicAPI.invokeStartInteractionEvent();
      return macro.EVENT_ABORT;
    };
    publicAPI.handleLeftButtonRelease = e => {
      if (!model._isDragging) {
        model.activeState = null;
        return macro.VOID;
      }
      if (isPlaced()) {
        model.previousPosition = null;
        model._widgetManager.enablePicking();
        model._apiSpecificRenderWindow.setCursor('pointer');
        model._isDragging = false;
        model.activeState = null;
        state.deactivate();
      }
      publicAPI.invokeEndInteractionEvent();
      return macro.EVENT_ABORT;
    };
    publicAPI.handleMouseMove = e => {
      if (!model._isDragging) {
        model.activeState = null;
        return macro.VOID;
      }
      if (!model.activeState) throw Error('no activestate');
      const worldCoords = currentWorldCoords(e);
      model.activeState.setOrigin(worldCoords);
      model.previousPosition = worldCoords;
      updateSphere();
      return macro.VOID;
    };
    publicAPI.grabFocus = () => {
      centerHandle.setVisible(true);
      centerHandle.setOrigin([0,0,0]);
      model._isDragging = true;
      model.activeState = centerHandle;
      model._interactor.render();
    };
    publicAPI.loseFocus = () => {
      model._isDragging = false;
      model.activeState = null;
    };
  }
  
  export { widgetBehavior as default };
  