import * as webglUtils from "./webgl-utils";
import * as twgl from "@src/twgl";
import vertexShaderSource from "./glsl/08/vertexShader.glsl";
import fragmentShaderSource from "./glsl/08/fragmentShader.glsl";

function parseOBJ(text: string) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [objPositions, objTexcoords, objNormals];

  // same order as `f` indices
  let webglVertexData: [number[], number[], number[]] = [
    [], // positions
    [], // texcoords
    [], // normals
  ];

  const materialLibs = [];
  const geometries = [];
  let geometry;
  let groups = ["default"];
  let material = "default";
  let object = "default";

  const noop = () => {};

  function newGeometry() {
    // If there is an existing geometry and it's
    // not empty then start a new one.
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
  }

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [position, texcoord, normal];
      geometry = {
        object,
        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  function addVertex(vert: string) {
    const ptn = vert.split("/");
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v: function (parts: string[]) {
      objPositions.push(parts.map(parseFloat));
    },
    vn: function (parts: string[]) {
      objNormals.push(parts.map(parseFloat));
    },
    vt: function (parts: string[]) {
      objTexcoords.push(parts.map(parseFloat));
    },
    f: function (parts: string[]) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    s: noop,
    mtllib: function (parts: string[], unparsedArgs: string) {
      // the spec says there can be multiple filenames here
      // but many exist with spaces in a single filename
      materialLibs.push(unparsedArgs);
    },
    usemtl: function (parts: string[], unparsedArgs: string) {
      material = unparsedArgs;
      newGeometry();
    },
    g: function (parts: string[]) {
      groups = parts;
      newGeometry();
    },
    o: function (parts: string[], unparsedArgs: string) {
      object = unparsedArgs;
      newGeometry();
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split("\n");
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn(`unhandled keyword: ${keyword}`);
      continue;
    }
    handler(parts, unparsedArgs);
  }

  // remove any arrays that have no entries.
  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(
      Object.entries(geometry.data).filter(
        ([, array]) => (array as any).length > 0
      )
    );
  }

  return {
    geometries,
    materialLibs,
  };
}

async function main() {
  const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  // Tell the twgl to match position with a_position etc..
  twgl.setDefaults({ attribPrefix: "a_" });

  // compiles and links the shaders, looks up attribute and uniform locations
  const meshProgramInfo = twgl.createProgramInfo(gl, [
    vertexShaderSource,
    fragmentShaderSource,
  ]);

  const response = await fetch("/chair.obj");
  const text = await response.text();
  const obj = parseOBJ(text);

  const parts = obj.geometries.map(({ data }) => {
    // Because data is just named arrays like this
    //
    // {
    //   position: [...],
    //   texcoord: [...],
    //   normal: [...],
    // }
    //
    // and because those names match the attributes in our vertex
    // shader we can pass it directly into `createBufferInfoFromArrays`
    // from the article "less code more fun".

    // create a buffer for each array by calling
    // gl.createBuffer, gl.bindBuffer, gl.bufferData
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
    // fills out a vertex array by calling gl.createVertexArray, gl.bindVertexArray
    // then gl.bindBuffer, gl.enableVertexAttribArray, and gl.vertexAttribPointer for each attribute
    const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);
    return {
      material: {
        u_diffuse: [Math.random(), Math.random(), Math.random(), 1],
      },
      bufferInfo,
      vao,
    };
  });

  function getExtents(positions: number[]) {
    const min = positions.slice(0, 3);
    const max = positions.slice(0, 3);
    for (let i = 3; i < positions.length; i += 3) {
      for (let j = 0; j < 3; ++j) {
        const v = positions[i + j];
        min[j] = Math.min(v, min[j]);
        max[j] = Math.max(v, max[j]);
      }
    }
    return { min, max };
  }

  function getGeometriesExtents(geometries) {
    return geometries.reduce(
      ({ min, max }, { data }) => {
        const minMax = getExtents(data.position);
        return {
          min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
          max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
        };
      },
      {
        min: Array(3).fill(Number.POSITIVE_INFINITY),
        max: Array(3).fill(Number.NEGATIVE_INFINITY),
      }
    );
  }

  const extents = getGeometriesExtents(obj.geometries);
  const range = twgl.v3.subtract(extents.max, extents.min);
  // amount to move the object so its center is at the origin
  const objOffset = twgl.v3.mulScalar(
    twgl.v3.add(extents.min, twgl.v3.mulScalar(range, 0.5)),
    -1
  );

  const cameraTarget = [0, 0, 0];
  // figure out how far away to move the camera so we can likely
  // see the object.
  const radius = twgl.v3.length(range) * 1.2;
  const cameraPosition = twgl.v3.add(cameraTarget, [0, 0, radius]);
  // Set zNear and zFar to something hopefully appropriate
  // for the size of this object.
  const zNear = radius / 100;
  const zFar = radius * 3;

  function degToRad(deg: number) {
    return (deg * Math.PI) / 180;
  }

  function render(time: number) {
    time *= 0.001; // convert to seconds

    twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
    gl.viewport(
      0,
      0,
      (gl.canvas as HTMLCanvasElement).width,
      (gl.canvas as HTMLCanvasElement).height
    );
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const fieldOfViewRadians = degToRad(60);
    const aspect =
      (gl.canvas as HTMLCanvasElement).clientWidth /
      (gl.canvas as HTMLCanvasElement).clientHeight;
    const projection = twgl.m4.perspective(
      fieldOfViewRadians,
      aspect,
      zNear,
      zFar
    );

    const up = [0, 1, 0];
    const camera = twgl.m4.lookAt(cameraPosition, cameraTarget, up);
    const view = twgl.m4.inverse(camera);

    const sharedUniforms = {
      u_lightDirection: twgl.v3.normalize([-1, 3, 5]),
      u_view: view,
      u_projection: projection,
    };

    gl.useProgram(meshProgramInfo.program);

    twgl.setUniforms(meshProgramInfo, sharedUniforms);

    // compute the world matrix once since all parts
    // are at the same space.
    let u_world = twgl.m4.rotationY(time);
    u_world = twgl.m4.translate(u_world, objOffset);

    for (const { bufferInfo, vao, material } of parts) {
      gl.bindVertexArray(vao);
      twgl.setUniforms(meshProgramInfo, {
        u_world,
        u_diffuse: material.u_diffuse,
      });
      twgl.drawBufferInfo(gl, bufferInfo);
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
