// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`
  // u_ProjectionMatrix * u_ViewMatrix *

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor; // use color
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0); // use UV debug color
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV); // use texture0
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV); // use texture1
    } else {
      gl_FragColor = vec4(1, .2, .2, 1); // error, use reddish
    }
  }`

  let canvas;
  let gl;
  let a_Position;
  let a_UV;
  let u_FragColor;
  let u_Size;
  let u_ModelMatrix;
  let u_ProjectionMatrix;
  let u_ViewMatrix;
  let u_GlobalRotateMatrix;
  let u_Sampler0;
  let u_Sampler1;
  let u_whichTexture;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    // gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }

    gl.enable(gl.DEPTH_TEST);
    
}

function connectVariables() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // get storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // get storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  // get storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  // get storage location of u_ProjectionMatrix
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  // Get the storage location of u_Sampler0
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  // Get the storage location of u_Sampler1
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  // Get the storage location of u_whichTexture
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return false;
  }

  // set an initial value for u_ModelMatrix to the identity matrix
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

  // u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  // if (!u_Size) {
  //   console.log('Failed to get the storage location of u_Size');
  //   return;
  // }
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const RANDOM = 3;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_size = 5;
let g_selectedType = POINT;
let g_segments = 10;
let g_globalAngle = 0;
let g_armAngle = 0;
let g_handAngle = 0;
let g_seconds = 0;
let g_armAnimation = true;
let g_handAnimation = true;
let g_eyeColor = [1.0, 1.0, 1.0, 1.0];
let g_eyeAnimation = true;
let g_legAnimation = true;
let g_leftLegVertical = 0;
let g_rightLegVertical = 0;
let g_batonAnimation = true;
let g_batonAngle = 0;

let eyesLegs = true;

let fly = false;
let flyVertical = 0;

// let g_eye = new Vector3([0, 0, -3])
// let g_at = new Vector3([0, 0, 100])
// let g_up = new Vector3([0, 1, 0])
let g_camera = new Camera();

var g_map = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0, 0, 0, 1],
  [0, 1, 2, 1, 0, 0, 1, 0],
  [0, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 2, 0],
  [1, 2, 1, 0, 0, 2, 2, 2],
  [0, 1, 0, 0, 0, 0, 2, 0]
  ];

function drawMap() {
  var x, y, z = 0;
  for (x=0; x<8; x++) {
    for (y=0; y<8; y++) {
      var num = g_map[x][y];
      // for (z=0; z<=num; z++) {
      //   var wall = new Cube();
      //   wall.textureNum = 1;
      //   wall.matrix.translate(x-14, -0.75+num, y-10);
      //   wall.render();
      // }
      if (num == 1) {
        for (z=0; z<10; z++) {
          var wall = new Cube();
          wall.textureNum = 1;
          wall.matrix.translate((x-5), -1+z, (y-5));
          wall.render();
        }
        // wall.matrix.translate(x-14, -0.75, y-10);
        // wall.render();
      }
      else if (num == 2) {
        for (z=0; z<15; z++) {
          var wall = new Cube();
          wall.textureNum = 1;
          wall.matrix.translate((x-5), -1+z, (y-5));
          wall.render();
        }
      }
    }
  }
}


function HTML_UI_functions() {
  document.getElementById('fly').onclick = function() {
      fly = !fly;
  };

  document.getElementById('eyesLegsOn').onclick = function() {
    eyesLegs = true;
  };

  document.getElementById('eyesLegsOff').onclick = function() {
    eyesLegs = false;
  };

  // armOn and armOff buttons
  document.getElementById('armOn').onclick = function() {
    g_armAnimation = true;
  };

  document.getElementById('armOff').onclick = function() {
    g_armAnimation = false;
  };

  // handOn and handOff buttons
  document.getElementById('handOn').onclick = function() {
    g_handAnimation = true;
  };

  document.getElementById('handOff').onclick = function() {
    g_handAnimation = false;
  };


  document.getElementById('armSlide').addEventListener("mousemove", function() {
    g_armAngle = this.value;
    renderAllShapes();
  });

  document.getElementById('handSlide').addEventListener("mousemove", function() {
    g_handAngle = this.value;
    renderAllShapes();
  });

  document.getElementById('angleSlide').addEventListener("mousemove", function() {
    g_globalAngle = this.value;
    renderAllShapes();
  });

}

function initTextures(num) {
  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }


  // Register the event handler to be called on loading an image
  image.onload = function(){ sendImageToTEXTURE(image, num); };
  // Tell the browser to load an image
  if (num == 0) {
    image.src = '../lib/sky.jpg';
  } else if (num == 1) {
  image.src = '../lib/obama.png';
  }
  // add more texture loading here

  return true;
}

function sendImageToTEXTURE(image, num) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  if (num == 0) {
    gl.activeTexture(gl.TEXTURE0);
  } else if (num == 1) {
    gl.activeTexture(gl.TEXTURE1);
  }
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  // Set the texture unit 0 to the sampler
  if (num == 0) {
    gl.uniform1i(u_Sampler0, 0);
  }
  else if (num == 1) {
    gl.uniform1i(u_Sampler1, 1);
  }
  
  gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>

  // gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
  console.log("texture loaded");
}




var g_startTime = performance.now()/1000.0;

var ticking;

function ticking() {
  g_seconds = performance.now()/1000.0 - g_startTime;
  // console.log(g_seconds);

  updateAnimationAngles();

  renderAllShapes();

  requestAnimationFrame(ticking);
}

function main() {

  setupWebGL();

  connectVariables();

  HTML_UI_functions();

  // Register function (event handler) to be called on a mouse press
  // canvas.onmousedown = click;
  // canvas.onmousemove = function(ev) { if(ev.buttons == 1) click(ev); };

  // if mouse is pressed on left side of screen, pan camera left
  // if mouse is pressed on right side of screen, pan camera right
  canvas.onmousedown = function(ev) {
    if (ev.clientX < canvas.width/2) {
      g_camera.rotateCameraLR("left");
    }
    else {
      g_camera.rotateCameraLR("right");
    }
  };

  document.onkeydown = keydown;

  initTextures(0);
  initTextures(1);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  // gl.clear(gl.COLOR_BUFFER_BIT);
  // renderAllShapes();
  ticking();
  requestAnimationFrame(ticking);
}

main();





var g_shapesList = [];


function click(ev) {

  let [x, y] = convertCoords(ev);

  let point;
  if(g_selectedType == POINT) {
    point = new Point();
  } else if(g_selectedType == TRIANGLE) {
    point = new Triangle();
  }
  else if(g_selectedType == CIRCLE) {
    point = new Circle();
  }
  else if(g_selectedType == RANDOM) {
    let rand = Math.random();
    if(rand < 0.33) {
      point = new Point();
    } else if(rand < 0.66) {
      point = new Triangle();
    } else {
      point = new Circle();
    }
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_size;
  if (g_selectedType == CIRCLE) {
    point.segments = g_segments;
  }
  if (g_selectedType == RANDOM) {
    point.position = [Math.random()*2-1, Math.random()*2-1];
    point.color = [Math.random(), Math.random(), Math.random(), 1.0];
    point.size = Math.random()*50+10;
    if (point.type == "circle") {
      point.segments = Math.floor(Math.random()*10);
    }
  }
  g_shapesList.push(point);

  // Store the coordinates to g_points array
  // g_points.push([x, y]);

  // g_colors.push(g_selectedColor.slice());

  // g_sizes.push(g_size);
  // Store the coordinates to g_points array
  // if (x >= 0.0 && y >= 0.0) {      // First quadrant
  //   g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
  // } else if (x < 0.0 && y < 0.0) { // Third quadrant
  //   g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
  // } else {                         // Others
  //   g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
  // }

  renderAllShapes();

}

function convertCoords(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x, y]);

}

// update angles if currently animated
function updateAnimationAngles() {
  if (eyesLegs) {
    g_eyeAnimation = true;
    g_legAnimation = true;
    g_batonAnimation = true;
  }
  else {
    g_eyeAnimation = false;
    g_legAnimation = false;
    g_batonAnimation = false;
  }


  if (g_armAnimation) {
    g_armAngle = 30*Math.sin(g_seconds)+15;
  }
  if (g_handAnimation) {
    g_handAngle = 45*Math.sin(3*g_seconds);
  }

  // robot's eyes should change color with time
  if (g_eyeAnimation){
    g_eyeColor = [Math.abs(Math.sin(g_seconds)), Math.abs(Math.cos(g_seconds)), Math.abs(Math.sin(2*g_seconds)), 1.0];
  }
  if (g_legAnimation){
    g_leftLegVertical = 0.25*Math.sin(g_seconds);
    g_rightLegVertical = 0.25*Math.cos(g_seconds);
  }

  if (g_batonAnimation) {
    g_batonAngle = 10*Math.sin(g_seconds);
  }

  if (fly) {
    flyVertical = flyVertical + 0.01;
  }
  else {
    if (flyVertical > 0) {
    flyVertical = flyVertical - 0.01;
    }
  }

}

function keydown(ev) {
  let key = ev.keyCode;
  if (key == 87) { // w
    g_camera.movement("forward");
  }
  else if (key == 83) { // s
    g_camera.movement("back");
  }
  else if (key == 65) { // a
    g_camera.movement("left");
  }
  else if (key == 68) { // d
    g_camera.movement("right");
  }
  else if (key == 88) { // x
    g_camera.movement("up");
  }
  else if (key == 90) { // z
    g_camera.movement("down");
  }
  else if (key == 81) { // q
    g_camera.rotateCameraLR("left");
  }
  else if (key == 69) { // e
    g_camera.rotateCameraLR("right");
  }
  else if (key == 82) { // r
    g_camera.rotateCameraUD("down");
  }
  else if (key == 70) { // f
    g_camera.rotateCameraUD("up");
  }

  else if (key == 49) { // 1
    // find map square in front of camera and toggle state in g_map
    var x = Math.round(g_camera.eye.elements[0]);
    var z = Math.round(g_camera.eye.elements[2]);
    var atP = new Vector3;
    atP.set(g_camera.at);
    atP.sub(g_camera.eye);
    atP.normalize();
    var y = Math.round(g_camera.eye.elements[1]);
    x = x + atP.elements[0];
    z = z + atP.elements[2];
    if (g_map[x][z] == 0) {
      g_map[x][z] = 1;
    }

    else if (g_map[x][z] == 2) {
      g_map[x][z] = 0;
    }
  }

  renderAllShapes();
  console.log(key);


}





function renderAllShapes() {

  var StartTime = performance.now();

  var projMat = new Matrix4();
  projMat.setPerspective(90, -canvas.width/canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  viewMat.setLookAt(g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2], g_camera.at.elements[0], g_camera.at.elements[1], g_camera.at.elements[2], g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);


    // draw the floor
    // moving it up a bit for now so it can be seen
    var floor = new Cube();
    floor.textureNum = 1;
    floor.matrix.translate(-15, -1.1, -10);
    floor.matrix.scale(32, 0, 32);
    floor.render();

    // draw the sky
    var sky = new Cube();
    sky.textureNum = 0;
    var skyScale = 50;
    sky.matrix.scale(skyScale, skyScale, skyScale);
    sky.matrix.translate(-0.5, -0.5, -0.5); 
    sky.render();

    drawMap();




    // draw the body cube
    var body = new Cube([0.2, 0.2, 0.8, 1.0]);
    // blue
    // body.color = [0.2, 0.2, 0.8, 1.0];
    body.textureNum = 1;
    body.matrix.translate(-0.25, -0.4+flyVertical, 0.0);
    body.matrix.scale(0.5, 1.0, 0.5);
    body.render();

    // draw a left arm

    var leftArm = new Cube([1.0, 1.0, 0.0, 1.0]);
    // leftArm.color = [1.0, 1.0, 0.0, 1.0];
    leftArm.matrix.setTranslate(-0.1, 0.1+flyVertical, 0.02);
    leftArm.matrix.rotate(45, 0, 0, 1);
    leftArm.matrix.rotate(g_armAngle, 0, 0, 1);

    var armCoordsMat = new Matrix4(leftArm.matrix);
    leftArm.matrix.scale(0.25, 0.7, 0.45);
    leftArm.render();

    // draw a left hand on the arm

    var leftHand = new Cube([0.0, 1.0, 1.0, 1.0]);
    // leftHand.color = [0.0, 1.0, 1.0, 1.0];
    leftHand.matrix = armCoordsMat;
    leftHand.matrix.translate(0.1, 0.6, 0.101);
    leftHand.matrix.scale(0.25, 0.25, 0.25);
    leftHand.matrix.rotate(45, 0, 0, 1);
    leftHand.matrix.rotate(g_handAngle, 0, 0, 1);
    leftHand.render();

    // draw a right arm
    var rightArm = new Cube([1.0, 1.0, 0.0, 1.0]);
    // rightArm.color = [1.0, 1.0, 0.0, 1.0];
    rightArm.matrix.setTranslate(0.1, 0.1+flyVertical, 0.02);
    // flip it around
    rightArm.matrix.scale(-1, 1, 1);
    rightArm.matrix.rotate(45, 0, 0, 1);
    rightArm.matrix.rotate(g_armAngle, 0, 0, 1);
    var rightArmCoordsMat = new Matrix4(rightArm.matrix);
    rightArm.matrix.scale(0.25, 0.7, 0.45);
    rightArm.render();

    // draw a right hand on the arm
    var rightHand = new Cube([0.0, 1.0, 1.0, 1.0]);
    // rightHand.color = [0.0, 1.0, 1.0, 1.0];
    rightHand.matrix = rightArmCoordsMat;
    rightHand.matrix.translate(0.1, 0.6, 0.101);
    rightHand.matrix.scale(0.25, 0.25, 0.25);
    rightHand.matrix.rotate(45, 0, 0, 1);
    rightHand.matrix.rotate(g_handAngle, 0, 0, 1);
    var rightHandCoordsMat = new Matrix4(rightHand.matrix);
    rightHand.render();

    // in his right hand, he holds a stick, which also moves with time
    var stick = new Cube([0.5, 0.5, 0.5, 1.0]);
    stick.matrix = rightHandCoordsMat;
    stick.matrix.rotate(g_batonAngle+5, 0, 0, 1);
    stick.matrix.translate(0.4, 0.2, 0.1);
    stick.matrix.scale(2, 0.5, 0.5);
    stick.render();

    // draw the head cube
    // but first a neck
    var neck = new Cube([0.0, 1.0, 0.0, 1.0]);
    // neck.color = [0.0, 1.0, 0.0, 1.0];
    neck.matrix.translate(-0.05, 0.6+flyVertical, 0.15);
    neck.matrix.scale(0.1, 0.1, 0.1);
    neck.render();

    // now a head
    var head = new Cube([1.0, 0.0, 0.0, 1.0]);
    // head.color = [1.0, 0.0, 0.0, 1.0];
    head.matrix.translate(-0.15, 0.7+flyVertical, 0.1);
    head.matrix.scale(0.3, 0.27, 0.3);
    head.render();

    // draw two square eyes on the head
    var leftEye = new Cube();
    leftEye.color = g_eyeColor;
    leftEye.matrix.translate(0.05, 0.85+flyVertical, 0.05);
    leftEye.matrix.scale(0.05, 0.05, 0.05);
    leftEye.render();

    var rightEye = new Cube();
    rightEye.color = g_eyeColor;
    rightEye.matrix.translate(-0.1, 0.85+flyVertical, 0.05);
    rightEye.matrix.scale(0.05, 0.05, 0.05);
    rightEye.render();

    // draw a mouth underneath the eyes
    var mouth = new Cube([1.0, 1.0, 1.0, 1.0]);
    // mouth.color = [1.0, 1.0, 1.0, 1.0];
    mouth.matrix.translate(-0.05, 0.75+flyVertical, 0.05);
    mouth.matrix.scale(0.1, 0.05, 0.05);
    mouth.render();

    // draw two legs, which should move up and down with time
    var leftLeg = new Cube([1.0, 0.0, 1.0, 1.0]);
    // leftLeg.color = [1.0, 0.0, 1.0, 1.0];
    leftLeg.matrix.translate(-0.2, -0.65+g_leftLegVertical+flyVertical, 0.15);
    var leftLegCoordsMat = new Matrix4(leftLeg.matrix);
    leftLeg.matrix.scale(0.15, 0.5, 0.15);
    leftLeg.render();

    var rightLeg = new Cube([1.0, 0.0, 1.0, 1.0]);
    // rightLeg.color = [1.0, 0.0, 1.0, 1.0];
    rightLeg.matrix.translate(0.05, -0.65+g_rightLegVertical+flyVertical, 0.15);
    var rightLegCoordsMat = new Matrix4(rightLeg.matrix);
    rightLeg.matrix.scale(0.15, 0.5, 0.15);
    rightLeg.render();

    // draw two feet
    var leftFoot = new Cube([0.6, 0.5, 0.6, 1.0]);
    // leftFoot.color = [0.6, 0.5, 0.6, 1.0];
    leftFoot.matrix = leftLegCoordsMat;
    leftFoot.matrix.translate(-0.025, -0.1, -0.15);
    leftFoot.matrix.scale(0.2, 0.1, 0.3);
    leftFoot.render();

    var rightFoot = new Cube([0.6, 0.5, 0.6, 1.0]);
    // rightFoot.color = [0.6, 0.5, 0.6, 1.0];
    rightFoot.matrix = rightLegCoordsMat;
    rightFoot.matrix.translate(-0.025, -0.1, -0.15);
    rightFoot.matrix.scale(0.2, 0.1, 0.3);
    rightFoot.render();

    // check time and show on webpage
    // how to fix ReferenceError: StartTime is not defined?

    var duration = performance.now() - StartTime;
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "numdot");


}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get element with id: " + htmlID);
    return;
  }
  htmlElm.innerHTML = text;
}