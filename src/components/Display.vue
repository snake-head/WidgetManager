<!--
 * @Description: 
 * @Author: zhuyc9
 * @Date: 2022-11-02 21:04:42
 * @LastEditTime: 2022-11-02 22:04:52
 * @LastEditors: zhuyc9
 * @Reference: 
-->
<template>
    <div id="display">
        <div>
            <button @click="addSphere">Add SphereWidget</button>
            <!-- <button @click="showR">显示半径</button> -->
            <button @click="addLine">Add LineWidget</button>
            <button @click="addMonitor">Add FPSMonitor</button>
            <button @click="removeSphere">Remove Widget</button>
            <br>
            Set Resolution:<input type="number" name="adjust" id="adjust" v-model="resolution">
            Polys in Scene:{{ numberOfPolys }}
        </div>
        <div ref="vtkContainer" style="width: 100%; height: 600px;"/>
    </div>
</template>

<script>
    import {ref, onMounted, watch} from 'vue';
    import '@kitware/vtk.js/favicon';

    // Load the rendering pieces we want to use (for both WebGL and WebGPU)
    import '@kitware/vtk.js/Rendering/Profiles/Geometry';
    import '@kitware/vtk.js/Rendering/Profiles/Glyph';

    import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
    import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
    import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
    import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
    import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
    import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
    // import vtkSphereWidget from '../reDesignVTK/Widgets/Widgets3D/SphereWidget';
    import vtkSphereWidget from '@kitware/vtk.js/Widgets/Widgets3D/SphereWidget';
    // import vtkLineWidget from '../reDesignVTK/Widgets/Widgets3D/LineWidget'
    import vtkLineWidget from '@kitware/vtk.js/Widgets/Widgets3D/LineWidget'
    // import vtkWidgetManager from '../reDesignVTK/Widgets/Core/WidgetManager';
    import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
    import WidgetManagerConstants from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants';
    import vtkFPSMonitor from '@kitware/vtk.js/Interaction/UI/FPSMonitor';
    // import controlPanel from './controlPanel.html';

    export default{
        name:'Display',
        setup(){
            const vtkContainer = ref(null);
            let index = ref();
            let vtkContext = null;
            let widgetManager = null;
            let cube;
            let widget = null;
            let widgetHandle = null;
            let renderer;
            let renderWindow;
            let resolution = ref(300);
            let numberOfPolys = ref(0);

            const { CaptureOn } = WidgetManagerConstants;

            const WIDGET_BUILDERS = {
                Box(widgetManager) {
                    return widgetManager.addWidget(vtkBoxWidget.newInstance({ label: 'Box' }));
                },
                PlaneWidget(widgetManager) {
                    return widgetManager.addWidget(
                    vtkImplicitPlaneWidget.newInstance({ label: 'Plane' })
                    );
                },
                PolyLine(widgetManager) {
                    const instance = widgetManager.addWidget(
                    vtkPolyLineWidget.newInstance({
                        label: 'Polyline',
                    })
                    );
                    instance.setCoincidentTopologyParameters({
                    Point: {
                        factor: -1.0,
                        offset: -1.0,
                    },
                    Line: {
                        factor: -1.5,
                        offset: -1.5,
                    },
                    Polygon: {
                        factor: -2.0,
                        offset: -2.0,
                    },
                    });
                    instance.setActiveScaleFactor(0.9);
                    instance.setGlyphResolution(60);
                    return instance;
                },
                ClosedPolyLine(widgetManager) {
                    const instance = widgetManager.addWidget(
                    vtkPolyLineWidget.newInstance({
                        label: 'Closed Polyline',
                    }),
                    null,
                    {
                        coincidentTopologyParameters: {
                        Point: {
                            factor: -1.0,
                            offset: -1.0,
                        },
                        Line: {
                            factor: -1.5,
                            offset: -1.5,
                        },
                        Polygon: {
                            factor: -2.0,
                            offset: -2.0,
                        },
                        },
                    }
                    );
                    instance.setActiveScaleFactor(1.1);
                    instance.setGlyphResolution(30);
                    instance.setClosePolyLine(true);
                    return instance;
                },
            };


            onMounted(()=>{
                const fullScreenRenderer = vtkGenericRenderWindow.newInstance({
                    background: [0.9, 0.9, 0.9],
                });
                fullScreenRenderer.setContainer(vtkContainer.value);
                fullScreenRenderer.resize()
                renderer = fullScreenRenderer.getRenderer();
                renderWindow = fullScreenRenderer.getRenderWindow();

                // cube = vtkCubeSource.newInstance();
                cube = vtkSphereSource.newInstance({
                    radius: 1.0,
                    phiResolution: resolution.value,
                    thetaResolution: resolution.value,
                });
                const polyData = cube.getOutputData();
                numberOfPolys.value = polyData.getNumberOfPolys();
                console.log(`Number of polygons: ${numberOfPolys.value}`);
                const mapper = vtkMapper.newInstance();
                const actor = vtkActor.newInstance();

                actor.setMapper(mapper);
                mapper.setInputConnection(cube.getOutputPort());
                actor.getProperty().setOpacity(0.2);

                renderer.addActor(actor);

                // ----------------------------------------------------------------------------
                // Widget manager
                // ----------------------------------------------------------------------------

                widgetManager = vtkWidgetManager.newInstance();
                widgetManager.setRenderer(renderer);

                

                renderer.resetCamera();
                // widgetManager.releaseFocus(widget);
                // widget = vtkSphereWidget.newInstance();
                // widget.placeWidget(cube.getOutputData().getBounds());
                // widgetHandle = widgetManager.addWidget(widget);
                // widgetManager.grabFocus(widget);

            })

            watch(resolution, (newVal, oldVal) => {
               cube.setPhiResolution(newVal)
               cube.setThetaResolution(newVal)
               numberOfPolys.value = cube.getOutputData().getNumberOfPolys()
            });

            function addSphere(){
                // widgetManager.releaseFocus(widget);
                // widget = vtkSphereWidget.newInstance({
                    // dependingPoints: [2,2,2,1,1,1],
                // });
                // widget.placeWidget(cube.getOutputData().getBounds());
                // widget.setPlaceFactor(0);
                // widgetManager.enablePicking();
                // widgetHandle = widgetManager.addWidget(widget);
                // widgetHandle.setCenterAndRadius([0,0,0], 0)
                // widgetHandle.getWidgetState().getBorderHandle().setVisible(false)
                // console.log(widgetHandle.getWidgetState().getLeftCenterHandle())

                // widgetManager.grabFocus(widget);

                widgetManager.releaseFocus(widget);
                widget = vtkSphereWidget.newInstance();
                widget.placeWidget(cube.getOutputData().getBounds());
                widgetHandle = widgetManager.addWidget(widget);
                widgetManager.grabFocus(widget);
            }

            function removeSphere(){
                if(widgetManager.getWidgets()[0]){
                    var number = widgetManager.getWidgets().length;
                    widgetManager.removeWidget(widgetManager.getWidgets()[number-1])
                }
            }

            function addLine(){
                widgetManager.releaseFocus(widget);
                widget = vtkLineWidget.newInstance({
                    // dependingPoints: [2,2,2,1,1,1],
                });
                // widget.placeWidget(cube.getOutputData().getBounds());
                // widget.setPlaceFactor(0);
                // widgetManager.enablePicking();
                widgetHandle = widgetManager.addWidget(widget);
                // widgetHandle.placeHandleByCoords([-0.1,0,0],[0.1,0,0])
                // widgetHandle.getWidgetState().getHandle1().setOrigin([-1,0,0])
                // widgetHandle.getWidgetState().getHandle2().setOrigin([1,0,0])
                // widgetHandle.getWidgetState().getBorderHandle().setVisible(false)
                // console.log(widgetHandle.getWidgetState().getLeftCenterHandle())

                widgetManager.grabFocus(widget);
            }

            function showR(){
                widgetHandle.setVisibility(!widgetHandle.getVisibility())
            }

            function addMonitor(){
                const fpsMonitor = vtkFPSMonitor.newInstance();
                fpsMonitor.setContainer(vtkContainer.value);
                fpsMonitor.setRenderWindow(renderWindow);
            }

            return {
                vtkContainer,
                addSphere,
                showR,
                addLine,
                addMonitor,
                removeSphere,
                resolution,
                numberOfPolys
            }
        }
    }
</script>

<style>
    .left {
  float: left;
}
</style>