#version 300 es

// an attribute is an input (in) to a vertex shader. It will receive data from a buffer
in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;

// varying to pass the normal to the fragment shader
out vec3 v_normal;

void main() {  
  gl_Position = u_worldViewProjection * a_position;

  // orient the normals and pass to the fragment shader
  v_normal = mat3(u_worldInverseTranspose) * a_normal;
}
