/*	Created by djazz
 *	http://djazz.mine.nu
 *	Twitter: @daniel_hede
 */

(function (global) {
	'use strict';
	// shim layer with setTimeout fallback
	var requestAnimFrame = (function () {
		return window.requestAnimationFrame       || 
		       window.webkitRequestAnimationFrame || 
		       window.mozRequestAnimationFrame    || 
		       window.oRequestAnimationFrame      || 
		       window.msRequestAnimationFrame     || 
		       function(/* function */ callback, /* DOMElement */ element){
		           window.setTimeout(callback, 1000 / 60);
		       };
	}());
	
	function cubeFromPlanes (size, mat) {
		var cube = new THREE.Object3D();
		var meshes = [];
		for(var i=0; i < 6; i++) {
			var mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
			mesh.doubleSided = true;
			cube.add(mesh);
			meshes.push(mesh);
		}
		// Front
		meshes[0].rotation.x = Math.PI/2;
		meshes[0].rotation.z = -Math.PI/2;
		meshes[0].position.x = size/2;
		
		// Back
		meshes[1].rotation.x = Math.PI/2;
		meshes[1].rotation.z = Math.PI/2;
		meshes[1].position.x = -size/2;
		
		// Top
		meshes[2].position.y = size/2;
		
		// Bottom
		meshes[3].rotation.y = Math.PI;
		meshes[3].rotation.z = Math.PI;
		meshes[3].position.y = -size/2;
		
		// Left
		meshes[4].rotation.x = Math.PI/2;
		meshes[4].position.z = size/2;
		
		// Right
		meshes[5].rotation.x = -Math.PI/2;
		meshes[5].rotation.y = Math.PI;
		meshes[5].position.z = -size/2;
		
		return cube;
	};
	
	function getMaterial (img, trans) {
		var material = new THREE.MeshBasicMaterial({
			map: new THREE.Texture(
				img,
				new THREE.UVMapping(),
				THREE.ClampToEdgeWrapping,
				THREE.ClampToEdgeWrapping,
				THREE.NearestFilter,
				THREE.NearestFilter,
				(trans? THREE.RGBAFormat : THREE.RGBFormat)
			),
			transparent: trans
		});
		material.map.needsUpdate = true;
		return material;
	};
	function uvmap (geometry, face, x, y, w, h, rotateBy) {
		if(!rotateBy) rotateBy = 0;
		var uvs = geometry.faceVertexUvs[0][face];
		var tileU = x;
		var tileV = y;
		
		uvs[ (0 + rotateBy) % 4 ].u = tileU * tileUvWidth;
		uvs[ (0 + rotateBy) % 4 ].v = tileV * tileUvHeight;
		uvs[ (1 + rotateBy) % 4 ].u = tileU * tileUvWidth;
		uvs[ (1 + rotateBy) % 4 ].v = tileV * tileUvHeight + h * tileUvHeight;
		uvs[ (2 + rotateBy) % 4 ].u = tileU * tileUvWidth + w * tileUvWidth;
		uvs[ (2 + rotateBy) % 4 ].v = tileV * tileUvHeight + h * tileUvHeight;
		uvs[ (3 + rotateBy) % 4 ].u = tileU * tileUvWidth + w * tileUvWidth;
		uvs[ (3 + rotateBy) % 4 ].v = tileV * tileUvHeight;
	};
	
	function createItem (id) {
		function getSides (x, y) {
			var ix = Math.floor(id % 16)*16;
			var iy = Math.floor(id / 16)*16;
			
			var px = (x+1) < 16? imd[((x+1)+y*16)*4+3] : 0;
			var nx = (x-1) >= 0? imd[((x-1)+y*16)*4+3] : 0;
			var py = (y+1) < 16? imd[(x+(y-1)*16)*4+3] : 0;
			var ny = (y-1) >= 0? imd[(x+(y+1)*16)*4+3] : 0;
			
			return {
				px: !px, // Turns zero and undefined to true
				nx: !nx,
				py: !py,
				ny: !ny,
				pz: supportWebGL,
				nz: supportWebGL
			};
		};
		
		if(itemgeometries[id] === undefined) {
			var imgdata = itemsc.getImageData(Math.floor(id % 16)*16, Math.floor(id / 16)*16, 16, 16);
			var imd = imgdata.data;
			
			tileUvWidth = 1/256;
			tileUvHeight = 1/256;
			
			var geo = new THREE.Geometry();
			
			var isAllEmpty = true;
			
			for(var x=0; x < 16; x++) {
				for(var y=0; y < 16; y++) {
					if(imd[(x+y*16)*4+3] === 0) {
						continue;
					}
					isAllEmpty = false;
					
					var voxel = new THREE.CubeGeometry(1, 1, 1, 1, 1 , 1, undefined, getSides(x, y));
					
					for(var i=0; i < 6; i++) { // Fix color of voxel
						if(voxel.faceVertexUvs[0][i]) {
							uvmap(voxel, i, Math.floor(id % 16)*16+x, Math.floor(id / 16)*16+y, 1, 1);
						}
					}
					for(var i=0; i < 8; i++) { // Fix voxel's position
						if(voxel.vertices[i]) {
							voxel.vertices[i].x += x-7.5;
							voxel.vertices[i].y += -(y-7.5);
						}
					}
					
					THREE.GeometryUtils.merge(geo, voxel);
				}
			}
			if(!supportWebGL) {
				var sides = new THREE.CubeGeometry(16, 16, 1, 1, 1, 1, undefined, { px: false, nx: false, py: false, ny: false });
				uvmap(sides, 0, Math.floor(id % 16)*16, Math.floor(id / 16)*16, 16, 16);
				uvmap(sides, 1, Math.floor(id % 16)*16+16, Math.floor(id / 16)*16, -16, 16);
				THREE.GeometryUtils.merge(geo, sides);
			}
			
			
			itemgeometries[id] = geo;
		}
		else {
			var geo = itemgeometries[id];
		}
		
		var mesh = new THREE.Mesh( geo, itemsMaterial );
		
		return mesh;
	};
	
	function render () {
		requestAnimFrame(render, renderer.domElement);
		//setTimeout(render, 0);
		
		var time = (Date.now() - startTime)/1000;
		
		
		if(currentView === 'steveeyes') {
			camera.position.x = 0;
			camera.position.y = 0;
			camera.position.z = 1*Math.cos(0.6662 * time*10);
			camera.lookAt(new THREE.Vector3(10, 0, 0));
		}
		else if(currentView === 'stevefront' || currentView === 'steveback') {
			camera.position.x = currentView === 'stevefront'? 1 : -1;
			camera.position.y = 0.1*Math.sin(time);
			camera.position.z = 0.1*Math.cos(time);
			camera.position.setLength(50-Math.sin(time/2)*10);
			camera.lookAt(new THREE.Vector3(0, 0, 0));
		}
		else {
			camera.position.x = 100*Math.cos(time/2);
			camera.position.y = 20*Math.sin(time/5);
			camera.position.z = 100*Math.sin(time/2);
			camera.position.setLength(115-Math.sin(time)*20);
			camera.lookAt(new THREE.Vector3(0, 20+Math.sin(time/4)*10, 0));
		}
		
		var rot = time;
		var l = itemsmeshes.length;
		for(var i=0; i < l; i++) {
			itemsmeshes[i].rotation.y = (i%2 === 0 ? -1.5 : 1)*rot+i*2;
			itemsmeshes[i].position.y = Math.sin(rot/30+i)*200;
		}
		
		headgroup.rotation.y = Math.sin(time*1.5)/3;
		headgroup.rotation.z = Math.sin(time)/2;
		
		// creeper.head.rotation.y = Math.sin(time*3)/5-0.2;
		// creeper.head.rotation.z = Math.sin(time/2)/4;
		
		rightarm.rotation.z = 2 * Math.cos(0.6662 * time*10 + Math.PI);
		rightarm.rotation.x = 1 * (Math.cos(0.2812 * time*10) - 1);
		leftarm.rotation.z = 2 * Math.cos(0.6662 * time*10);
		leftarm.rotation.x = 1 * (Math.cos(0.2312 * time*10) + 1);
		
		rightleg.rotation.z = 1.4 * Math.cos(0.6662 * time*10);
		leftleg.rotation.z = 1.4 * Math.cos(0.6662 * time*10 + Math.PI);
		
		// creeper.legs.leftback.rotation.z = creeper.legs.rightfront.rotation.z = 0.3*Math.cos(time*10);
		// creeper.legs.leftfront.rotation.z = creeper.legs.rightback.rotation.z = 0.3*Math.cos(time*10 + Math.PI);
		
		playerGroup.position.y = 1.7 * Math.cos(0.6662 * time*10 * 2); // Jumping
		playerGroup.position.z = 1 * Math.cos(0.6662 * time*10); // Dodging when running
		playerGroup.rotation.x = (currentView === 'steveeyes'?0.05:0.01) * Math.cos(0.6662 * time*10 + Math.PI); // Slightly tilting when running
		
		var pos = time*0.9;
		
		playerGroup.rotation.y = -(pos);
		playerGroup.position.x = 90*Math.cos(pos-Math.PI/2);
		playerGroup.position.z = 90*Math.sin(pos-Math.PI/2);
		
		// creeper.model.rotation.y = -(pos-Math.PI/4);
		// creeper.model.position.x = 70*Math.cos((pos-Math.PI/4)-Math.PI/2);
		// creeper.model.position.z = 70*Math.sin((pos-Math.PI/4)-Math.PI/2);
		
		renderer.render(scene, camera);
		//stats.update();
	};
	
	function changeView (view) {
		switch(view) {
			case 'stevefront':
			case 'steveback':
				scene.remove(camera);
				headmesh.add(camera);
				break;
			case 'steveeyes':
				scene.remove(camera);
				headmesh.add(camera);
				break;
			case 'rotcamera':
				headmesh.remove(camera);
				scene.add(camera);
				break;
		};
		currentView = view;
	};
	
	function updateDial () {
		var hour = new Date().getHours();
		var angle = (hour/24)*Math.PI*2+Math.PI;
		dialc.clearRect(0, 0, 16, 16);
		dialc.save();
		dialc.translate(8, 8);
		dialc.rotate(angle);
		dialc.translate(-8, -8);
		dialc.drawImage(dial, 0, 0);
		dialc.restore();
		
		itemsc.clearRect(0, 0, itemscanvas.width, itemscanvas.height);
		itemsc.drawImage(items, 0, 0);
		
		var clockx = 6*16;
		var clocky = 4*16;
		var itemdata = itemsc.getImageData(clockx, clocky, 16, 16);
		var itd = itemdata.data;
		var dialdata = dialc.getImageData(0, 0, 16, 16);
		var idd = dialdata.data;
		for(var x=0; x < 16; x++) {
			for(var y=0; y < 16; y++) {
				if(itd[(x+y*16)*4] === itd[(x+y*16)*4+2] && itd[(x+y*16)*4+1] === 0) {
					var alpha = itd[(x+y*16)*4] / 255;
					itd[(x+y*16)*4] = idd[(x+y*16)*4]*alpha;
					itd[(x+y*16)*4+1] = idd[(x+y*16)*4+1]*alpha;
					itd[(x+y*16)*4+2] = idd[(x+y*16)*4+2]*alpha;
				}
			}
		}
		itemsc.putImageData(itemdata, clockx, clocky);
		itemsMaterial.map.needsUpdate = true;
	};
	
	var supportWebGL = !!global.WebGLRenderingContext && (!!global.document.createElement('canvas').getContext('experimental-webgl') || !!global.document.createElement('canvas').getContext('webgl'));
	
	var startTime;
	var currentView;
	
	var tileUvWidth = 1;
	var tileUvHeight = 1;
	
	// var creeper = new Creeper();
	// creeper.model.scale.setLength(2);
	
	var topbar = global.document.querySelector('#topbar');
	var container = global.document.querySelector('#container');
	var loader = global.document.querySelector('#loader');
	//var selectcamera = global.document.querySelector('#selectcamera');
	//var skycheckbox = global.document.querySelector('#skycheckbox');
	
	// selectcamera.addEventListener('change', function () {
	// 	changeView(selectcamera.options[selectcamera.selectedIndex].value);
	// }, false);
	
	// var stats = new Stats();
	// stats.domElement.style.position = 'absolute';
	// stats.domElement.style.left = '0px';
	// stats.domElement.style.top = '0px';
	// stats.domElement.style.margin = '2px';
	// topbar.appendChild( stats.domElement );
	
	var itemscanvas = global.document.createElement('canvas');
	itemscanvas.width = 256;
	itemscanvas.height = 256;
	var itemsc = itemscanvas.getContext('2d');
	var itemsMaterial = getMaterial(itemscanvas, true);
	
	var skincanvas = global.document.createElement('canvas');
	skincanvas.width = 64;
	skincanvas.height = 32;
	var skinc = skincanvas.getContext('2d');
	var charMaterial = getMaterial(skincanvas, false);
	var charMaterialTrans = getMaterial(skincanvas, true);
	
	var w = global.innerWidth, h = global.innerHeight;
	
	var scene = new THREE.Scene();
	
	var camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 1500);
	//scene.add(camera);
	
	
	// Skybox
	
	// load the cube textures
	// var urls = [
	// 	"panorama3.png",
	// 	"panorama1.png",
	// 	"panorama4.png",
	// 	"panorama5.png",
	// 	"panorama2.png",
	// 	"panorama0.png"
	// ];
	 var textureCube = THREE.ImageUtils.loadTextureCube( [] );
	
	// init the cube shadder
	var shader  = THREE.ShaderUtils.lib["cube"];
	var uniforms    = THREE.UniformsUtils.clone( shader.uniforms );
	uniforms['tCube'].texture = textureCube;
	var material = new THREE.ShaderMaterial({
		fragmentShader	: shader.fragmentShader,
		vertexShader	: shader.vertexShader,
		uniforms		: uniforms
	});
	
	// build the skybox Mesh
	// var skyboxMesh  = new THREE.Mesh( new THREE.CubeGeometry( 500, 500, 500, 1, 1, 1, null, true ), material );
	// skyboxMesh.doubleSided = true;
	// if(supportWebGL) {
	// 	scene.add( skyboxMesh );
	// 	skycheckbox.addEventListener('change', function () {
	// 		skyboxMesh.visible = this.checked;
	// 	}, false);
	// }
	// else {
	// 	skycheckbox.disabled = true;
	// 	skycheckbox.checked = false;
	// }
	
	
	
	// Player model
	
	tileUvWidth = 1/64;
	tileUvHeight = 1/32;
	
	var headgroup = new THREE.Object3D();
	var upperbody = new THREE.Object3D();
	
	// Left leg
	var leftleggeo = new THREE.CubeGeometry(4, 12, 4);
	for(var i=0; i < 8; i+=1) {
		leftleggeo.vertices[i].y -= 6;
	}
	var leftleg = new THREE.Mesh(leftleggeo, charMaterial);
	leftleg.position.z = -2;
	leftleg.position.y = -6;
	uvmap(leftleggeo, 0, 8, 20, -4, 12);
	uvmap(leftleggeo, 1, 16, 20, -4, 12);
	uvmap(leftleggeo, 2, 4, 16, 4, 4, 3);
	uvmap(leftleggeo, 3, 8, 20, 4, -4, 1);
	uvmap(leftleggeo, 4, 12, 20, -4, 12);
	uvmap(leftleggeo, 5, 4, 20, -4, 12);
	
	
	
	// Right leg
	var rightleggeo = new THREE.CubeGeometry(4, 12, 4);
	for(var i=0; i < 8; i+=1) {
		rightleggeo.vertices[i].y -= 6;
	}
	var rightleg = new THREE.Mesh(rightleggeo, charMaterial);
	rightleg.position.z = 2;
	rightleg.position.y = -6;
	uvmap(rightleggeo, 0, 4, 20, 4, 12);
	uvmap(rightleggeo, 1, 12, 20, 4, 12);
	uvmap(rightleggeo, 2, 8, 16, -4, 4, 3);
	uvmap(rightleggeo, 3, 12, 20, -4, -4, 1);
	uvmap(rightleggeo, 4, 0, 20, 4, 12);
	uvmap(rightleggeo, 5, 8, 20, 4, 12);
	
	
	
	// Body
	var bodygeo = new THREE.CubeGeometry(4, 12, 8);
	var bodymesh = new THREE.Mesh(bodygeo, charMaterial);
	uvmap(bodygeo, 0, 20, 20, 8, 12);
	uvmap(bodygeo, 1, 32, 20, 8, 12);
	uvmap(bodygeo, 2, 20, 16, 8, 4, 1);
	uvmap(bodygeo, 3, 28, 16, 8, 4, 3);
	uvmap(bodygeo, 4, 16, 20, 4, 12);
	uvmap(bodygeo, 5, 28, 20, 4, 12);
	upperbody.add(bodymesh);
	
	
	// Left arm
	var leftarmgeo = new THREE.CubeGeometry(4, 12, 4);
	for(var i=0; i < 8; i+=1) {
		leftarmgeo.vertices[i].y -= 4;
	}
	var leftarm = new THREE.Mesh(leftarmgeo, charMaterial);
	leftarm.position.z = -6;
	leftarm.position.y = 4;
	leftarm.rotation.x = Math.PI/32;
	uvmap(leftarmgeo, 0, 48, 20, -4, 12);
	uvmap(leftarmgeo, 1, 56, 20, -4, 12);
	uvmap(leftarmgeo, 2, 48, 16, -4, 4, 1);
	uvmap(leftarmgeo, 3, 52, 16, -4, 4, 3);
	uvmap(leftarmgeo, 4, 52, 20, -4, 12);
	uvmap(leftarmgeo, 5, 44, 20, -4, 12);
	upperbody.add(leftarm);
	
	// Right arm
	var rightarmgeo = new THREE.CubeGeometry(4, 12, 4);
	for(var i=0; i < 8; i+=1) {
		rightarmgeo.vertices[i].y -= 4;
	}
	var rightarm = new THREE.Mesh(rightarmgeo, charMaterial);
	rightarm.position.z = 6;
	rightarm.position.y = 4;
	rightarm.rotation.x = -Math.PI/32;
	uvmap(rightarmgeo, 0, 44, 20, 4, 12);
	uvmap(rightarmgeo, 1, 52, 20, 4, 12);
	uvmap(rightarmgeo, 2, 44, 16, 4, 4, 1);
	uvmap(rightarmgeo, 3, 48, 16, 4, 4, 3);
	uvmap(rightarmgeo, 4, 40, 20, 4, 12);
	uvmap(rightarmgeo, 5, 48, 20, 4, 12);
	upperbody.add(rightarm);
	
	//Head
	var headgeo = new THREE.CubeGeometry(8, 8, 8);
	var headmesh = new THREE.Mesh(headgeo, charMaterial);
	headmesh.position.y = 2;
	uvmap(headgeo, 0, 8, 8, 8, 8);
	uvmap(headgeo, 1, 24, 8, 8, 8);
	
	uvmap(headgeo, 2, 8, 0, 8, 8, 1);
	uvmap(headgeo, 3, 16, 0, 8, 8, 3);
	
	uvmap(headgeo, 4, 0, 8, 8, 8);
	uvmap(headgeo, 5, 16, 8, 8, 8);
	headgroup.add(headmesh);
	
	var helmet = cubeFromPlanes(9, charMaterialTrans);
	helmet.position.y = 2;
	uvmap(helmet.children[0].geometry, 0, 32+8, 8, 8, 8);
	uvmap(helmet.children[1].geometry, 0, 32+24, 8, 8, 8);
	uvmap(helmet.children[2].geometry, 0, 32+8, 0, 8, 8, 1);
	uvmap(helmet.children[3].geometry, 0, 32+16, 0, 8, 8, 3);
	uvmap(helmet.children[4].geometry, 0, 32+0, 8, 8, 8);
	uvmap(helmet.children[5].geometry, 0, 32+16, 8, 8, 8);
	
	headgroup.add(helmet);
	
	var ears = new THREE.Object3D();
	
	var eargeo = new THREE.CubeGeometry(1, (9/8)*6, (9/8)*6);
	var leftear = new THREE.Mesh(eargeo, charMaterial);
	var rightear = new THREE.Mesh(eargeo, charMaterial);
	
	leftear.position.y = 2+(9/8)*5;
	rightear.position.y = 2+(9/8)*5;
	leftear.position.z = -(9/8)*5;
	rightear.position.z = (9/8)*5;
	
	uvmap(eargeo, 0, 25, 1, 6, 6); // Front side
	uvmap(eargeo, 1, 32, 1, 6, 6); // Back side
	
	uvmap(eargeo, 2, 25, 0, 6, 1, 1); // Top edge
	uvmap(eargeo, 3, 31, 0, 6, 1, 1); // Bottom edge
	
	uvmap(eargeo, 4, 24, 1, 1, 6); // Left edge
	uvmap(eargeo, 5, 31, 1, 1, 6); // Right edge
	
	ears.add(leftear);
	ears.add(rightear);
	
	leftear.visible = rightear.visible = false;
	
	headgroup.add(ears);
	headgroup.position.y = 8;
	
	
	var playerModel = new THREE.Object3D();
	
	playerModel.add(leftleg);
	playerModel.add(rightleg);
	
	playerModel.add(upperbody);
	playerModel.add(headgroup);
	
	
	var playerGroup = new THREE.Object3D();
	
	playerGroup.add(playerModel);
	
	playerGroup.scale.setLength(2);
	playerModel.position.y = 18;
	
	headmesh.add(camera);
	
	
	if(supportWebGL) {
		var renderer = new THREE.WebGLRenderer({antialias: false, preserveDrawingBuffer: true});
		renderer.sortObjects = false;
	}
	else {
		var renderer = new THREE.CanvasRenderer({antialias: false});
	}
	renderer.setSize(w, h);
	//renderer.setClearColorHex(0xff00ff, 1.0);
	document.body.appendChild(renderer.domElement);
	
	// var takescreenshot = global.document.querySelector('#takescreenshot');
	// takescreenshot.addEventListener('click', function (e) {
	// 	e.preventDefault();
		
	// 	global.open(renderer.domElement.toDataURL(), '_blank');
	// }, false);
	
	global.addEventListener('resize', function () {
		w = global.innerWidth;
		h = global.innerHeight;
		renderer.setSize(w, h);
		camera.aspect = w/h;
		camera.updateProjectionMatrix();
	}, false);
	
	
	var itemsmeshes = [];
	var itemgeometries = [];
	
	var items = new Image();
	items.onload = function () {
		
		itemsc.clearRect(0, 0, itemscanvas.width, itemscanvas.height);
		itemsc.drawImage(items, 0, 0);
		//itemsMaterial.map.needsUpdate = true;
		
		
		// var l = supportWebGL? 16*16 : 16*8;
		
		// for(var i=0; i < l; i++) {
		// 	for(var j=0; j < (supportWebGL?4:1); j++) {
		// 		var item = createItem(i);
		// 		item.position.x = Math.random()*400-200;
		// 		item.position.y = Math.random()*400-200;
		// 		item.position.z = Math.random()*400-200;
		// 		scene.add(item);
		// 		itemsmeshes.push(item);
		// 	}
		// }
		
		
		var lefthand = createItem(16*6+2); // Iron pickaxe
		lefthand.position.x = 6;
		lefthand.position.y = -8;
		lefthand.rotation.z = -Math.PI/4;
		lefthand.rotation.x = Math.PI;
		leftarm.add(lefthand);
		
		var righthand = createItem(16*4+2); // Iron sword
		righthand.position.x = 6;
		righthand.position.y = -9;
		righthand.rotation.z = -Math.PI/4;
		righthand.rotation.x = Math.PI;
		rightarm.add(righthand);
		
		scene.add(playerGroup);
		scene.add(creeper.model);
		
		setTimeout(function () {
			loader.style.display = 'none';
			startTime = Date.now();
			changeView('stevefront');
			selectcamera.disabled = false;
			render();
		}, 0);
	};

	scene.add(playerGroup);
		//scene.add(creeper.model);
		
		setTimeout(function () {
			//loader.style.display = 'none';
			startTime = Date.now();
			changeView('stevefront');
			//selectcamera.disabled = false;
			render();
		}, 0);
	
	//items.src = "items.png";
	
	// var dialcanvas = global.document.createElement('canvas');
	// dialcanvas.width = 16;
	// dialcanvas.height = 16;
	// var dialc = dialcanvas.getContext('2d');
	// var dial = new Image();
	// dial.onload = function () {
	// 	updateDial();
	// 	setInterval(updateDial, 5*60*1000);
	// };
	// dial.src = "dial.png";
	
	
	var skin = new Image();
	skin.onload = function () {
		skinc.clearRect(0, 0, skincanvas.width, skincanvas.height);
		skinc.drawImage(skin, 0, 0);
		charMaterial.map.needsUpdate = true;
		charMaterialTrans.map.needsUpdate = true;
	};
	
	skin.src = "img/char.png";
	
}(window));
