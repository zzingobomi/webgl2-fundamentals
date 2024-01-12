#version 300 es

// an attribute is an input (in) to a vertex shader. It will receive data from a buffer
in vec4 a_position;
in vec4 a_color;

// A matrix to transform the positions by
uniform mat4 u_matrix;

out vec4 v_color;

void main() {
  gl_Position = u_matrix * a_position;

  v_color = a_color;
}
