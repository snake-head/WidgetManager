/*
 * @Description: 
 * @Version: 1.0
 * @Autor: ZhuYichen
 * @Date: 2024-05-10 10:58:42
 * @LastEditors: ZhuYichen
 * @LastEditTime: 2024-05-16 15:43:56
 */
import { e as distance2BetweenPoints } from '@kitware/vtk.js/Common/Core/Math/index.js';
import vtkAbstractWidgetFactory from '@kitware/vtk.js/Widgets/Core/AbstractWidgetFactory.js';
import vtkPlanePointManipulator from '@kitware/vtk.js/Widgets/Manipulators/PlaneManipulator.js';
import vtkBracketHandleRepresentation from '../Representations/BracketHandleRepresentation.js';
import vtkSphereContextRepresentation from '@kitware/vtk.js/Widgets/Representations/SphereContextRepresentation.js';
import { m as macro } from '@kitware/vtk.js/macros2.js';
import widgetBehavior from './BracketWidget/behavior.js';
import stateGenerator from './BracketWidget/state.js';

function vtkBracketWidget(publicAPI, model) {
    model.classHierarchy.push('vtkBracketWidget');
    const superClass = {
      ...publicAPI
    };
    model.methodsToLink = ['scaleInPixels'];
    publicAPI.getRepresentationsForViewType = viewType => [
    {
      builder: vtkBracketHandleRepresentation,
      labels: ['centerHandle'],
      initialValues: {
        actor: model.actor,
        mapper: model.mapper,
        pointType: model.pointType,
        generate3DTextureCoordinates: model.generate3DTextureCoordinates,
        generateFaces: model.generateFaces,
        generateLines: model.generateLines,
      }
    }, 
    ];
  
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
    vtkBracketWidget(publicAPI, model);
  }
  const newInstance = macro.newInstance(extend, 'vtkBracketWidget');
  var vtkBracketWidget$1 = {
    newInstance,
    extend
  };
  
  export { vtkBracketWidget$1 as default, extend, newInstance };
  