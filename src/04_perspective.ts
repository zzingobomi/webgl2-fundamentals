import * as webglUtils from "./webgl-utils";
import * as webglLessonsUI from "./webgl-lessons-ui";
import vertexShaderSource from "./glsl/04/vertexShader.glsl";
import fragmentShaderSource from "./glsl/04/fragmentShader.glsl";

function makeZToWMatrix(fudgeFactor: number) {
  // prettier-ignore
  return [
    1, 0, 0, 0, 
    0, 1, 0, 0, 
    0, 0, 1, fudgeFactor, 
    0, 0, 0, 1
  ];
}

function main() {
  const canvas = document.querySelector("#c") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  const program = webglUtils.createProgramFromSources(gl, [
    vertexShaderSource,
    fragmentShaderSource,
  ]);

  // look up where the vertex data needs to go.
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const colorAttributeLocation = gl.getAttribLocation(program, "a_color");

  // look up uniform locations
  //const colorLocation = gl.getUniformLocation(program, "u_color");
  const matrixLocation = gl.getUniformLocation(program, "u_matrix");
  //const fudgeLocation = gl.getUniformLocation(program, "u_fudgeFactor");

  const positionBuffer = gl.createBuffer();

  // Create a vertex array object (attribute state)
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Set Geometry.
  setGeometry(gl);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  const p_size = 3; // 3 components per iteration
  const p_type = gl.FLOAT; // the data is 32bit floats
  const p_normalize = false; // don't normalize the data
  const p_stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  const p_offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation,
    p_size,
    p_type,
    p_normalize,
    p_stride,
    p_offset
  );

  // create the color buffer, make it the current ARRAY_BUFFER
  // and copy in the color values
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  setColors(gl);

  gl.enableVertexAttribArray(colorAttributeLocation);

  // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
  const c_size = 3; // 3 components per iteration
  const c_type = gl.UNSIGNED_BYTE; // the data is 8bit unsigned bytes
  const c_normalize = true; // convert from 0-255 to 0.0-1.0
  const c_stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  const c_offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    colorAttributeLocation,
    c_size,
    c_type,
    c_normalize,
    c_stride,
    c_offset
  );

  function radToDeg(r: number) {
    return (r * 180) / Math.PI;
  }

  function degToRad(d: number) {
    return (d * Math.PI) / 180;
  }

  // First let's make some variables
  // to hold the translation,
  const translation = [-150, 0, -360];
  const rotation = [degToRad(190), degToRad(40), degToRad(30)];
  const scale = [1, 1, 1];
  //const color = [Math.random(), Math.random(), Math.random(), 1];
  let fieldOfViewRadians = degToRad(60);

  drawScene();

  // Setup a ui.
  webglLessonsUI.setupSlider("#fieldOfView", {
    value: radToDeg(fieldOfViewRadians),
    slide: updateFieldOfView,
    min: 1,
    max: 179,
  });
  webglLessonsUI.setupSlider("#x", {
    value: translation[0],
    slide: updatePosition(0),
    max: gl.canvas.width,
  });
  webglLessonsUI.setupSlider("#y", {
    value: translation[1],
    slide: updatePosition(1),
    max: gl.canvas.height,
  });
  webglLessonsUI.setupSlider("#z", {
    value: translation[2],
    slide: updatePosition(2),
    max: gl.canvas.height,
  });
  webglLessonsUI.setupSlider("#angleX", {
    value: radToDeg(rotation[0]),
    slide: updateRotation(0),
    max: 360,
  });
  webglLessonsUI.setupSlider("#angleY", {
    value: radToDeg(rotation[1]),
    slide: updateRotation(1),
    max: 360,
  });
  webglLessonsUI.setupSlider("#angleZ", {
    value: radToDeg(rotation[2]),
    slide: updateRotation(2),
    max: 360,
  });
  webglLessonsUI.setupSlider("#scaleX", {
    value: scale[0],
    slide: updateScale(0),
    min: -5,
    max: 5,
    step: 0.01,
    precision: 2,
  });
  webglLessonsUI.setupSlider("#scaleY", {
    value: scale[1],
    slide: updateScale(1),
    min: -5,
    max: 5,
    step: 0.01,
    precision: 2,
  });
  webglLessonsUI.setupSlider("#scaleZ", {
    value: scale[2],
    slide: updateScale(2),
    min: -5,
    max: 5,
    step: 0.01,
    precision: 2,
  });

  function updateFieldOfView(event, ui) {
    fieldOfViewRadians = degToRad(ui.value);
    drawScene();
  }

  function updatePosition(index) {
    return function (event, ui) {
      translation[index] = ui.value;
      drawScene();
    };
  }

  function updateRotation(index) {
    return function (event, ui) {
      var angleInDegrees = ui.value;
      var angleInRadians = degToRad(angleInDegrees);
      rotation[index] = angleInRadians;
      drawScene();
    };
  }

  function updateScale(index) {
    return function (event, ui) {
      scale[index] = ui.value;
      drawScene();
    };
  }

  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // turn on depth testing
    gl.enable(gl.DEPTH_TEST);

    // tell webgl to cull faces
    gl.enable(gl.CULL_FACE);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // Set the color.
    //gl.uniform4fv(colorLocation, color);

    // Compute the matrix
    const aspect =
      (gl.canvas as HTMLCanvasElement).clientWidth /
      (gl.canvas as HTMLCanvasElement).clientHeight;
    const zNear = 1;
    const zFar = 2000;
    let matrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
    matrix = m4.translate(
      matrix,
      translation[0],
      translation[1],
      translation[2]
    );
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

    // Set the matrix
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // Set the fudgeFactor
    //gl.uniform1f(fudgeLocation, fudgeFactor);

    // Draw the geometry
    const primitiveType = gl.TRIANGLES;
    const offset = 0;
    const count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}

