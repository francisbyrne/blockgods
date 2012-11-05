


/**************** CONSTANTS ****************/

var WIDTH = window.innerWidth,		// viewport width
	  HEIGHT = window.innerHeight,	// viewport height
	  MOVESPEED = 100,							// speed of moving camera
		LOOKSPEED = 0.075,						// speed of rotating camera
		CAM_DISTANCE = 1000,					// camera distance from avatar
		CAM_NEAR = 1,									// camera field of view minimum clipping
		CAM_FAR = 10000,							// camera field of view maximum clipping
		// key bindings
		KEY     = { ESC: 27, SPACE: 32, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 },
    DIR     = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3, MIN: 0, MAX: 3 };

		
/**************** VARIABLES ****************/

var scene,											// threejs scene object
		renderer,										// threejs renderer
		camera,											// camera object
		actions,										// queue of user actions (inputs)
		controls,										// camera/avatar controls
		clock = new THREE.Clock(),	// clock object for controls
		playing = true, 						// boolean - game is in progress
		avatar;											// game avatar

		
/**************** HELPER FUNCTIONS ****************/

// requestAnimFrame shim with setTimeout fallback by Paul Irish
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
    })();


/**************** CONTROLS ****************/

// var keydown = function (ev) {
//   var handled = false;
//   if (playing) {
//     switch(ev.keyCode) {
//       case KEY.LEFT:   actions.push(DIR.LEFT);  handled = true; break;
//       case KEY.RIGHT:  actions.push(DIR.RIGHT); handled = true; break;
//       case KEY.UP:     actions.push(DIR.UP);    handled = true; break;
//       case KEY.DOWN:   actions.push(DIR.DOWN);  handled = true; break;
//      //case KEY.ESC:    actions.push(DIR.CENTRE);handled = true; break;
//     }
//   }
//   if (handled)
//     ev.preventDefault(); // prevent arrow keys from scrolling the page (supported in IE9+ and all other browsers)
// };

// var addEvents = function () {
//   document.addEventListener('keydown', keydown, false);
//   //window.addEventListener('resize', resize, false);
// };

var handle = function (action) {
  switch(action) {
    case DIR.LEFT:   avatar.rotation.y += 0.1; break;
    case DIR.RIGHT:  avatar.rotation.y -= 0.1; break;
    case DIR.UP:     avatar.position.z -= 1; break;
    case DIR.DOWN:   avatar.position.z += 1; break;
    //case DIR.CENTRE: camera.lookAt(0,0,0); break;
  }
  //camera.lookAt(avatar.position);
};

var clearActions = function () { 
	actions = [];
};


/**************** INITIALISE SCENE ****************/

