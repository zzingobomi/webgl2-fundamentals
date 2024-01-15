import * as webglUtils from "./webgl-utils";
import * as webglLessonsUI from "./webgl-lessons-ui";
import * as textureUtils from "./webgl-texture-util";
import * as twgl from "@src/twgl";
import vertexShaderSource from "./glsl/07/vertexShader.glsl";
import fragmentShaderSource from "./glsl/07/fragmentShader.glsl";
import * as chroma from "chroma.ts";

function main() {
  const canvas = document.querySelector("#c") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  const buffers = twgl.primitives.createSphereBuffers(gl, 10, 48, 24);

  // setup GLSL program
  const program = twgl.createProgramFromSources(gl, [
    vertexShaderSource,
    fragmentShaderSource,
  ]);
  const uniformSetters = twgl.createUniformSetters(gl, program);
  const attribSetters = twgl.createAttributeSetters(gl, program);

  const attribs = {
    a_position: { buffer: buffers.position, numComponents: 3 },
    a_normal: { buffer: buffers.normal, numComponents: 3 },
    a_texcoord: { buffer: buffers.texcoord, numComponents: 2 },
  };
  const vao = twgl.createVAOAndSetAttributes(
    gl,
    attribSetters,
    attribs,
    buffers.indices
  );

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  const fieldOfViewRadians = degToRad(60);

  const uniformsThatAreTheSameForAllObjects = {
    u_lightWorldPos: [-50, 30, 100],
    u_viewInverse: twgl.m4.identity(),
    u_lightColor: [1, 1, 1, 1],
  };

  const uniformsThatAreComputedForEachObject = {
    u_worldViewProjection: twgl.m4.identity(),
    u_world: twgl.m4.identity(),
    u_worldInverseTranspose: twgl.m4.identity(),
  };

  const rand = function (min, max?) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max - min);
  };

  const randInt = function (range) {
    return Math.floor(Math.random() * range);
  };

  const textures = [
    textureUtils.makeStripeTexture(gl, { color1: "#FFF", color2: "#CCC" }),
    textureUtils.makeCheckerTexture(gl, { color1: "#FFF", color2: "#CCC" }),
    textureUtils.makeCircleTexture(gl, { color1: "#FFF", color2: "#CCC" }),
  ];

  const objects = [];
  const numObjects = 300;
  const baseColor = rand(240);
  for (let ii = 0; ii < numObjects; ++ii) {
    objects.push({
      radius: rand(150),
      xRotation: rand(Math.PI * 2),
      yRotation: rand(Math.PI),
      materialUniforms: {
        u_colorMult: chroma.hsv(rand(baseColor, baseColor + 120), 0.5, 1).gl(),
        u_diffuse: textures[randInt(textures.length)],
        u_specular: [1, 1, 1, 1],
        u_shininess: rand(500),
        u_specularFactor: rand(1),
      },
    });
  }

  //requestAnimationFrame(drawScene);

  // TODO: Draw the scene.
  // function drawScene(time) {
  //   time = 5 + time * 0.0001;

  //   twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

  //   // Tell WebGL how to convert from clip space to pixels
  //   gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  //   gl.enable(gl.CULL_FACE);
  //   gl.enable(gl.DEPTH_TEST);

  //   // Compute the projection matrix
  //   var aspect =
  //     (gl.canvas as HTMLCanvasElement).clientWidth /
  //     (gl.canvas as HTMLCanvasElement).clientHeight;
  //   var projectionMatrix = twgl.m4.perspective(
  //     fieldOfViewRadians,
  //     aspect,
  //     1,
  //     2000
  //   );

  //   // Compute the camera's matrix using look at.
  //   var cameraPosition = [0, 0, 100];
  //   var target = [0, 0, 0];
  //   var up = [0, 1, 0];
  //   var cameraMatrix = twgl.m4.lookAt(
  //     cameraPosition,
  //     target,
  //     up,
  //     uniformsThatAreTheSameForAllObjects.u_viewInverse
  //   );

  //   // Make a view matrix from the camera matrix.
  //   var viewMatrix = twgl.m4.inverse(cameraMatrix);

  //   var viewProjectionMatrix = twgl.m4.multiply(projectionMatrix, viewMatrix);

  //   gl.useProgram(program);

  //   // Setup all the needed attributes.
  //   gl.bindVertexArray(vao);

  //   // Set the uniforms that are the same for all objects.
  //   twgl.setUniforms(uniformSetters, uniformsThatAreTheSameForAllObjects);

  //   // Draw objects
  //   objects.forEach(function (object) {
  //     // Compute a position for this object based on the time.
  //     var worldMatrix = twgl.m4.identity();
  //     worldMatrix = twgl.m4.rotateY(worldMatrix, object.yRotation * time);
  //     worldMatrix = twgl.m4.rotateX(worldMatrix, object.xRotation * time);
  //     worldMatrix = twgl.m4.translate(
  //       worldMatrix,
  //       0,
  //       0,
  //       object.radius,
  //       uniformsThatAreComputedForEachObject.u_world
  //     );

  //     // Multiply the matrices.
  //     twgl.m4.multiply(
  //       viewProjectionMatrix,
  //       worldMatrix,
  //       uniformsThatAreComputedForEachObject.u_worldViewProjection
  //     );
  //     twgl.m4.transpose(
  //       twgl.m4.inverse(worldMatrix),
  //       uniformsThatAreComputedForEachObject.u_worldInverseTranspose
  //     );

  //     // Set the uniforms we just computed
  //     twgl.setUniforms(uniformSetters, uniformsThatAreComputedForEachObject);

  //     // Set the uniforms that are specific to the this object.
  //     twgl.setUniforms(uniformSetters, object.materialUniforms);

  //     // Draw the geometry.
  //     gl.drawElements(gl.TRIANGLES, buffers.numElements, gl.UNSIGNED_SHORT, 0);
  //   });

  //   requestAnimationFrame(drawScene);
  // }
}

main();
