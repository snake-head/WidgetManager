import { m as macro } from '@kitware/vtk.js/macros2.js';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor.js';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper.js';
import { B as areEquals } from '@kitware/vtk.js/Common/Core/Math/index.js';
import vtkBoundingBox from '@kitware/vtk.js/Common/DataModel/BoundingBox.js';
import vtkTubeFilter from '@kitware/vtk.js/Filters/General/TubeFilter.js';
import { getPixelWorldHeightAtCoord } from '@kitware/vtk.js/Widgets/Core/WidgetManager.js';
import vtkWidgetRepresentation, { allocateArray } from '@kitware/vtk.js/Widgets/Representations/WidgetRepresentation.js';
import { RenderingTypes } from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants.js';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData.js';
import vtkTriangleFilter from '@kitware/vtk.js/Filters/General/TriangleFilter.js';  // 假设这个过滤器存在
import * as vtkMath from "@kitware/vtk.js/Common/Core/Math";
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';

// ----------------------------------------------------------------------------
// vtkConeRepresentation methods
// ----------------------------------------------------------------------------

function vtkConeRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkConeRepresentation');
  const superClass = {
    ...publicAPI
  };

  // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------
  const internalPolyData = vtkPolyData.newInstance({
    mtime: 0
  });

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model._pipelines = {
    triangles: {
      source: publicAPI,
      filter: vtkTriangleFilter.newInstance(),  // 初始化TriangleFilter实例
      mapper: vtkMapper.newInstance(),
      actor: vtkActor.newInstance({
        parentProp: publicAPI
      })
    }
  };
  vtkWidgetRepresentation.connectPipeline(model._pipelines.triangles);
  // 设置颜色为红色（RGB：1, 0, 0）
  model._pipelines.triangles.actor.getProperty().setColor(1, 0, 0);
  // 设置透明度为0.5（半透明）
  model._pipelines.triangles.actor.getProperty().setOpacity(0.3);
  publicAPI.addActor(model._pipelines.triangles.actor);

  // --------------------------------------------------------------------------
  publicAPI.requestData = (inData, outData) => {
    const state = inData[0];
    outData[0] = internalPolyData;

    const list = publicAPI.getRepresentationStates(state);
    const size = 101;
    const bottomSphereCenter = list[0].getOrigin();
    const topSphereCenter = list[1].getOrigin();
    const radiusSphereCenter = list[2].getOrigin();

    // 计算底面半径
    const radiusVector = vtkMath.subtract(radiusSphereCenter, bottomSphereCenter, []);
    const radius = vtkMath.norm(radiusVector);

    // 计算高度
    const heightVector = vtkMath.subtract(topSphereCenter, bottomSphereCenter, []);
    const height = vtkMath.norm(heightVector);
    vtkMath.normalize(heightVector)

    // 计算圆锥中心
    const heightCenter = vtkMath.add(topSphereCenter, bottomSphereCenter, [])
    vtkMath.multiplyScalar(heightCenter, 0.5)

    // 创建圆锥源
    const coneSource = vtkConeSource.newInstance({
        height: height,
        radius: radius,
        resolution: 100,
        center: heightCenter,
        direction: heightVector
    });

    // 更新圆锥形状数据
    coneSource.update();

    // 设置输出数据
    outData[0].setPoints(coneSource.getOutputData().getPoints());
    outData[0].setPolys(coneSource.getOutputData().getPolys());

    // 更新数据
    outData[0].getPoints().modified();
    outData[0].modified();
};

  /**
   * When mousing over the line, if behavior != CONTEXT,
   * returns the parent state.
   * @param {object} prop
   * @param {number} compositeID
   * @returns {object}
   */
  publicAPI.getSelectedState = (prop, compositeID) => model.inputData[0];
  publicAPI.updateActorVisibility = (renderingType, ctxVisible, hVisible) => {
    const state = model.inputData[0];

    // Make lines/tubes thicker for picking
    let lineThickness = state.getLineThickness?.() ?? model.lineThickness;
    if (renderingType === RenderingTypes.PICKING_BUFFER) {
      lineThickness = Math.max(4, lineThickness);
    }
    // applyLineThickness(lineThickness);
    return superClass.updateActorVisibility(renderingType, ctxVisible, hVisible);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  threshold: Number.EPSILON,
  closePolyLine: false,
  lineThickness: 2,
  scaleInPixels: true
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  let initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const newDefault = {
    ...DEFAULT_VALUES,
    ...initialValues
  };
  vtkWidgetRepresentation.extend(publicAPI, model, newDefault);
  macro.setGet(publicAPI, model, ['threshold', 'closePolyLine', 'lineThickness']);
  vtkConeRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

const newInstance = macro.newInstance(extend, 'vtkConeRepresentation');

// ----------------------------------------------------------------------------

var vtkConeRepresentation$1 = {
  newInstance,
  extend
};

export { vtkConeRepresentation$1 as default, extend, newInstance };
