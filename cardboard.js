import * as THREE from 'https://threejs.org/build/three.module.js';
import { DeviceOrientationControls } from 'https://threejs.org/examples/jsm/controls/DeviceOrientationControls.js';
import { StereoEffect } from 'https://threejs.org/examples/jsm/effects/StereoEffect.js';

// This is heavily influenced by examples at:
// - https://github.com/mrdoob/three.js/blob/master/examples/webgl_panorama_equirectangular.html
// - https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_deviceorientation.html

var Cardboard = {

    Viewer: function(element, path) {

        const Mode = {
            animated: 1,
            interactive: 2,
            gyroscopic: 3,
            stereoscopic: 4,
        }
        Object.freeze(Mode)

        var camera, scene, renderer, controls, effect;
        var onMouseDownMouseX = 0, onMouseDownMouseY = 0,
            lon = 0, onMouseDownLon = 0,
            lat = 0, onMouseDownLat = 0,
            phi = 0, theta = 0,
            isUserInteracting = false,
            isFullscreen = false,
            mode = Mode.animated,
            parent, container,
            previousStyle = null;

        parent = element;
        init();
        animate();

        function init() {
            var mesh;
            container = document.createElement( 'div' );
            parent.appendChild( container );
            container.classList.add( 'cardboard-viewer' );
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
            var button = document.createElement( "button" );
            button.innerHTML = "Use Gyroscope";
            button.classList.add( 'action-button' );
            button.addEventListener( 'click', onUseGyroscope, false );
            container.appendChild( button );

            element.addEventListener( 'mousedown', onPointerStart, { passive: false } );
            window.addEventListener( 'mousemove', onPointerMove, { passive: false } );
            window.addEventListener( 'mouseup', onPointerUp, { passive: false } );
            element.addEventListener( 'touchstart', onPointerStart, { passive: false } );
            window.addEventListener( 'touchmove', onPointerMove, { passive: false } );
            window.addEventListener( 'touchend', onPointerUp, { passive: false } );
            window.addEventListener( 'resize', onWindowResize, false );
            window.addEventListener( 'resize', onResize, false );
            window.addEventListener( 'orientationchange', onOrientationChange );
            onWindowResize();
            onResize();
        }

        function onUseGyroscope() {
            if ( mode == Mode.interactive || mode == Mode.animated ) {
                controls = new DeviceOrientationControls( camera );
                effect = new StereoEffect( renderer );
                mode = modeForOrientation();
                enterFullscreen();
            } else {
                controls = null;
                effect = null;
                mode = Mode.interactive;
                leaveFullscreen();
            }
        }

        function modeForOrientation() {
            if ( window.orientation == -90 || window.orientation == 90 ) {
                return Mode.stereoscopic;
            } else {
                return Mode.gyroscopic;
            }
        }

        function onOrientationChange() {
            if ( mode == Mode.animated || mode == Mode.interactive ) {
                return;
            }
            mode = modeForOrientation();
        }

        function enterFullscreen() {
            isFullscreen = true;
            parent.removeChild( container );
            document.body.appendChild( container );
            container.classList.add( 'fullscreen' );
            onWindowResize();
            onResize();
        }

        function leaveFullscreen() {
            isFullscreen = false;
            document.body.removeChild( container );
            parent.appendChild( container );
            container.classList.remove( 'fullscreen' );
            onWindowResize();
            onResize();
        }

        function onWindowResize() {
            if ( isFullscreen ) {
                container.style.width = window.innerWidth + "px";
                container.style.height = window.innerHeight + "px";
            } else {
                container.style.width = "auto";
                container.style.height = "auto";
            }
        }

        function onResize() {
            var width, height;
            if ( isFullscreen ) {
                width = renderer.domElement.parentElement.clientWidth;
                height = renderer.domElement.parentElement.clientHeight;
            } else {
                var aspect = 4 / 3; // Prefer a 4:3 aspect ratio.
                width = parent.clientWidth;
                height = width / aspect;
            }

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            if ( mode == Mode.stereoscopic ) {
                effect.setSize( width, height );
            } else {
                renderer.setSize( width, height );
            }
        }

        function onPointerStart( event ) {
            if ( mode == Mode.animated || mode == Mode.interactive ) {
                mode = Mode.interactive;
            } else {
                return;
            }
            isUserInteracting = true;
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
            if ( mode == Mode.gyroscopic ) {
                controls.update();
                renderer.render( scene, camera );
            } else if ( mode == Mode.stereoscopic ) {
                controls.update();
                effect.render( scene, camera );
            } else if ( mode == Mode.animated || mode == Mode.interactive ) {
                if ( mode == Mode.animated ) {
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
        }

    },

    initialize: function( root ) {

        attach( root );

        function attach( root ) {
            var elements = document.evaluate( "//div[@data-projection='equirectangular']", root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
            for ( let i = 0, length = elements.snapshotLength; i < length; ++i ) {
                var element = elements.snapshotItem( i );
                if ( element.getAttribute( 'data-attached' ) ) {
                    continue;
                }
                new Cardboard.Viewer( element, element.getAttribute('data-src') );
                element.setAttribute( 'data-attached', true );
            }
        }

        const observer = new MutationObserver( function( mutations, observer ) {
            mutations.forEach( function( mutation ) {
                for ( let i = 0; i < mutation.addedNodes.length; i++ ) {
                    let node = mutation.addedNodes[i];
                    attach( node );
                }
            } );
        } );
        observer.observe( document.body, { attributes: true, childList: true, subtree: true } );

    },

}

Cardboard.initialize( document.body );
