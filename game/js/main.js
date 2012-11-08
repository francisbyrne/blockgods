


/**************** CONSTANTS ****************/

var WIDTH = window.innerWidth,		// viewport width
	  HEIGHT = window.innerHeight,	// viewport height
	  MOVESPEED = 500,							// speed of avatar/camera movement
		LOOKSPEED = 0.075,						// speed of rotating avatar/camera
		CAM_VIEW_ANGLE = 75,					// camera view angle
		CAM_ASPECT = WIDTH / HEIGHT,	// camera aspect ratio
		CAM_DISTANCE = 1500,					// camera distance from avatar
		CAM_NEAR = 1,									// camera field of view minimum clipping
		CAM_FAR = 10000,							// camera field of view maximum clipping
		ISLAND_WIDTH = 9000,
		ISLAND_HALF = ISLAND_WIDTH / 2,
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
	  material = new THREE.MeshNormalMaterial(),
		playing = true, 						// boolean - game is in progress
		avatar,											// game avatar
		walls;

		
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

function spinAvatar(angle) {
  new TWEEN.Tween( { y: avatar.rotation.y } )
      .to( { y: angle }, 100 )
      .onUpdate( function () {
          avatar.rotation.y = this.y;
      } )
      .start();
}


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

	var scene = new THREE.Scene();

	clock = new THREE.Clock(); // Used in render() for controls.update()

	clearActions();
	
			
	/**************** CREATE LANDSCAPE ****************/

	// Scene size
	var M = 1000 * 10;

	// TODO: get skybox facing inwards and make lighter colour
	// Skybox
  // var skyGeometry = new THREE.CubeGeometry(M, M, M, 4, 4, 4, null, true);
  // var skyMaterial = new THREE.MeshBasicMaterial({color: 0x3030ff});
  // var skyboxMesh  = new THREE.Mesh(skyGeometry, skyMaterial);
  // skyboxMesh.flipSided = true; // TODO: this doesn't exist anymore, investigate!
  // scene.add(skyboxMesh);

	// Sea
  var seaGeometry = new THREE.PlaneGeometry(M, M, 3, 3)
    , seaMaterial = new THREE.MeshBasicMaterial({color: 0x483D8B})
    , seaMesh = new THREE.Mesh(seaGeometry, seaMaterial);
  seaMesh.position.y = -1;
  seaMesh.rotation.x = Math.PI * 3 / 2;
  scene.add(seaMesh);

  // Grass
  var grassGeometry = new THREE.PlaneGeometry(M*0.9, M*0.9, 3, 3)
    , grassMaterial = new THREE.MeshBasicMaterial({color: 0x7CFC00})
    , grassMesh = new THREE.Mesh(grassGeometry, grassMaterial);
  grassMesh.rotation.x = Math.PI * 3 / 2;
  scene.add(grassMesh);

  var fenceGeometry = new THREE.CubeGeometry(ISLAND_WIDTH, 1000, ISLAND_WIDTH, 3, 1, 3)
    , fenceMaterial = new THREE.MeshBasicMaterial({wireframe: true});
  fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
  scene.add(fence);

			
	/**************** CREATE AVATAR ****************/

	// create the model for the avatar
  function createAvatar() {

  	// body size constants
  	var SIZE = 100,
  			HEAD_SIZE = SIZE * 1.5,
				BODY_HEIGHT = SIZE * 2,
				BODY_GIRTH = SIZE,
				LIMB_LENGTH = SIZE * 2,
				LIMB_GIRTH	= SIZE * 0.4;

	  var avatar = new THREE.Object3D();

	  // body
	  var body_geometry = new THREE.CubeGeometry(BODY_GIRTH, BODY_HEIGHT, BODY_GIRTH);
	  var body = new THREE.Mesh(body_geometry, material);
	  avatar.add(body);

	  // head
	  var head_geometry = new THREE.CubeGeometry(HEAD_SIZE, HEAD_SIZE, HEAD_SIZE);
	  var head = new THREE.Mesh(head_geometry, material);
	  head.position.y = BODY_HEIGHT;
	  avatar.add(head);

	  // helper function for creating model arms/legs
	  // TODO: Get frame of reference working properly
		function limb(material, name, xpos, ypos, zrot) {

		  var limb_geometry = new THREE.CubeGeometry(LIMB_LENGTH, LIMB_GIRTH, LIMB_GIRTH);
		  var limb = new THREE.Mesh(limb_geometry, material);
		  var socket = new THREE.Object3D();

		  name ? socket.name = name : '';
		  xpos ? socket.position.x = xpos : '';
		  ypos ? socket.position.y = ypos : '';
		  zrot ? socket.rotation.z = zrot : '';
		  socket.add(limb);

		  return socket;
		};

		// create various limbs
	  avatar.add( new limb(material, 'right_arm', BODY_GIRTH, null, -Math.PI/3) );
	  avatar.add( new limb(material, 'left_arm', -BODY_GIRTH, null, Math.PI/3) );
	  avatar.add( new limb(material, 'right_leg', BODY_GIRTH * 0.4, -BODY_HEIGHT * 0.5, -Math.PI/3) );
	  avatar.add( new limb(material, 'left_leg', -BODY_GIRTH * 0.4, -BODY_HEIGHT * 0.5, Math.PI/3) );

	  // position the avatar relative to its height so that it walks on land
	  avatar.position.y = BODY_HEIGHT / 2 + LIMB_LENGTH / 2;

	  return avatar;
	};

	avatar = createAvatar();

	// set up a frame of reference for avatar for model rotation
  var avatar_frame = new THREE.Object3D();
  avatar_frame.add(avatar);
  scene.add(avatar_frame);

	// initialise avatar controls
	controls = new THREE.FirstPersonControls( avatar_frame );

	controls.movementSpeed = 5000;
	//controls.activeLook = false;	// stop the FirstPersonControls from following mouse movements
	controls.keyRotate = true;

	// create a camera and a scene
	camera = new THREE.PerspectiveCamera(
	    CAM_VIEW_ANGLE,
	    CAM_ASPECT,
	    CAM_NEAR,
	    CAM_FAR);

	// the camera starts at 0,0,0 so pull it back
	camera.position.z = CAM_DISTANCE;
	camera.position.y = CAM_DISTANCE / 2;

	// add camera to avatar (so that it follows the avatar)
	avatar.add(camera);

			
	/**************** CREATE SPHERE ****************/
	var sphere_geometry = new THREE.SphereGeometry(300);
	var sphere = new THREE.Mesh(sphere_geometry, material);
	sphere.position.z = 500;
	sphere.position.y = 300;
	scene.add(sphere);
	
	/**************** LIGHTING ****************/

	// create a point light
	var pointLight = new THREE.PointLight(0xFFFFFF);

	// set its position
	pointLight.position.x = 10;
	pointLight.position.y = 50;
	pointLight.position.z = 130;

	// add to the scene
	scene.add(pointLight);

	return scene;
};

		
/**************** COLLISION DETECTION ****************/

