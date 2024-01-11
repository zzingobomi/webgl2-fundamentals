import * as webglUtils from "./webgl-utils";
import * as webglLessonsUI from "./webgl-lessons-ui";
import vertexShaderSource from "./glsl/02/vertexShader.glsl";
import fragmentShaderSource from "./glsl/02/fragmentShader.glsl";

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

  // look up uniform locations
  const colorLocation = gl.getUniformLocation(program, "u_color");
  const matrixLocation = gl.getUniformLocation(program, "u_matrix");

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
  const size = 2; // 2 components per iteration
  const type = gl.FLOAT; // the data is 32bit floats
  const normalize = false; // don't normalize the data
  const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  const pointerOffset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    pointerOffset
  );

  // First let's make some variables
  // to hold the translation,
  const translation = [150, 100];
  let rotationInRadians = 0;
  const scale = [1, 1];
  const color = [Math.random(), Math.random(), Math.random(), 1];

  drawScene();

  // Setup a ui.
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
  webglLessonsUI.setupSlider("#angle", {
    value: ((rotationInRadians * 180) / Math.PI) | 0,
    slide: updateAngle,
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

  function updatePosition(index: number) {
    return function (event: any, ui: any) {
      translation[index] = ui.value;
      drawScene();
    };
  }

  function updateAngle(event, ui) {
    var angleInDegrees = 360 - ui.value;
    rotationInRadians = (angleInDegrees * Math.PI) / 180;
    drawScene();
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

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // Set the color.
    gl.uniform4fv(colorLocation, color);

    // Compute the matrix
    let matrix = m3.projection(
      (gl.canvas as HTMLCanvasElement).clientWidth,
      (gl.canvas as HTMLCanvasElement).clientHeight
    );
    matrix = m3.translate(matrix, translation[0], translation[1]);
    matrix = m3.rotate(matrix, rotationInRadians);
    matrix = m3.scale(matrix, scale[0], scale[1]);

    // Set the matrix
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    // Draw the geometry
    const primitiveType = gl.TRIANGLES;
    const offset = 0;
    const count = 18;
    gl.drawArrays(primitiveType, offset, count);
  }
}

const m3 = {
  projection: function projection(width: number, height: number) {
    // Note: This matrix flips the Y axis so that 0 is at the top.
    // prettier-ignore
    return [
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1,
    ];
  },

  translation: function translation(tx: number, ty: number) {
    // prettier-ignore
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1,
    ];
  },

  rotation: function rotation(angleInRadians: number) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    // prettier-ignore
    return [
      c, -s, 0,
      s, c, 0,
      0, 0, 1,
    ];
  },

  scaling: function scaling(sx: number, sy: number) {
    // prettier-ignore
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1,
    ];
  },

  multiply: function multiply(a: number[], b: number[]) {
    const a00 = a[0 * 3 + 0];
    const a01 = a[0 * 3 + 1];
    const a02 = a[0 * 3 + 2];
    const a10 = a[1 * 3 + 0];
    const a11 = a[1 * 3 + 1];
    const a12 = a[1 * 3 + 2];
    const a20 = a[2 * 3 + 0];
    const a21 = a[2 * 3 + 1];
    const a22 = a[2 * 3 + 2];
    const b00 = b[0 * 3 + 0];
    const b01 = b[0 * 3 + 1];
    const b02 = b[0 * 3 + 2];
    const b10 = b[1 * 3 + 0];
    const b11 = b[1 * 3 + 1];
    const b12 = b[1 * 3 + 2];
    const b20 = b[2 * 3 + 0];
    const b21 = b[2 * 3 + 1];
    const b22 = b[2 * 3 + 2];
    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },

  translate: function (m: number[], tx: number, ty: number) {
    return m3.multiply(m, m3.translation(tx, ty));
  },

  rotate: function (m: number[], angleInRadians: number) {
    return m3.multiply(m, m3.rotation(angleInRadians));
  },

  scale: function (m: number[], sx: number, sy: number) {
    return m3.multiply(m, m3.scaling(sx, sy));
  },
};

function setGeometry(gl: WebGL2RenderingContext) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    // prettier-ignore
    new Float32Array([
      // left column
      0, 0, 
      30, 0, 
      0, 150, 
      0, 150, 
      30, 0, 
      30, 150,

      // top rung
      30, 0,
      100, 0,
      30, 30,
      30, 30,
      100, 0,
      100, 30,

      // middle rung
      30, 60,
      67, 60,
      30, 90,
      30, 90,
      67, 60,
      67, 90,
    ]),
    gl.STATIC_DRAW
  );
}

main();
