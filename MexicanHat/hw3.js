"use strict";

var canvas;
var gl;

//var numVertices = 36;

//======================== 网格数据加载到data中 ====================
var nRows = 50;
var nColumns = 50;

var data = new Array(nRows);
for(var i =0; i<nRows; i++) data[i]=new Array(nColumns);

for(var i=0; i<nRows; i++) {
    var x = Math.PI*(4*i/nRows-2.0);
    for(var j=0; j<nColumns; j++) {
        var y = Math.PI*(4*j/nRows-2.0);
        var r = Math.sqrt(x*x+y*y)

        // take care of 0/0 for r = 0
        if(r) data[i][j] = Math.sin(r)/r;
        else data[i][j] = 1;
    }
}
//==================================================================


var pointsArray = [];

var scale = 1.0;

var isOrtho = true;
//  add
var fColor;
const black = vec4(0.0, 0.0, 0.0, 1.0);
const red = vec4(1.0, 0.0, 0.0, 1.0);
//var data = data100;

//  平行投影
// const near   =  0.2;
// const far    =  2.0;
// const left   = -2.0;
// const right  =  2.0;
// const vtop   =  2.0;
// const bottom = -2.0;

// const near = 1.0;
// const far = 16.0;
const near = 1;
const far = 20;
const left = -1.0;
const right = 1.0;
const vtop = 1.0;
const bottom = -1.0;
//  透视投影
const fovy   = 90.0;    //  Field-of-view in Y direction angle (in degrees)
const aspect = 1.0;     //  Viewport aspect ratio

//  极坐标参数
// var radius = 1.0;
// var theta  = 0.0;
// var phi    = 0.0;
var radius = 2.0;
var theta = radians(60);
var phi = radians(10);
var dr = 5.0 * Math.PI/180.0;

//  lookAt函数参数
var eye = vec3(0.0, 0.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);
//var up = vec3(0.0, 1.0, 0.0);
var up = vec3(0.0, 0.0, 1.0);
var scaleMatrix, modelViewMatrix, projectionMatrix;
var scaleMatrixLoc, modelViewMatrixLoc, projectionMatrixLoc;

var width, height, minSize;
//============================== 将网格数据加载到pointsArray中 ============================
function loadPoints() {
    for(var i=0; i<nRows-1; i++) {
        for(var j=0; j<nColumns-1;j++) {
            //(i, j)
            pointsArray.push( vec4(2*i/nRows-1, data[i][j], 2*j/nColumns-1, 1.0));
            //(i+1, j)
            pointsArray.push( vec4(2*(i+1)/nRows-1, data[i+1][j], 2*j/nColumns-1, 1.0));
            //(i+1, j+1)
            pointsArray.push( vec4(2*(i+1)/nRows-1, data[i+1][j+1], 2*(j+1)/nColumns-1, 1.0));
            //(i, j+1)
            pointsArray.push( vec4(2*i/nRows-1, data[i][j+1], 2*(j+1)/nColumns-1, 1.0));
        }
    }
}
//=========================================================================================

window.onload = function init() {
    
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL(canvas);
    if ( !gl ) { alert("WebGL isn't available"); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    // enable depth testing and polygon offset
    // so lines will be in front of filled triangles
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 2.0);

    loadPoints();
    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    fColor = gl.getUniformLocation(program, "fColor");

    scaleMatrixLoc = gl.getUniformLocation(program, 'u_scaleMatrix');
    projectionMatrixLoc = gl.getUniformLocation(program, "u_projectionMatrix");
    modelViewMatrixLoc = gl.getUniformLocation(program, "u_modelViewMatrix");
    
    //  task1
    scale = 0.5;
/*    document.getElementById("ScaleSlider").onchange = function(event){
        scale = event.target.value;
    }*/
    document.onkeydown = function(event){
    	var e = event || window.event ||arguments.callee.caller.arguments[0];
    	//物体放大
    	if(e && e.keyCode == 74){
    		if(scale<1.75){
    			scale +=0.25;
    		}
    	}
    	//物体缩小
    	if(e && e.keyCode ==76){
    		if(scale>0.5){
    			scale -= 0.25;
    		}
    	}
    	
    	//沿X轴旋转'W'上
    	if(e && e.keyCode == 87){
            //theta += (5*Math.PI/180.0);
            phi -= dr;
    	}
    	
    	//沿x轴旋转'S'下
    	if(e && e.keyCode == 83){
            //theta -= (5*Math.PI/180.0);
            phi += dr;
    	}
    	
    	
    	//沿Z轴旋转 'A'左
    	if(e && e.keyCode == 65){
            //phi += (5*Math.PI/180.0);
            theta += dr;
    	}
    	
    	//沿Z轴旋转 'D'右
    	if(e && e.keyCode == 68){
            //phi -=(5*Math.PI/180.0);
            theta -= dr;
    	}
    	
    	//切换视角
    	if(e && e.keyCode == 80){
    		isOrtho = !isOrtho;
    		if(isOrtho) {
                btToChangePt.innerHTML = "Ortho";
            } else {
                btToChangePt.innerHTML = "Perspective";
            }
    	}
    }

    window.onresize = function(){
        width = document.documentElement.clientWidth;
        height = document.documentElement.clientHeight;
        minSize = width;
        if(height < minSize)
            minSize = height;
        if(canvas.width < minSize)
            minSize = canvas.width;
        gl.viewport( 0, 0, minSize, minSize );

    }

    render();
}

var render = function() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    scaleMatrix = new Float32Array([
        scale, 0.0,   0.0,   0.0,
        0.0,   scale, 0.0,   0.0,
        0.0,   0.0,   scale, 0.0,
        0.0,   0.0,   0.0,   1.0
    ]);

    if(isOrtho) {
        projectionMatrix = ortho(left, right, bottom, vtop, near, far);
    } else {
        projectionMatrix = perspective(fovy, aspect, near, far);
    }    
    
    var x = radius * Math.cos(theta) * Math.cos(phi);
	var y = radius * Math.cos(phi) * Math.sin(theta);
    //var z = radius * Math.sin(theta);  
    var z = radius * Math.sin(phi);
    eye = vec3(x, y, z);
    //  Task3-2
    eyePolar.value = String(radius)+", "+String(theta)+", "+String(phi);
    eyeXYZ.value = String(x)+", "+String(y)+", "+String(z);
	
    //up[1] = Math.cos(phi);
    up[2] = Math.cos(phi);
    modelViewMatrix = lookAt(eye, at, up);
    
    gl.uniformMatrix4fv(scaleMatrixLoc, false, scaleMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // draw each quad as two filled red triangles
    // and then as two black line loops
    for(var i=0; i<pointsArray.length; i+=4) {
        gl.uniform4fv(fColor, flatten(red));
        gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
        gl.uniform4fv(fColor, flatten(black));
        gl.drawArrays(gl.LINE_LOOP, i, 4);
    }
    requestAnimFrame(render);
}
