<!--
 * @Description: 
 * @Author: zhuyc9
 * @Date: 2022-11-02 21:04:42
 * @LastEditTime: 2024-07-03 10:55:04
 * @LastEditors: ZhuYichen
 * @Reference: 
-->
<template>
    <div id="display">
        <div>
            <button @click="addSphere">Add SphereWidget</button>
            <!-- <button @click="showR">显示半径</button> -->
            <button @click="addBracket">Add BracketWidget</button>
            <button @click="addMonitor">Add FPSMonitor</button>
            <button @click="removeSphere">Remove Widget</button>
            <input type="file" @change="handleFile" />
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
    import vtkSphereWidget from '../reDesignVTK/Widgets/Widgets3D/SphereWidget';
    // import vtkSphereWidget from '@kitware/vtk.js/Widgets/Widgets3D/SphereWidget';
    // import vtkLineWidget from '../reDesignVTK/Widgets/Widgets3D/LineWidget'
    import vtkLineWidget from '@kitware/vtk.js/Widgets/Widgets3D/LineWidget'
    import vtkBracketWidget from '../reDesignVTK/Widgets/Widgets3D/BracketWidget'
    // import vtkWidgetManager from '../reDesignVTK/Widgets/Core/WidgetManager';
    import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
    import WidgetManagerConstants from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants';
    import vtkFPSMonitor from '@kitware/vtk.js/Interaction/UI/FPSMonitor';
    import vtkSTLReader from '@kitware/vtk.js/IO/Geometry/STLReader';
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

                cube = vtkCubeSource.newInstance();
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
                widget = vtkSphereWidget.newInstance({
                    activeColor: [204, 64, 64],
                    activeScaleFactor: 1,
                    behaviorParams: {
                        dependingPoints: [2,2,2,1,1,1],
                    }
                });
                // widget.placeWidget(cube.getOutputData().getBounds());
                // widget.setPlaceFactor(0);
                // widgetManager.enablePicking();
                widgetHandle = widgetManager.addWidget(widget);
                // widgetHandle.setScaleInPixels(false)
                widgetHandle.setCenter([3,0,0])
                // widgetHandle.getWidgetState().getBorderHandle().setVisible(false)
                // console.log(widgetHandle.getWidgetState().getLeftCenterHandle())

                // widgetManager.grabFocus(widget);

                // widgetManager.releaseFocus(widget);
                // widget = vtkSphereWidget.newInstance();
                // widget.placeWidget(cube.getOutputData().getBounds());
                // widgetHandle = widgetManager.addWidget(widget);
                // widgetManager.grabFocus(widget);
            }

            

            function removeSphere(){
                if(widgetManager.getWidgets()[0]){
                    var number = widgetManager.getWidgets().length;
                    widgetManager.removeWidget(widgetManager.getWidgets()[number-1])
                }
            }

            function addBracket(){
                // widgetManager.releaseFocus(widget);
                widget = vtkBracketWidget.newInstance({
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
                });
                console.log(widget)
                // widget.placeWidget(cube.getOutputData().getBounds());
                // widget.setPlaceFactor(0);
                // widgetManager.enablePicking();
                widgetHandle = widgetManager.addWidget(widget);
                // console.log(widgetHandle.getRadius())
                console.log(widgetHandle.getRepresentations()[0].getActor())
                widgetHandle.setCenterAndRadius([0,0,0], 10)
                // widgetHandle.placeHandleByCoords([-0.1,0,0],[0.1,0,0])
                // widgetHandle.getWidgetState().getHandle1().setOrigin([-1,0,0])
                // widgetHandle.getWidgetState().getHandle2().setOrigin([1,0,0])
                // widgetHandle.getWidgetState().getBorderHandle().setVisible(false)
                // console.log(widgetHandle.getWidgetState().getLeftCenterHandle())

                // widgetManager.grabFocus(widget);
            }

            function showR(){
                widgetHandle.setVisibility(!widgetHandle.getVisibility())
            }

            function addMonitor(){
                const fpsMonitor = vtkFPSMonitor.newInstance();
                fpsMonitor.setContainer(vtkContainer.value);
                fpsMonitor.setRenderWindow(renderWindow);
            }

            function handleFile(event) {
                const reader = vtkSTLReader.newInstance();
                const file = event.target.files[0];
                const mapper = vtkMapper.newInstance({ scalarVisibility: false });
                const actor = vtkActor.newInstance();

                actor.setMapper(mapper);
                mapper.setInputConnection(reader.getOutputPort());
                
                if (file) {
                    console.log(file)
                    const fileReader = new FileReader();
                    fileReader.onload = (e) => {
                        console.log(1)
                        reader.parseAsArrayBuffer(e.target.result);
                        renderer.addActor(actor);
                        renderer.resetCamera();
                        renderWindow.render();
                    };
                    fileReader.readAsArrayBuffer(file);
                    
                }
            }

            return {
                vtkContainer,
                addSphere,
                showR,
                addBracket,
                addMonitor,
                removeSphere,
                handleFile,
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