import * as THREE from 'https://threejs.org/build/three.module.js';
import { DeviceOrientationControls } from 'https://threejs.org/examples/jsm/controls/DeviceOrientationControls.js';
import { StereoEffect } from 'https://threejs.org/examples/jsm/effects/StereoEffect.js';

// This is heavily influenced by examples at:
// - https://github.com/mrdoob/three.js/blob/master/examples/webgl_panorama_equirectangular.html
// - https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_deviceorientation.html

var Cardboard = {

    Viewer: function(id, path) {

        var camera, scene, renderer, controls, effect;
        var isUserInteracting = false,
            isAnimating = true,
            isStereoscopic = false,
            onMouseDownMouseX = 0, onMouseDownMouseY = 0,
            lon = 0, onMouseDownLon = 0,
            lat = 0, onMouseDownLat = 0,
            phi = 0, theta = 0;

        init();
        animate();

        function init() {
            var container, mesh;
            container = document.getElementById( id );
            camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );
            camera.target = new THREE.Vector3( 0, 0, 0 );
            scene = new THREE.Scene();
            var geometry = new THREE.SphereBufferGeometry( 500, 60, 40 );
            // invert the geometry on the x-axis so that all of the faces point inward
            geometry.scale( - 1, 1, 1 );
            var texture = new THREE.TextureLoader().load(path);
            var material = new THREE.MeshBasicMaterial( { map: texture } );
            mesh = new THREE.Mesh( geometry, material );
            scene.add( mesh );
            renderer = new THREE.WebGLRenderer();
            renderer.setPixelRatio( window.devicePixelRatio );
            var element = renderer.domElement;
            container.appendChild( element );

            // If the device supports orientation, also add a button to allow for gyroscopic controls.
            var button = document.createElement("button");
            button.innerHTML = "Use Gyroscope";
            button.classList.add('action-button');
            button.addEventListener('click', function () {
                isStereoscopic = true;
                controls = new DeviceOrientationControls( camera );
                effect = new StereoEffect( renderer );
                onResize();
            }, false );
            container.appendChild( button );

            element.addEventListener( 'mousedown', onPointerStart, { passive: false } );
            window.addEventListener( 'mousemove', onPointerMove, { passive: false } );
            window.addEventListener( 'mouseup', onPointerUp, { passive: false } );
            element.addEventListener( 'touchstart', onPointerStart, { passive: false } );
            window.addEventListener( 'touchmove', onPointerMove, { passive: false } );
            window.addEventListener( 'touchend', onPointerUp, { passive: false } );
            window.addEventListener( 'resize', onWindowResize, false );
            window.addEventListener( 'resize', onResize, false );
            onWindowResize();
            onResize();
        }

        function onWindowResize() {
            var container = document.getElementById('container');
            container.style.width = window.innerWidth + "px";
            container.style.height = window.innerHeight + "px";
            var innerContainer = document.getElementById( id );
            innerContainer.style.width = innerContainer.parentElement.clientWidth + "px";
            innerContainer.style.height = innerContainer.parentElement.clientHeight + "px";
        }

        function onResize() {
            var width = renderer.domElement.parentElement.clientWidth;
            var height = renderer.domElement.parentElement.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            if ( isStereoscopic ) {
                // effect = new StereoEffect( renderer );
                effect.setSize( width, height );
            } else {
                renderer.setSize( width, height );
            }
        }

        function onPointerStart( event ) {
            isUserInteracting = true;
            isAnimating = false;
            var clientX = event.clientX || event.touches[ 0 ].clientX;
            var clientY = event.clientY || event.touches[ 0 ].clientY;
            onMouseDownMouseX = clientX;
            onMouseDownMouseY = clientY;
            onMouseDownLon = lon;
            onMouseDownLat = lat;
            event.preventDefault();
        }

        function onPointerMove( event ) {
            if ( isUserInteracting === true ) {
                var clientX = event.clientX || event.touches[ 0 ].clientX;
                var clientY = event.clientY || event.touches[ 0 ].clientY;
                lon = ( onMouseDownMouseX - clientX ) * 0.1 + onMouseDownLon;
                lat = ( clientY - onMouseDownMouseY ) * 0.1 + onMouseDownLat;
                event.preventDefault();
            }
        }

        function onPointerUp() {
            isUserInteracting = false;
        }

        function animate() {
            requestAnimationFrame( animate );
            update();
        }

        function update() {
            if ( isStereoscopic ) {
                controls.update();
                // renderer.render( scene, camera );
                effect.render( scene, camera );
                return;
            }
            if ( isUserInteracting === false && isAnimating === true ) {
                lon += 0.1;
            }
            lat = Math.max( - 85, Math.min( 85, lat ) );
            phi = THREE.Math.degToRad( 90 - lat );
            theta = THREE.Math.degToRad( lon );
            camera.target.x = 500 * Math.sin( phi ) * Math.cos( theta );
            camera.target.y = 500 * Math.cos( phi );
            camera.target.z = 500 * Math.sin( phi ) * Math.sin( theta );
            camera.lookAt( camera.target );
            renderer.render( scene, camera );
        }

    },

}

export { Cardboard };
