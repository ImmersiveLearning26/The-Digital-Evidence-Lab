import {cpSync,mkdirSync} from 'node:fs';
mkdirSync('vendor/three/build',{recursive:true});
for(const f of ['build/three.module.js','build/three.core.js','LICENSE'])cpSync(`node_modules/three/${f}`,`vendor/three/${f}`);
for(const d of ['loaders','utils','environments','exporters','lines','postprocessing','shaders','math'])cpSync(`node_modules/three/examples/jsm/${d}`,`vendor/three/examples/jsm/${d}`,{recursive:true});
console.log('Three.js copied to vendor/three.');
