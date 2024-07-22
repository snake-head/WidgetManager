/*
 * @Description: 
 * @Version: 1.0
 * @Autor: ZhuYichen
 * @Date: 2024-06-14 12:20:56
 * @LastEditors: ZhuYichen
 * @LastEditTime: 2024-07-04 15:20:36
 */
import { m as macro } from '@kitware/vtk.js/macros2.js';
import { vec3 } from 'gl-matrix';
import * as vtkMath from "@kitware/vtk.js/Common/Core/Math";
import vtkMatrixBuilder from "@kitware/vtk.js/Common/Core/MatrixBuilder"


function widgetBehavior(publicAPI, model) {
  const {dependingPoints} = model.behaviorParams
  const state = model.widgetState;
  const bottomSphereCenterHandle = state.getBottomSphereCenterHandle();
  const topSphereCenterHandle = state.getTopSphereCenterHandle();
  const radiusSphereCenterHandle = state.getRadiusSphereCenterHandle();
  model.linkCenter = [0, 0, 0]; // 半径的中心
  model.upLinkCenter = [0, 0, 0]; // 轴的中心
  model.linkDirection = [0, 0, 0];
  model.upLinkDirection = [0, 0, 0];
  model.height = 0
  model.modifyLinkRatio = [0.1, 10]

  // Set while moving the center or border handle.
  model._isDragging = false;
  // The last world coordinate of the mouse cursor during dragging.
  model.previousPosition = null;
  model.classHierarchy.push('vtkRootWidgetProp');
  bottomSphereCenterHandle.setVisible(false);
  topSphereCenterHandle.setVisible(false);
  radiusSphereCenterHandle.setVisible(false);
  function isValidHandle(handle) {
    return handle === bottomSphereCenterHandle || handle === topSphereCenterHandle || handle === radiusSphereCenterHandle;
  }
  function isPlaced() {
    return !!bottomSphereCenterHandle.getOrigin() && !!topSphereCenterHandle.getOrigin() && !!radiusSphereCenterHandle.getOrigin();
  }

  // Update the sphereHandle parameters from {center,border}Handle.
  function updateSphere() {
    const bottomSphereCenter = bottomSphereCenterHandle.getOrigin();
    if (!bottomSphereCenter) return;
    const topSphereCenter = topSphereCenterHandle.getOrigin();
    if (!topSphereCenter) return;
    const radiusSphereCenter = radiusSphereCenterHandle.getOrigin();
    if (!radiusSphereCenter) return;
    updateRootParams()
    bottomSphereCenterHandle.setVisible(true);
    topSphereCenterHandle.setVisible(true);
    radiusSphereCenterHandle.setVisible(true);
    model._interactor.render();
  }
  function currentWorldCoords(e) {
    const manipulator = model.activeState?.getManipulator?.() ?? model.manipulator;
    return manipulator.handleEvent(e, model._apiSpecificRenderWindow).worldCoords;
  }

  // Update the sphere's center and radius.  Example:
  // handle.setCenterAndRadius([1,2,3], 10);
  publicAPI.setCenter = (bottomSphereCenter, topSphereCenter, radiusSphereCenter) => {
    bottomSphereCenterHandle.setOrigin(bottomSphereCenter);
    topSphereCenterHandle.setOrigin(topSphereCenter);
    radiusSphereCenterHandle.setOrigin(radiusSphereCenter);
    let centerDistance = Math.sqrt(
      vtkMath.distance2BetweenPoints(bottomSphereCenter, radiusSphereCenter)
    );
    model.modifyLinkRange = [
      centerDistance * model.modifyLinkRatio[0],
      centerDistance * model.modifyLinkRatio[1],
    ];
    updateSphere();
    model._widgetManager.enablePicking();
  }
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
    model.lockActiveState = null
    publicAPI.invokeEndInteractionEvent();
    return macro.EVENT_ABORT;
  };

  function updateRootParams(){
    model.bottomSphereCenter = bottomSphereCenterHandle.getOrigin()
    model.topSphereCenter = topSphereCenterHandle.getOrigin()
    model.radiusSphereCenter = radiusSphereCenterHandle.getOrigin()
    vtkMath.add(model.bottomSphereCenter, model.radiusSphereCenter, model.linkCenter);
    vtkMath.multiplyScalar(model.linkCenter, 0.5);
    vtkMath.add(model.bottomSphereCenter, model.topSphereCenter, model.upLinkCenter);
    vtkMath.multiplyScalar(model.upLinkCenter, 0.5);
    vtkMath.subtract(
      model.radiusSphereCenter,
      model.bottomSphereCenter,
      model.linkDirection
    );
    vtkMath.normalize(model.linkDirection);
    vtkMath.subtract(
      model.bottomSphereCenter,
      model.topSphereCenter,
      model.upLinkDirection
    );
    vtkMath.normalize(model.upLinkDirection);
    model.height = Math.sqrt(
      vtkMath.distance2BetweenPoints(model.bottomSphereCenter, model.topSphereCenter)
    );
  }

  function calcRadiusCoord(worldCoords){
    var worldVector = []
    vtkMath.subtract(worldCoords, model.bottomSphereCenter, worldVector)
    var projVector = []
    vtkMath.projectVector(worldVector, model.linkDirection, projVector)
    var radiusCoord = []
    vtkMath.add(model.bottomSphereCenter, projVector, radiusCoord)
    if(Math.sqrt(vtkMath.distance2BetweenPoints(model.bottomSphereCenter, radiusCoord))>model.modifyLinkRange[1]){
      var tmp = [...model.linkDirection] 
      vtkMath.multiplyScalar(tmp, model.modifyLinkRange[1]);
      vtkMath.add(model.bottomSphereCenter, tmp, radiusCoord)
    }
    if(Math.sqrt(vtkMath.distance2BetweenPoints(model.bottomSphereCenter, radiusCoord))<model.modifyLinkRange[0]){
      var tmp = [...model.linkDirection] 
      vtkMath.multiplyScalar(tmp, model.modifyLinkRange[0]);
      vtkMath.add(model.bottomSphereCenter, tmp, radiusCoord)
    }
    if(vtkMath.dot(projVector, model.linkDirection)<0){
      var tmp = [...model.linkDirection] 
      vtkMath.multiplyScalar(tmp, model.modifyLinkRange[0]);
      vtkMath.add(model.bottomSphereCenter, tmp, radiusCoord)
    }
    return radiusCoord
  }

  function calcBottomCoord(pickPoint){
    var direction=[];
    vtkMath.subtract(pickPoint,model.topSphereCenter,direction);
    vtkMath.normalize(direction);
    vtkMath.multiplyScalar(direction,model.height);
    var targetPoint=[];
    vtkMath.add(model.topSphereCenter,direction,targetPoint);
    var AB=[]; //假设圆锥顶点为A，底面圆心为B，半径上的点为D，旋转后的B点为C
    vtkMath.subtract(model.bottomSphereCenter,model.topSphereCenter,AB);
    var AC=[];
    vtkMath.subtract(targetPoint,model.topSphereCenter,AC);
    var normal=[];
    vtkMath.cross(AB,AC,normal);
    vtkMath.normalize(normal)

    // 计算以A为原点的B点和D点坐标
    let B_prime = vtkMath.subtract(model.bottomSphereCenter, model.topSphereCenter, []);
    let C_prime = vtkMath.subtract(targetPoint, model.topSphereCenter, []);
    let D_prime = vtkMath.subtract(model.radiusSphereCenter, model.topSphereCenter, []);

    // 计算B点和C点之间的夹角
    let cosTheta = vtkMath.dot(B_prime, C_prime) / (vtkMath.norm(B_prime) * vtkMath.norm(C_prime));
    let theta = Math.acos(cosTheta);
    vtkMatrixBuilder.buildFromDegree().rotate(theta*180/Math.PI,normal).apply(D_prime);
    var rad = []
    vtkMath.add(model.topSphereCenter,D_prime,rad)
    return {
      rad: rad, 
      bot: targetPoint
    }
  }

  function calcTopCoord(pickPoint){
    var direction=[];
    vtkMath.subtract(pickPoint,model.bottomSphereCenter,direction);
    vtkMath.normalize(direction);
    vtkMath.multiplyScalar(direction,model.height);
    var targetPoint=[];
    vtkMath.add(model.bottomSphereCenter,direction,targetPoint);
    var AB=[]; //假设圆锥顶点为A，底面圆心为B，半径上的点为D，旋转后的B点为C
    vtkMath.subtract(model.topSphereCenter,model.bottomSphereCenter,AB);
    var AC=[];
    vtkMath.subtract(targetPoint,model.bottomSphereCenter,AC);
    var normal=[];
    vtkMath.cross(AB,AC,normal);
    vtkMath.normalize(normal)

    // 计算以A为原点的B点和D点坐标
    let B_prime = vtkMath.subtract(model.topSphereCenter, model.bottomSphereCenter, []);
    let C_prime = vtkMath.subtract(targetPoint, model.bottomSphereCenter, []);
    let D_prime = vtkMath.subtract(model.radiusSphereCenter, model.bottomSphereCenter, []);

    // 计算B点和C点之间的夹角
    let cosTheta = vtkMath.dot(B_prime, C_prime) / (vtkMath.norm(B_prime) * vtkMath.norm(C_prime));
    let theta = Math.acos(cosTheta);
    vtkMatrixBuilder.buildFromDegree().rotate(theta*180/Math.PI,normal).apply(D_prime);
    var rad = []
    vtkMath.add(model.bottomSphereCenter,D_prime,rad)
    return {
      rad: rad, 
      top: targetPoint
    }
  }
  model.lockActiveState = null
  // 记录之前选中的handle，如果不记录，当鼠标经过line的时候，会停止交互
  publicAPI.handleMouseMove = e => {
    if (!model._isDragging) {
      model.activeState = null;
      return macro.VOID;
    }
    if (!model.activeState) throw Error('no activestate');
    var worldCoords = currentWorldCoords(e);
    // 如果不做以下判断，移动handle经过line时，移动会停止
    if (!isValidHandle(model.activeState)){
      model.activeState = model.lockActiveState
    }
    // 如果不做以下判断，移动handle a经过handle b时目标会改变
    if(model.activeState != model.lockActiveState &&  model.lockActiveState != null){
      model.activeState = model.lockActiveState
    }
    if(model.activeState == radiusSphereCenterHandle){
      model.lockActiveState = radiusSphereCenterHandle
      radiusSphereCenterHandle.setOrigin(calcRadiusCoord(worldCoords));
      model.previousPosition = calcRadiusCoord(worldCoords);
    }else if (model.activeState == bottomSphereCenterHandle){
      model.lockActiveState = bottomSphereCenterHandle
      const {rad, bot} = calcBottomCoord(worldCoords)
      bottomSphereCenterHandle.setOrigin(bot);
      radiusSphereCenterHandle.setOrigin(rad);
    }else if (model.activeState == topSphereCenterHandle){
      model.lockActiveState = topSphereCenterHandle
      const {rad, top} = calcTopCoord(worldCoords)
      topSphereCenterHandle.setOrigin(top);
      radiusSphereCenterHandle.setOrigin(rad);
    }
    // else{
    //   model.activeState.setOrigin(worldCoords);
    //   model.previousPosition = worldCoords;
    // }
    updateSphere();
    return macro.VOID;
  };
  publicAPI.grabFocus = () => {
    bottomSphereCenterHandle.setVisible(true);
    bottomSphereCenterHandle.setOrigin([0,0,0]);
    model._isDragging = true;
    model.activeState = bottomSphereCenterHandle;
    model._interactor.render();
  };
  publicAPI.loseFocus = () => {
    model._isDragging = false;
    model.activeState = null;
  };
}
export { widgetBehavior as default };