const m4 = {
  orthographic: function (
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number
  ) {
    // prettier-ignore
    return [
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, 2 / (near - far), 0,
 
      (left + right) / (left - right),
      (bottom + top) / (bottom - top),
      (near + far) / (near - far),
      1,
    ];
  },

  perspective: function (
    fieldOfViewRadians: number,
    aspect: number,
    near: number,
    far: number
  ) {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewRadians);
    const rangeInv = 1.0 / (near - far);
    // prettier-ignore
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0,
    ];
  },

  projection: function (width: number, height: number, depth: number) {
    // Note: This matrix flips the Y axis so that 0 is at the top.
    // prettier-ignore
    return [
      2 / width, 0, 0, 0,
      0, -2 / height, 0, 0,
      0, 0, 2 / depth, 0,
     -1, 1, 0, 1,
   ];
  },

  translation: function (tx: number, ty: number, tz: number) {
    // prettier-ignore
    return [
      1,  0,  0,  0,
      0,  1,  0,  0,
      0,  0,  1,  0,
      tx, ty, tz, 1,
   ];
  },

  xRotation: function (angleInRadians: number) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    // prettier-ignore
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation: function (angleInRadians: number) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    // prettier-ignore
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation: function (angleInRadians: number) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    // prettier-ignore
    return [
      c, s, 0, 0,
     -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
   ];
  },

  scaling: function (sx: number, sy: number, sz: number) {
    // prettier-ignore
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },

  multiply: function (a: number[], b: number[]) {
    const a00 = a[0 * 4 + 0];
    const a01 = a[0 * 4 + 1];
    const a02 = a[0 * 4 + 2];
    const a03 = a[0 * 4 + 3];
    const a10 = a[1 * 4 + 0];
    const a11 = a[1 * 4 + 1];
    const a12 = a[1 * 4 + 2];
    const a13 = a[1 * 4 + 3];
    const a20 = a[2 * 4 + 0];
    const a21 = a[2 * 4 + 1];
    const a22 = a[2 * 4 + 2];
    const a23 = a[2 * 4 + 3];
    const a30 = a[3 * 4 + 0];
    const a31 = a[3 * 4 + 1];
    const a32 = a[3 * 4 + 2];
    const a33 = a[3 * 4 + 3];
    const b00 = b[0 * 4 + 0];
    const b01 = b[0 * 4 + 1];
    const b02 = b[0 * 4 + 2];
    const b03 = b[0 * 4 + 3];
    const b10 = b[1 * 4 + 0];
    const b11 = b[1 * 4 + 1];
    const b12 = b[1 * 4 + 2];
    const b13 = b[1 * 4 + 3];
    const b20 = b[2 * 4 + 0];
    const b21 = b[2 * 4 + 1];
    const b22 = b[2 * 4 + 2];
    const b23 = b[2 * 4 + 3];
    const b30 = b[3 * 4 + 0];
    const b31 = b[3 * 4 + 1];
    const b32 = b[3 * 4 + 2];
    const b33 = b[3 * 4 + 3];
    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
  },

  translate: function (m: number[], tx: number, ty: number, tz: number) {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },

  xRotate: function (m: number[], angleInRadians: number) {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },

  yRotate: function (m: number[], angleInRadians: number) {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },

  zRotate: function (m: number[], angleInRadians: number) {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },

  scale: function (m: number[], sx: number, sy: number, sz: number) {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },
};

