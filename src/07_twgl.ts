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

  const uniformsThatAreComputedForEachObjects = {
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

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time: number) {
    time = 5 + time * 0.0001;

    twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

    requestAnimationFrame(drawScene);
  }
}

main();
