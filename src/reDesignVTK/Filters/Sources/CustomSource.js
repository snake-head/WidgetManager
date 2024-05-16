import { m as macro } from '@kitware/vtk.js/macros2.js';
import vtkCellArray from '@kitware/vtk.js/Common/Core/CellArray.js';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray.js';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData.js';
import vtkMatrixBuilder from '@kitware/vtk.js/Common/Core/MatrixBuilder.js';

// ----------------------------------------------------------------------------
// vtkCustomSource methods
// ----------------------------------------------------------------------------

function vtkCustomSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCustomSource');
  
  function requestData(inData, outData) {
    if (model.deleted) {
      return;
    }
    
    const polyData = vtkPolyData.newInstance();
    outData[0] = polyData;

    // Define points
    const points = macro.newTypedArray(model.pointType, model.pointValues.length);
    points.set(model.pointValues);
    polyData.getPoints().setData(points, 3);

    // Apply rotation to the points coordinates
    if (model.rotations) {
      vtkMatrixBuilder.buildFromDegree()
        .rotateX(model.rotations[0])
        .rotateY(model.rotations[1])
        .rotateZ(model.rotations[2])
        .apply(points);
    }

    // Apply transformation to the points coordinates
    if (model.center) {
      vtkMatrixBuilder.buildFromRadian()
        .translate(...model.center)
        .apply(points);
    }

    // Apply optional additionally specified matrix transformation
    if (model.matrix) {
      vtkMatrixBuilder.buildFromRadian()
        .setMatrix(model.matrix)
        .apply(points);
    }

    // Generate the necessary cell arrays
    const polys = vtkCellArray.newInstance({
      values: Uint16Array.from(model.cellValues)
    });
    polyData.setPolys(polys);

    polyData.modified();
  }
  
  // Expose methods
  publicAPI.requestData = requestData;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  pointValues: [
    // A simple cube
    -0.5, -0.5, -0.5, // 0
    0.5, -0.5, -0.5, // 1
    0.5, 0.5, -0.5, // 2
    -0.5, 0.5, -0.5, // 3
    -0.5, -0.5, 0.5, // 4
    0.5, -0.5, 0.5, // 5
    0.5, 0.5, 0.5, // 6
    -0.5, 0.5, 0.5, // 7
  ],
  cellValues: [
    4, 0, 1, 2, 3, // bottom face
    4, 4, 5, 6, 7, // top face
    4, 0, 1, 5, 4, // front face
    4, 1, 2, 6, 5, // right face
    4, 2, 3, 7, 6, // back face
    4, 3, 0, 4, 7, // left face
  ],
  pointType: 'Float64Array',
  generate3DTextureCoordinates: false,
  generateFaces: true,
  generateLines: false,
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  let initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'generate3DTextureCoordinates',
    'generateFaces',
    'generateLines',
  ]);
  macro.setGetArray(publicAPI, model, ['center', 'rotations'], 3);
  macro.setGetArray(publicAPI, model, ['matrix'], 16);

  macro.algo(publicAPI, model, 0, 1);
  vtkCustomSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

const newInstance = macro.newInstance(extend, 'vtkCustomSource');

// ----------------------------------------------------------------------------

var vtkCustomSource$1 = {
  newInstance,
  extend,
};

export { vtkCustomSource$1 as default, extend, newInstance };
