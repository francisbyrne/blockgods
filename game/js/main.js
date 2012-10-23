
// constants
var KEY     = { ESC: 27, SPACE: 32, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 },
    DIR     = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3, MIN: 0, MAX: 3 };

// variables
var camera, scene, renderer;
var geometry, material, mesh;
var playing = true,     // boolean - game is in progress
    actions;            // queue of user actions (inputs)



init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 1000;

    scene = new THREE.Scene();

    geometry = new THREE.CubeGeometry( 400, 200, 200 );
    material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );

    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    var creeper = new Creeper();
    creeper.model.scale.setLength(50);
    scene.add(creeper.model);

    clearActions();

    renderer = new THREE.CanvasRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

};


function animate() {

    addEvents()

    // note: three.js includes requestAnimationFrame shim
    requestAnimationFrame( animate );

    handle(actions.shift());


    renderer.render( scene, camera );

}

function keydown(ev) {
  var handled = false;
  if (playing) {
    switch(ev.keyCode) {
      case KEY.LEFT:   actions.push(DIR.LEFT);  handled = true; break;
      case KEY.RIGHT:  actions.push(DIR.RIGHT); handled = true; break;
      case KEY.UP:     actions.push(DIR.UP);    handled = true; break;
      case KEY.DOWN:   actions.push(DIR.DOWN);  handled = true; break;
      case KEY.ESC:    lose();                  handled = true; break;
    }
  }
  if (handled)
    ev.preventDefault(); // prevent arrow keys from scrolling the page (supported in IE9+ and all other browsers)
};

function addEvents() {
  document.addEventListener('keydown', keydown, false);
  //window.addEventListener('resize', resize, false);
};

function handle(action) {
  switch(action) {
    case DIR.LEFT:  mesh.rotation.y += 0.1;  break;
    case DIR.RIGHT: mesh.rotation.y -= 0.1; break;
    case DIR.UP:    mesh.rotation.x -= 0.1;        break;
    case DIR.DOWN:  mesh.rotation.x += 0.1;          break;
  }
};


function clearActions()         { actions = []; };