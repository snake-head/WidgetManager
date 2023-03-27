import vtkDataArray from '../../Common/Core/DataArray.js';
import vtkPolyData from '../../Common/DataModel/PolyData.js';
import vtkSphereSource from '../../Filters/Sources/SphereSource.js';
import vtkActor from '../../Rendering/Core/Actor.js';
import vtkGlyph3DMapper from '../../Rendering/Core/Glyph3DMapper.js';
import { ScalarMode } from '../../Rendering/Core/Mapper/Constants.js';
import vtkContextRepresentation from './ContextRepresentation.js';
import vtkWidgetRepresentation from './WidgetRepresentation.js';
import macro from '../../macros.js';

function vtkSphereContextRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkSphereContextRepresentation');
  model.internalPolyData = vtkPolyData.newInstance({
    mtime: 0
  });
  model.internalArrays = {
    points: model.internalPolyData.getPoints(),
    scale: vtkDataArray.newInstance({
      name: 'scale',
      numberOfComponents: 3,
      empty: true
    }),
    color: vtkDataArray.newInstance({
      name: 'color',
      numberOfComponents: 1,
      empty: true
    })
  };
  model.internalPolyData.getPointData().addArray(model.internalArrays.scale);
  model.internalPolyData.getPointData().addArray(model.internalArrays.color);
  model.pipelines = {
    circle: {
      source: publicAPI,
      glyph: vtkSphereSource.newInstance({
        phiResolution: model.glyphResolution,
        thetaResolution: model.glyphResolution
      }),
      mapper: vtkGlyph3DMapper.newInstance({
        scaleArray: 'scale',
        scaleMode: vtkGlyph3DMapper.ScaleModes.SCALE_BY_MAGNITUDE,
        colorByArrayName: 'color',
        scalarMode: ScalarMode.USE_POINT_FIELD_DATA
      }),
      actor: vtkActor.newInstance({
        pickable: false,
        parentProp: publicAPI
      })
    }
  };
  model.pipelines.circle.actor.getProperty().setOpacity(0.2);
  vtkWidgetRepresentation.connectPipeline(model.pipelines.circle);
  publicAPI.addActor(model.pipelines.circle.actor);
  publicAPI.setGlyphResolution = macro.chain(publicAPI.setGlyphResolution, function (r) {
    return model.pipelines.circle.glyph.setResolution(r);
  });

  publicAPI.setDrawBorder = function (draw) {
    model.pipelines.circle.glyph.setLines(draw);
  };

  publicAPI.setDrawFace = function (draw) {
    model.pipelines.circle.glyph.setFace(draw);
  };

  publicAPI.setOpacity = function (opacity) {
    model.pipelines.circle.actor.getProperty().setOpacity(opacity);
  };

  var superGetRepresentationStates = publicAPI.getRepresentationStates;

  publicAPI.getRepresentationStates = function () {
    var input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : model.inputData[0];
    return superGetRepresentationStates(input).filter(function (state) {
      var _state$getOrigin, _state$isVisible;

      return ((_state$getOrigin = state.getOrigin) === null || _state$getOrigin === void 0 ? void 0 : _state$getOrigin.call(state)) && ((_state$isVisible = state.isVisible) === null || _state$isVisible === void 0 ? void 0 : _state$isVisible.call(state));
    });
  };

  publicAPI.requestData = function (inData, outData) {
    var _model$internalArrays = model.internalArrays,
        points = _model$internalArrays.points,
        scale = _model$internalArrays.scale,
        color = _model$internalArrays.color;
    var list = publicAPI.getRepresentationStates(inData[0]);
    var totalCount = list.length;

    if (color.getNumberOfValues() !== totalCount) {
      // Need to resize dataset
      points.setData(new Float32Array(3 * totalCount));
      scale.setData(new Float32Array(3 * totalCount));
      color.setData(new Float32Array(totalCount));
    }

    var typedArray = {
      points: points.getData(),
      scale: scale.getData(),
      color: color.getData()
    };

    for (var i = 0; i < totalCount; i += 1) {
      var state = list[i];
      var isActive = state.getActive();
      var scaleFactor = isActive ? model.activeScaleFactor : 1;
      var coord = state.getOrigin();
      typedArray.points[i * 3 + 0] = coord[0];
      typedArray.points[i * 3 + 1] = coord[1];
      typedArray.points[i * 3 + 2] = coord[2];
      typedArray.scale[i] = scaleFactor * (state.getScale1 ? state.getScale1() : model.defaultScale);
      typedArray.color[i] = model.useActiveColor && isActive ? model.activeColor : state.getColor();
    }

    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;
  };
}

var DEFAULT_VALUES = {
  glyphResolution: 32,
  defaultScale: 1,
  drawBorder: false,
  drawFace: true
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkContextRepresentation.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['glyphResolution', 'defaultScale']);
  macro.get(publicAPI, model, ['glyph', 'mapper', 'actor']);
  vtkSphereContextRepresentation(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkSphereContextRepresentation');
var vtkSphereContextRepresentation$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkSphereContextRepresentation$1 as default, extend, newInstance };