function setGeometry(gl: WebGL2RenderingContext) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    // prettier-ignore
    new Float32Array([
      // left column front
      0,   0,  0,
      0, 150,  0,
      30,   0,  0,
      0, 150,  0,
      30, 150,  0,
      30,   0,  0,

      // top rung front
      30,   0,  0,
      30,  30,  0,
      100,   0,  0,
      30,  30,  0,
      100,  30,  0,
      100,   0,  0,

      // middle rung front
      30,  60,  0,
      30,  90,  0,
      67,  60,  0,
      30,  90,  0,
      67,  90,  0,
      67,  60,  0,

      // left column back
        0,   0,  30,
       30,   0,  30,
        0, 150,  30,
        0, 150,  30,
       30,   0,  30,
       30, 150,  30,

      // top rung back
       30,   0,  30,
      100,   0,  30,
       30,  30,  30,
       30,  30,  30,
      100,   0,  30,
      100,  30,  30,

      // middle rung back
       30,  60,  30,
       67,  60,  30,
       30,  90,  30,
       30,  90,  30,
       67,  60,  30,
       67,  90,  30,

      // top
        0,   0,   0,
      100,   0,   0,
      100,   0,  30,
        0,   0,   0,
      100,   0,  30,
        0,   0,  30,

      // top rung right
      100,   0,   0,
      100,  30,   0,
      100,  30,  30,
      100,   0,   0,
      100,  30,  30,
      100,   0,  30,

      // under top rung
      30,   30,   0,
      30,   30,  30,
      100,  30,  30,
      30,   30,   0,
      100,  30,  30,
      100,  30,   0,

      // between top rung and middle
      30,   30,   0,
      30,   60,  30,
      30,   30,  30,
      30,   30,   0,
      30,   60,   0,
      30,   60,  30,

      // top of middle rung
      30,   60,   0,
      67,   60,  30,
      30,   60,  30,
      30,   60,   0,
      67,   60,   0,
      67,   60,  30,

      // right of middle rung
      67,   60,   0,
      67,   90,  30,
      67,   60,  30,
      67,   60,   0,
      67,   90,   0,
      67,   90,  30,

      // bottom of middle rung.
      30,   90,   0,
      30,   90,  30,
      67,   90,  30,
      30,   90,   0,
      67,   90,  30,
      67,   90,   0,

      // right of bottom
      30,   90,   0,
      30,  150,  30,
      30,   90,  30,
      30,   90,   0,
      30,  150,   0,
      30,  150,  30,

      // bottom
      0,   150,   0,
      0,   150,  30,
      30,  150,  30,
      0,   150,   0,
      30,  150,  30,
      30,  150,   0,

      // left side
      0,   0,   0,
      0,   0,  30,
      0, 150,  30,
      0,   0,   0,
      0, 150,  30,
      0, 150,   0,
    ]),
    gl.STATIC_DRAW
  );
}

function setColors(gl: WebGL2RenderingContext) {
  // prettier-ignore
  gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array([
     // left column front
     200,  70, 120,
     200,  70, 120,
     200,  70, 120,
     200,  70, 120,
     200,  70, 120,
     200,  70, 120,

       // top rung front
     200,  70, 120,
     200,  70, 120,
     200,  70, 120,
     200,  70, 120,
     200,  70, 120,
     200,  70, 120,

       // middle rung front
     200,  70, 120,
     200,  70, 120,
     200,  70, 120,
     200,  70, 120,
     200,  70, 120,
     200,  70, 120,

       // left column back
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,

       // top rung back
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,

       // middle rung back
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,
     80, 70, 200,

       // top
     70, 200, 210,
     70, 200, 210,
     70, 200, 210,
     70, 200, 210,
     70, 200, 210,
     70, 200, 210,

       // top rung right
     200, 200, 70,
     200, 200, 70,
     200, 200, 70,
     200, 200, 70,
     200, 200, 70,
     200, 200, 70,

       // under top rung
     210, 100, 70,
     210, 100, 70,
     210, 100, 70,
     210, 100, 70,
     210, 100, 70,
     210, 100, 70,

       // between top rung and middle
     210, 160, 70,
     210, 160, 70,
     210, 160, 70,
     210, 160, 70,
     210, 160, 70,
     210, 160, 70,

       // top of middle rung
     70, 180, 210,
     70, 180, 210,
     70, 180, 210,
     70, 180, 210,
     70, 180, 210,
     70, 180, 210,

       // right of middle rung
     100, 70, 210,
     100, 70, 210,
     100, 70, 210,
     100, 70, 210,
     100, 70, 210,
     100, 70, 210,

       // bottom of middle rung.
     76, 210, 100,
     76, 210, 100,
     76, 210, 100,
     76, 210, 100,
     76, 210, 100,
     76, 210, 100,

       // right of bottom
     140, 210, 80,
     140, 210, 80,
     140, 210, 80,
     140, 210, 80,
     140, 210, 80,
     140, 210, 80,

       // bottom
     90, 130, 110,
     90, 130, 110,
     90, 130, 110,
     90, 130, 110,
     90, 130, 110,
     90, 130, 110,

       // left side
     160, 160, 220,
     160, 160, 220,
     160, 160, 220,
     160, 160, 220,
     160, 160, 220,
     160, 160, 220,
  ]), 
  gl.STATIC_DRAW);
}

main();
