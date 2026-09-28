// Shared default pose data for optional editable Blender meshes.
import fs from 'node:fs';import {DEFAULT_FIT,pose} from '../web/src/fit.mjs';
fs.writeFileSync(new URL('../blender/data/rider_pose.json',import.meta.url),JSON.stringify({fit:DEFAULT_FIT,pose:pose(DEFAULT_FIT,-12*Math.PI/180),limits:'Illustrative kinematic mannequin, estimated leg proportions; no anatomical scan or validated aero optimum.'},null,2));