var initScene = function () {

	// set some camera attributes
	var VIEW_ANGLE = 45,
	  ASPECT = WIDTH / HEIGHT;

	// create a camera and a scene
	camera = new THREE.PerspectiveCamera(
	    VIEW_ANGLE,
	    ASPECT,
	    CAM_NEAR,
	    CAM_FAR);

	var scene = new THREE.Scene();

	// add the camera to the scene
	scene.add(camera);

	// the camera starts at 0,0,0
	// so pull it back
	camera.position.z = CAM_DISTANCE;

	// initialise camera controls
	controls = new THREE.FlyControls( camera );

	controls.movementSpeed = 1000;
	controls.domElement = document.getElementById('container');
	controls.rollSpeed = Math.PI / 24;
	controls.autoForward = false;
	controls.dragToLook = false;

	clock = new THREE.Clock(); // Used in render() for controls.update()

	clearActions();
	
			
	/**************** CREATE LANDSCAPE ****************/

	// Scene size
	var M = 1000 * 10;

	// Skybox
  var skyGeometry = new THREE.CubeGeometry(M, M, M, 4, 4, 4, null, true);
  var skyMaterial = new THREE.MeshBasicMaterial({color: 0x3030ff});
  var skyboxMesh  = new THREE.Mesh(skyGeometry, skyMaterial);
  skyboxMesh.flipSided = true;
  scene.add(skyboxMesh);

	// Sea
  // var seaGeometry = new THREE.PlaneGeometry(M, M, 3, 3)
  //   , seaMaterial = new THREE.MeshBasicMaterial({color: 0x483D8B})
  //   , seaMesh = new THREE.Mesh(seaGeometry, seaMaterial);
  // seaMesh.position.y = -1;
  // scene.add(seaMesh);

  // Grass
  // var grassGeometry = new THREE.PlaneGeometry(M*0.9, M*0.9, 3, 3)
  //   , grassMaterial = new THREE.MeshBasicMaterial({color: 0x7CFC00})
  //   , grassMesh = new THREE.Mesh(grassGeometry, grassMaterial);
  // scene.add(grassMesh);

			
	/**************** CREATE AVATAR ****************/

	// helper function for creating model arms/legs
	function limb(material) {
	  var limb = new THREE.Object3D();

	  var arm_geometry = new THREE.CylinderGeometry(25, 25, 500);
	  var arm = new THREE.Mesh(arm_geometry, material);
	  limb.add(arm);

	  var hand_geometry = new THREE.SphereGeometry(75);
	  var hand = new THREE.Mesh(hand_geometry, material);
	  hand.position.y = 250;
	  limb.add(hand);

	  return limb;
	}

	// create the model for the avatar
  function buildAvatar() {
	  var avatar = new THREE.Object3D();

	  var material = new THREE.MeshNormalMaterial();

	  var body_geometry = new THREE.CylinderGeometry(1, 300, 300);
	  var body = new THREE.Mesh(body_geometry, material);
	  body.position.z = -150;
	  avatar.add(body);

	  var head_geometry = new THREE.SphereGeometry(200);
	  var head = new THREE.Mesh(head_geometry, material);
	  head.position.y = 200;
	  avatar.add(head);

	  var right_arm = new limb(material);
	  right_arm.position.x = 150;
	  right_arm.position.z = -50;
	  right_arm.rotation.z = -Math.PI/3;
	  avatar.add(right_arm);

	  var right_leg = new limb(material);
	  right_leg.position.x = 150;
	  right_leg.position.y = -350;
	  right_leg.position.z = -50;
	  right_leg.rotation.z = -Math.PI * 9 / 10;
	  avatar.add(right_leg);

	  var left_arm = new limb(material);
	  left_arm.position.x = -150;
	  left_arm.position.z = -50;
	  left_arm.rotation.z = -Math.PI/3 * 5;
	  avatar.add(left_arm);

	  var left_leg = new limb(material);
	  left_leg.position.x = -150;
	  left_leg.position.y = -350;
	  left_leg.position.z = -50;
	  left_leg.rotation.z = -Math.PI * 10 / 9;
	  avatar.add(left_leg);

	  return avatar;
	};

	avatar = buildAvatar();
  scene.add(avatar);


	/**************** LIGHTING ****************/

	// create a point light
	var pointLight =
	  new THREE.PointLight(0xFFFFFF);

	// set its position
	pointLight.position.x = 10;
	pointLight.position.y = 50;
	pointLight.position.z = 130;

	// add to the scene
	scene.add(pointLight);

	return scene;
};

		
/**************** RENDER ****************/

var initRenderer = function () {

		// get the DOM element to attach to
	// - assume we've got jQuery to hand
	var $container = $('#container');

	// create WebGL Renderer
	renderer = new THREE.WebGLRenderer();

	// set renderer size
	renderer.setSize(WIDTH, HEIGHT);

	// attach the render-supplied DOM element
	$container.append(renderer.domElement);

	return renderer;
};

var render = function () {

	// handle the next queued action
  handle(actions.shift());
	
	var delta = clock.getDelta();
	controls.update(delta); // Move camera

	// draw the scene
  renderer.render(scene, camera);
};

scene = initScene();
renderer = initRenderer();


/**************** GAME LOOP ****************/

(function animloop() {

	//addEvents();

  requestAnimFrame(animloop);

  render();

})();
