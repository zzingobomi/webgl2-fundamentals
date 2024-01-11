#version 300 es

// an attribute is an input (in) to a vertex shader. It will receive data from a buffer
in vec2 a_position;

// A matrix to transform the positions by
uniform mat3 u_matrix;

void main() {
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}