// TODO: Needs to take avatar rotation into account
function detectCollision() {
	var x, z;
  if (controls.moveLeft) z = -1;
  if (controls.moveRight) z = 1;
  if (controls.moveBackward) x = -1;
  if (controls.moveForward) x = 1;

  var vector = new THREE.Vector3( x, 0, z );
  var ray = new THREE.Ray(controls.object.position, vector);
  var intersects = ray.intersectObjects(scene.children);

  if (intersects.length > 0) {
  	console.log(controls);
      if (z == -1) controls.moveLeft = false;
      if (z == 1) controls.moveRight = false;
      if (x == -1) controls.moveBackward = false;
      if (x == 1) controls.moveForward = false;
  }
}

		
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
	
	controls.update(clock.getDelta()); // Move camera

	// animate avatar's limbs
	var elapsed = clock.getElapsedTime(),
    	t = elapsed * 1000,
    	amplitude = (MOVESPEED/2 - Math.abs((t % (2*MOVESPEED)) - MOVESPEED))/MOVESPEED;

  if (controls.moveForward || controls.moveBackward ||
      controls.moveRight || controls.moveLeft) {
    avatar.getChildByName('left_leg', true).rotation.x  =    amplitude*(Math.PI/8);
  	avatar.getChildByName('right_leg', true).rotation.x = -1*amplitude*(Math.PI/8);
  	avatar.getChildByName('left_arm', true).rotation.x  =    amplitude*(Math.PI/8);
  	avatar.getChildByName('right_arm', true).rotation.x = -1*amplitude*(Math.PI/8);
  }

  detectCollision();

  renderer.render(scene, camera); // draw the scene
};

scene = initScene();
renderer = initRenderer();


/**************** GAME LOOP ****************/

(function animloop() {

	//addEvents();

  requestAnimFrame(animloop);

  render();

})();
