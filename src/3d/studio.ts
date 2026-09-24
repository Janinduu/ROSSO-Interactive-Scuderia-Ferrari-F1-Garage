import { PMREMGenerator } from "three";
import type { Texture, WebGLRenderer } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// One procedural studio environment per renderer, used only for reflections on
// car paint, metal and helmets. No HDR download is needed.
const environments = new WeakMap<WebGLRenderer, Texture>();
export function studioEnvironment(gl: WebGLRenderer) {
  let env = environments.get(gl);
  if (!env) {
    const pmrem = new PMREMGenerator(gl);
    env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    environments.set(gl, env);
  }
  return env;
}
