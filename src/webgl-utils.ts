const errorRE = /ERROR:\s*\d+:(\d+)/gi;

function addLineNumbersWithError(src: string, log = "") {
  // Note: Error message formats are not defined by any spec so this may or may not work.
  const matches = [...log.matchAll(errorRE)];
  const lineNoToErrorMap = new Map(
    matches.map((m, ndx) => {
      const lineNo = parseInt(m[1]);
      const next = matches[ndx + 1];
      const end = next ? next.index : log.length;
      const msg = log.substring(m.index, end);
      return [lineNo - 1, msg];
    })
  );

  return src
    .split("\n")
    .map((line, lineNo) => {
      const err = lineNoToErrorMap.get(lineNo);
      return `${lineNo + 1}: ${line}${err ? `\n\n^^^ ${err}` : ""}`;
    })
    .join("\n");
}

/**
 * Loads a shader.
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {string} shaderSource The shader source.
 * @param {number} shaderType The type of shader.
 * @return {WebGLShader} The created shader.
 */
export function loadShader(
  gl: WebGLRenderingContext,
  shaderSource: string,
  shaderType: number
): WebGLShader {
  // Create the shader object
  const shader = gl.createShader(shaderType);

  // Load the shader source
  gl.shaderSource(shader, shaderSource);

  // Compile the shader
  gl.compileShader(shader);

  // Check the compile status
  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    // Something went wrong during compilation; get the error
    const lastError = gl.getShaderInfoLog(shader);
    console.error(
      `Error compiling shader: ${lastError}\n${addLineNumbersWithError(
        shaderSource,
        lastError
      )}`
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
 * Creates a program, attaches shaders, binds attrib locations, links the
 * program and calls useProgram.
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {WebGLShader[]} shaders The shaders to attach
 * @param {string[]} [opt_attribs] An array of attribs names. Locations will be assigned by index if not passed in
 * @param {number[]} [opt_locations] The locations for the. A parallel array to opt_attribs letting you assign locations.
 */
export function createProgram(
  gl: WebGLRenderingContext,
  shaders: WebGLShader[],
  opt_attribs?: string[],
  opt_locations?: number[]
): WebGLProgram {
  const program = gl.createProgram();
  shaders.forEach(function (shader) {
    gl.attachShader(program, shader);
  });
  if (opt_attribs) {
    opt_attribs.forEach(function (attrib, ndx) {
      gl.bindAttribLocation(
        program,
        opt_locations ? opt_locations[ndx] : ndx,
        attrib
      );
    });
  }
  gl.linkProgram(program);

  // Check the link status
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    // something went wrong with the link
    const lastError = gl.getProgramInfoLog(program);
    console.error(`faild to create program ${lastError}`);
    // TODO: create webgl-debug-helper
    // console.error(`Error in program linking: ${lastError}\n${
    //   shaders.map(shader => {
    //     const src = addLineNumbersWithError(gl.getShaderSource(shader));
    //     const type = gl.getShaderParameter(shader, gl.SHADER_TYPE);
    //     return `${glEnumToString(gl, type)}:\n${src}`;
    //   }).join('\n')
    // }`);

    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/**
 * Loads a shader from a script tag.
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {string} scriptId The id of the script tag.
 * @param {number} opt_shaderType The type of shader. If not passed in it will
 *                                be derived from the type of the script tag.
 * @return {WebGLShader} The created shader.
 */
export function createShaderFromScript(
  gl: WebGLRenderingContext,
  scriptId: string,
  opt_shaderType?: number
): WebGLShader {
  let shaderSource = "";
  let shaderType;
  const shaderScript = document.getElementById(scriptId) as HTMLScriptElement;
  if (!shaderScript) {
    throw "*** Error: unknown script element" + scriptId;
  }
  shaderSource = shaderScript.text;

  if (!opt_shaderType) {
    if (shaderScript.type === "x-shader/x-vertex") {
      shaderType = gl.VERTEX_SHADER;
    } else if (shaderScript.type === "x-shader/x-fragment") {
      shaderType = gl.FRAGMENT_SHADER;
    } else if (
      shaderType !== gl.VERTEX_SHADER &&
      shaderType !== gl.FRAGMENT_SHADER
    ) {
      throw "*** Error: unknown shader type";
    }
  }

  return loadShader(
    gl,
    shaderSource,
    opt_shaderType ? opt_shaderType : shaderType
  );
}

const defaultShaderType = ["VERTEX_SHADER", "FRAGMENT_SHADER"];

/**
 * Creates a program from 2 script tags.
 *
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext
 *        to use.
 * @param {string[]} shaderScriptIds Array of ids of the script
 *        tags for the shaders. The first is assumed to be the
 *        vertex shader, the second the fragment shader.
 * @param {string[]} [opt_attribs] An array of attribs names. Locations will be assigned by index if not passed in
 * @param {number[]} [opt_locations] The locations for the. A parallel array to opt_attribs letting you assign locations.
 * @return {WebGLProgram} The created program.
 */
export function createProgramFromScripts(
  gl: WebGLRenderingContext,
  shaderScriptIds: string[],
  opt_attribs?: string[],
  opt_locations?: number[]
): WebGLProgram {
  const shaders = [];
  for (let ii = 0; ii < shaderScriptIds.length; ++ii) {
    shaders.push(
      createShaderFromScript(gl, shaderScriptIds[ii], gl[defaultShaderType[ii]])
    );
  }
  return createProgram(gl, shaders, opt_attribs, opt_locations);
}

/**
 * Creates a program from 2 sources.
 *
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext
 *        to use.
 * @param {string[]} shaderSourcess Array of sources for the
 *        shaders. The first is assumed to be the vertex shader,
 *        the second the fragment shader.
 * @param {string[]} [opt_attribs] An array of attribs names. Locations will be assigned by index if not passed in
 * @param {number[]} [opt_locations] The locations for the. A parallel array to opt_attribs letting you assign locations.
 * @return {WebGLProgram} The created program.
 */
export function createProgramFromSources(
  gl: WebGLRenderingContext,
  shaderSources: string[],
  opt_attribs?: string[],
  opt_locations?: number[]
): WebGLProgram {
  const shaders = [];
  for (let ii = 0; ii < shaderSources.length; ++ii) {
    shaders.push(loadShader(gl, shaderSources[ii], gl[defaultShaderType[ii]]));
  }
  return createProgram(gl, shaders, opt_attribs, opt_locations);
}

/**
 * Resize a canvas to match the size its displayed.
 * @param canvas The canvas to resize.
 * @param multiplier amount to multiply by.
 *    Pass in window.devicePixelRatio for native pixels.
 * @return {boolean} true if the canvas was resized.
 */
export function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement,
  multiplier: number = 1
): boolean {
  const width = (canvas.clientWidth * multiplier) | 0;
  const height = (canvas.clientHeight * multiplier) | 0;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}
