import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import type { Side, TroopId } from '../engine';
import digits from './digits.json';
import { B, F, M, add, box, coil, collectTicks, face, glow, grin, grp, pyramid, setBuildSide, smile, stud, teamMat, tick, windKey, type Tick } from './kit';

const FONT = new FontLoader().parse(digits as never);

const BUILD: Record<TroopId, (g: THREE.Group) => void> = {
  pip(g: THREE.Group) {
    B(g, [.9, .92, .82], M.black, [0, F + .52, 0], .3);
    B(g, [.66, .7, .1], M.white, [0, F + .5, .38], .08);
    B(g, [.86, .64, .78], M.black, [0, F + 1.22, 0], .28);
    B(g, [.66, .44, .1], M.white, [0, F + 1.18, .36], .12);
    face(g, { x: .15, y: F + 1.25, z: .42, s: .15, mood: 'happy' });
    B(g, [.26, .1, .2], M.orange, [0, F + 1.08, .48], .04);
    B(g, [.2, .06, .15], M.orangeDark, [0, F + 1.01, .45], .03);
    [[-.06, .4, .14], [0, 0, .2], [.06, -.4, .14]].forEach(([x, rz, h]) => B(g, [.06, h, .06], M.black, [x, F + 1.5 + h / 2, .04], .025, [0, 0, rz]));
    for (const sx of [-1, 1]) {
      B(g, [.09, .05, .02], M.pink, [sx * .25, F + 1.1, .42], .02);
      const fl = grp(g, [sx * .45, F + .84, 0]);
      B(fl, [.14, .5, .32], M.black, [0, -.23, 0], .07);
      tick(t => { fl.rotation.z = sx * (.3 + Math.sin(t * 3 + (sx > 0 ? 0 : Math.PI)) * .12); });
      B(g, [.28, .08, .36], M.orange, [sx * .2, F + .04, .14], .04);
      for (const tx of [-.08, 0, .08]) B(g, [.07, .06, .1], M.orange, [sx * .2 + tx, F + .03, .34], .025);
    }
    B(g, [.94, .13, .84], teamMat(), [0, F + .94, 0], .06);
    B(g, [.16, .14, .08], teamMat('dark'), [.22, F + .92, .42], .04);
    B(g, [.13, .3, .06], teamMat(), [.2, F + .75, .45], .03, [0, 0, .15]);
    B(g, [.13, .28, .06], teamMat(), [.31, F + .77, .43], .03, [0, 0, .5]);
    B(g, [.135, .05, .065], M.white, [.18, F + .65, .45], .02, [0, 0, .15]);
    windKey(g, [0, F + .6, -.42]);
  },
  mira(g: THREE.Group) {
    const doll = (bodyMat: THREE.Material, accent: THREE.Material, scale: number, pos: [number, number, number], rotY: number) => {
      const d = grp(g, pos, [0, rotY, 0]); d.scale.setScalar(scale);
      B(d, [.82, .72, .72], bodyMat, [0, .38, 0], .3);
      B(d, [.84, .05, .74], M.gold, [0, .73, 0], .025);
      B(d, [.74, .64, .68], bodyMat, [0, 1.08, 0], .3);
      B(d, [.52, .44, .1], M.skin, [0, 1.04, .32], .14);
      for (const sx of [-1, 1]) {
        B(d, [.08, .05, .02], M.pink, [sx * .17, .97, .375], .02);
        B(d, [.05, .04, .02], M.red, [sx * .022, .912, .375], .015, [0, 0, sx * .45]);
        B(d, [.02, .3, .22], M.gold, [sx * .415, .4, 0], .01);
        B(d, [.08, .04, .02], M.leaf, [sx * .1, .3, .395], .015, [0, 0, -sx * .5]);
      }
      B(d, [.06, .03, .02], M.red, [0, .895, .375], .012);
      B(d, [.5, .09, .1], M.hair, [0, 1.23, .325], .04);
      face(d, { x: .1, y: 1.07, z: .38, s: .1, mood: null });
      B(d, [.16, .08, .06], accent, [0, .79, .37], .03);
      B(d, [.52, .5, .08], M.cream, [0, .4, .35], .1);
      B(d, [.1, .1, .03], M.red, [0, .43, .4], .03);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        B(d, [.08, .08, .025], M.yellow, [Math.cos(a) * .1, .43 + Math.sin(a) * .1, .385], .025, [0, 0, Math.PI / 4]);
      }
      return d;
    };
    doll(teamMat(), M.yellow, 1, [0, F, 0], -.15);
    const a = doll(M.yellow, teamMat('dark'), .4, [.56, F, .4], -.5);
    const b = doll(M.mint, teamMat(), .32, [-.56, F, .42], .45);
    tick(t => {
      a.position.y = F + Math.abs(Math.sin(t * 3)) * .06;
      b.position.y = F + Math.abs(Math.sin(t * 3 + 1.5)) * .06;
    });
  },
  boing(g: THREE.Group) {
    B(g, [.82, .62, .82], M.boxWood, [0, F + .31, 0], .08);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, [.08, .64, .08], M.boxWoodDark, [sx * .39, F + .31, sz * .39], .03);
    B(g, [.6, .46, .03], teamMat(), [0, F + .31, .41], .02);
    for (const sx of [-1, 1]) B(g, [.03, .46, .6], teamMat(), [sx * .41, F + .31, 0], .02);
    B(g, [.17, .17, .02], M.gold, [0, F + .31, .43], .02, [0, 0, Math.PI / 4]);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) B(g, [.05, .05, .03], M.gold, [sx * .25, F + .31 + sy * .17, .43], .015);
    const lid = grp(g, [0, F + .62, -.41], [-2.0, 0, 0]);
    B(lid, [.84, .06, .84], M.boxWood, [0, 0, .42], .03);
    B(lid, [.6, .012, .6], teamMat('dark'), [0, -.035, .42], .006);
    B(g, [.3, .05, .05], M.gold, [0, F + .62, -.41], .02);
    const spring = add(g, coil(.13, .32, 5, .03), M.steel, [0, F + .62, 0]);
    const hg = grp(g, [0, F + .94, 0]);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      B(hg, [.2, .1, .13], i % 2 ? M.white : teamMat(), [Math.cos(a) * .26, .02, Math.sin(a) * .26], .04, [0, -a, 0]);
    }
    B(hg, [.62, .54, .56], M.skin, [0, .32, 0], .2);
    for (const sx of [-1, 1]) {
      for (const [dx, dy, dz] of [[.36, .36, -.05], [.41, .24, -.02], [.32, .48, -.1]]) B(hg, [.14, .14, .16], M.orange, [sx * dx, dy, dz], .06);
      B(hg, [.09, .05, .02], M.pink, [sx * .2, .2, .285], .02);
      B(hg, [.1, .26, .1], teamMat(), [sx * .36, -.06, .12], .04, [0, 0, -sx * .7]);
      B(hg, [.19, .05, .19], teamMat('dark'), [sx * .45, 0, .14], .02);
      B(hg, [.17, .17, .17], M.white, [sx * .48, .08, .14], .06);
    }
    B(hg, [.14, .14, .12], M.red, [0, .28, .3], .06);
    B(hg, [.04, .04, .01], M.white, [-.03, .32, .365], .01);
    grin(hg, .13, .285, .3, .1);
    face(hg, { x: .13, y: .42, z: .29, s: .12, mood: 'happy' });
    add(hg, pyramid(.3, .42), teamMat(), [0, .8, 0], [0, Math.PI / 4, 0]);
    B(hg, [.44, .05, .44], M.white, [0, .6, 0], .02);
    B(hg, [.11, .11, .11], M.white, [0, 1.03, 0], .045);
    B(g, [.2, .05, .05], M.steel, [.5, F + .31, 0], .02);
    const crank = grp(g, [.6, F + .31, 0]);
    B(crank, [.05, .22, .05], M.steel, [0, -.09, 0], .02);
    B(crank, [.08, .08, .08], M.red, [0, -.2, 0], .03);
    tick(t => {
      const s = 1 + Math.sin(t * 4) * .09;
      spring.scale.y = s;
      hg.position.y = F + .62 + .32 * s;
      hg.rotation.z = Math.sin(t * 2) * .06;
      crank.rotation.x = t * 2.5;
    });
  },
  brix(g: THREE.Group) {
    for (const sx of [-1, 1]) {
      B(g, [.22, .3, .26], M.steel, [sx * .17, F + .17, 0], .06);
      B(g, [.18, .08, .06], teamMat(), [sx * .17, F + .24, .14], .03);
      B(g, [.27, .12, .34], M.gun, [sx * .17, F + .06, .03], .04);
      B(g, [.28, .16, .34], teamMat(), [sx * .44, F + .88, 0], .06);
      B(g, [.29, .03, .35], M.gold, [sx * .44, F + .8, 0], .015);
      for (const dz of [-.08, .08]) add(g, stud(.045, .05), teamMat(), [sx * .44, F + .985, dz]);
      B(g, [.17, .07, .05], M.hair, [sx * .08, F + 1.04, .27], .03, [0, 0, -sx * .25]);
      B(g, [.06, .06, .05], M.hair, [sx * .18, F + 1.075, .27], .025);
      for (const dz of [-.12, .12]) add(g, stud(.055, .05), M.steel, [sx * .13, F + 1.595, dz]);
    }
    B(g, [.74, .62, .54], M.steel, [0, F + .64, 0], .15);
    B(g, [.44, .54, .06], teamMat(), [0, F + .6, .27], .03);
    B(g, [.445, .04, .065], M.gold, [0, F + .35, .27], .015);
    B(g, [.14, .18, .02], M.gold, [0, F + .66, .31], .04);
    B(g, [.06, .06, .012], teamMat('dark'), [0, F + .67, .322], .01, [0, 0, Math.PI / 4]);
    B(g, [.76, .08, .56], M.wood, [0, F + .37, 0], .03);
    B(g, [.1, .08, .02], M.gold, [0, F + .37, .29], .015);
    const cape = grp(g, [0, F + .92, -.27]);
    B(cape, [.62, .72, .05], teamMat('dark'), [0, -.36, 0], .025);
    tick(t => { cape.rotation.x = .12 + Math.sin(t * 2.5) * .05; });
    B(g, [.56, .44, .52], M.skin, [0, F + 1.16, 0], .15);
    B(g, [.64, .3, .6], M.steel, [0, F + 1.42, 0], .12);
    B(g, [.66, .06, .62], teamMat('dark'), [0, F + 1.28, 0], .03);
    B(g, [.06, .16, .04], M.steel, [0, F + 1.2, .29], .02);
    [[1.65, .04], [1.75, -.08], [1.79, -.22]].forEach(([y, z], i) => B(g, [.1, .14, .2], teamMat(), [0, F + y, z], .05, [-.3 * i, 0, 0]));
    face(g, { x: .13, y: F + 1.18, z: .27, s: .11, mood: 'brave' });
    B(g, [.16, .34, .16], M.steel, [.47, F + .64, 0], .06);
    B(g, [.2, .1, .2], M.gun, [.48, F + .5, .03], .04);
    B(g, [.18, .16, .18], M.gun, [.5, F + .42, .06], .06);
    const mg = grp(g, [.5, F + .44, .1]);
    B(mg, [.07, .85, .07], M.wood, [0, .3, 0], .03);
    B(mg, [.085, .16, .085], teamMat(), [0, 0, 0], .03);
    const mh = grp(mg, [0, .74, 0]);
    B(mh, [.42, .26, .26], M.wood, [0, 0, 0], .07);
    for (const sx of [-1, 1]) B(mh, [.05, .28, .28], M.steel, [sx * .15, 0, 0], .02);
    tick(t => { mg.rotation.z = -.25 + Math.sin(t * 2.2) * .12; });
    B(g, [.16, .3, .16], M.steel, [-.47, F + .66, 0], .06);
    const sh = grp(g, [-.53, F + .6, .1], [0, -.35, 0]);
    B(sh, [.07, .56, .46], M.gold, [-.005, 0, 0], .06);
    B(sh, [.08, .5, .4], teamMat(), [.01, 0, 0], .06);
    B(sh, [.03, .16, .16], M.gold, [-.05, 0, 0], .03, [Math.PI / 4, 0, 0]);
  },
  hop(g: THREE.Group) {
    const spring = add(g, coil(.18, .3, 4), M.gold, [0, F, 0]);
    const plate = B(g, [.42, .05, .42], M.gun, [0, F + .32, 0], .02);
    const bg = grp(g, [0, F + .34, 0]);
    B(bg, [.92, .56, .78], M.frog, [0, .28, 0], .25);
    [[-.2, -.15, .18], [.2, -.05, .14], [0, -.3, .12], [-.32, .12, .1]].forEach(([x, z, w]) => B(bg, [w, .03, w * .8], M.frogDark, [x, .558, z], .012));
    B(bg, [.5, .22, .08], M.frogBelly, [0, .16, .37], .07);
    B(bg, [.82, .2, .04], teamMat(), [0, .65, .25], .06);
    for (const sx of [-1, 1]) {
      B(bg, [.27, .25, .25], M.frog, [sx * .24, .64, .12], .1);
      B(bg, [.19, .18, .05], M.white, [sx * .24, .65, .265], .04);
      B(bg, [.09, .11, .03], M.black, [sx * .22, .64, .29], .02);
      B(bg, [.03, .03, .01], M.white, [sx * .22 - .025, .665, .306], .008);
      B(bg, [.2, .05, .05], M.dark, [sx * .24, .79, .26], .02, [0, 0, sx * .3]);
      B(bg, [.08, .22, .04], teamMat('dark'), [sx * .08, .5, -.4], .02, [0, 0, sx * .4]);
      B(bg, [.09, .05, .02], M.pink, [sx * .33, .42, .39], .02);
      B(bg, [.14, .28, .16], M.frog, [sx * .3, .13, .28], .06);
      for (const tx of [-.05, 0, .05]) B(bg, [.05, .04, .1], M.frog, [sx * .3 + tx, .01, .34], .018);
      B(bg, [.3, .22, .44], M.frog, [sx * .47, .12, -.05], .09);
      B(bg, [.18, .05, .3], M.frog, [sx * .52, .02, .14], .02);
      for (const tx of [-.06, 0, .06]) B(bg, [.05, .04, .1], M.frog, [sx * .52 + tx, .015, .32], .018);
    }
    smile(bg, .36, .395, .52);
    B(bg, [.08, .04, .03], M.tongue, [.12, .33, .395], .015);
    const cape = grp(bg, [0, .5, -.36]);
    B(cape, [.7, .55, .04], teamMat(), [0, -.27, 0], .02);
    tick(t => {
      const c = 1 + Math.sin(t * 3.2) * .12;
      spring.scale.y = c;
      plate.position.y = F + .32 * c;
      bg.position.y = F + .32 * c + .02;
      cape.rotation.x = .45 + Math.sin(t * 5) * .12;
    });
  },
  clank(g: THREE.Group) {
    for (const sx of [-1, 1]) {
      B(g, [.28, .12, .38], M.gun, [sx * .19, F + .06, .03], .05);
      B(g, [.285, .07, .1], teamMat(), [sx * .19, F + .09, .2], .03);
      B(g, [.16, .22, .18], M.steel, [sx * .19, F + .23, 0], .04);
      B(g, [.12, .08, .2], M.gun, [sx * .19, F + .33, 0], .03);
      B(g, [.03, .36, .36], teamMat(), [sx * .355, F + .64, 0], .02);
      for (const sy of [-1, 1]) B(g, [.035, .035, .02], M.gold, [sx * .29, F + .64 + sy * .21, .265], .01);
      B(g, [.13, .09, .02], glow(0x5ff2ff), [sx * .14, F + 1.3, .31], .02, [0, 0, -sx * .12]);
      B(g, [.18, .045, .03], M.gun, [sx * .14, F + 1.4, .3], .015, [0, 0, sx * .32]);
      B(g, [.08, .18, .18], teamMat(), [sx * .4, F + 1.26, 0], .04);
      B(g, [.04, .06, .06], M.gold, [sx * .45, F + 1.26, 0], .015);
      B(g, [.18, .18, .18], M.gun, [sx * .44, F + .8, 0], .05);
      B(g, [.11, .3, .11], M.steel, [sx * .48, F + .6, 0], .035, [0, 0, sx * .12]);
      B(g, [.13, .06, .13], M.gun, [sx * .5, F + .44, 0], .02);
      B(g, [.14, .06, .12], teamMat(), [sx * .5, F + .39, 0], .02);
      for (const f of [-1, 1]) B(g, [.04, .14, .08], teamMat(), [sx * .5 + f * .05, F + .31, 0], .015, [0, 0, f * .35]);
    }
    B(g, [.7, .54, .52], M.steel, [0, F + .64, 0], .1);
    B(g, [.42, .3, .03], M.dark, [0, F + .66, .265], .03);
    const lights = [0xff5a4f, 0xffd24a, 0x5ce07a].map((c, i) => B(g, [.06, .06, .02], glow(c), [-.1 + i * .1, F + .73, .28], .015));
    B(g, [.26, .08, .012], M.white, [0, F + .6, .282], .02);
    const needle = grp(g, [0, F + .57, .29]);
    B(needle, [.015, .07, .01], M.red, [0, .035, 0], .005);
    windKey(g, [0, F + .66, -.26]);
    B(g, [.16, .1, .16], M.gun, [0, F + .95, 0], .03);
    B(g, [.72, .54, .58], M.steel, [0, F + 1.26, 0], .15);
    B(g, [.12, .06, .5], teamMat(), [0, F + 1.54, 0], .02);
    B(g, [.56, .2, .03], M.dark, [0, F + 1.3, .295], .05);
    B(g, [.3, .1, .02], M.dark, [0, F + 1.12, .295], .02);
    for (let i = 0; i < 4; i++) B(g, [.02, .08, .015], M.steel, [-.09 + i * .06, F + 1.12, .307], .005);
    B(g, [.03, .22, .03], M.gun, [0, F + 1.64, 0], .01);
    const tip = B(g, [.1, .1, .1], teamMat(), [0, F + 1.78, 0], .03);
    const card = grp(g, [.53, F + .26, .06], [0, -.3, .15]);
    B(card, [.22, .3, .02], M.white, [0, 0, 0], .025);
    B(card, [.17, .24, .01], teamMat('enemy'), [0, 0, .01], .02);
    B(card, [.05, .05, .006], M.gold, [0, 0, .017], .01, [0, 0, Math.PI / 4]);
    tick(t => {
      tip.scale.setScalar(1 + Math.max(0, Math.sin(t * 4)) * .25);
      needle.rotation.z = Math.sin(t * 1.7) * .9;
      card.rotation.z = .15 + Math.sin(t * 3) * .15;
      lights.forEach((l, i) => { l.visible = Math.sin(t * 3 + i * 2) > -.3; });
    });
  },
  bruno(g: THREE.Group) {
    for (const sx of [-1, 1]) {
      B(g, [.26, .22, .32], M.bear, [sx * .18, F + .11, .04], .09);
      B(g, [.15, .11, .02], M.bearLight, [sx * .18, F + .09, .205], .04);
      for (const tx of [-.05, 0, .05]) B(g, [.04, .04, .015], M.bearLight, [sx * .18 + tx, F + .17, .205], .012);
      B(g, [.21, .21, .13], M.bear, [sx * .3, F + 1.44, -.04], .08);
      B(g, [.11, .11, .02], M.bearLight, [sx * .3, F + 1.44, .03], .04);
      B(g, [.09, .05, .02], M.pink, [sx * .25, F + 1.03, .325], .02);
    }
    B(g, [.72, .62, .6], M.bear, [0, F + .52, 0], .25);
    B(g, [.42, .38, .06], M.bearLight, [0, F + .48, .29], .12);
    for (let i = 0; i < 4; i++) B(g, [.05, .012, .01], M.bearDark, [0, F + .36 + i * .08, .322], .004);
    B(g, [.2, .38, .22], M.bear, [-.44, F + .52, .04], .09, [0, 0, -.2]);
    B(g, [.1, .1, .012], M.patch, [-.45, F + .58, .156], .02, [0, 0, -.2]);
    const arm = grp(g, [.36, F + .72, .04]);
    B(arm, [.2, .38, .22], M.bear, [0, -.16, 0], .09);
    const env = grp(arm, [0, -.4, .06], [0, 0, Math.PI]);
    B(env, [.28, .18, .03], M.white, [0, 0, 0], .02);
    for (const sx of [-1, 1]) B(env, [.16, .012, .01], M.cream, [sx * .06, .03, .017], .004, [0, 0, -sx * .5]);
    B(env, [.06, .06, .012], M.red, [0, 0, .02], .02);
    tick(t => { arm.rotation.z = 2.5 + Math.sin(t * 3) * .18; });
    B(g, [.74, .62, .64], M.bear, [0, F + 1.12, 0], .27);
    B(g, [.58, .16, .52], teamMat(), [0, F + 1.46, 0], .06);
    B(g, [.48, .04, .22], teamMat('dark'), [0, F + 1.39, .3], .02);
    B(g, [.1, .08, .02], M.gold, [0, F + 1.47, .265], .02);
    B(g, [.34, .22, .15], M.bearLight, [0, F + 1.02, .31], .09);
    B(g, [.13, .09, .06], M.dark, [0, F + 1.09, .39], .035);
    B(g, [.035, .025, .01], M.white, [-.03, F + 1.11, .422], .008);
    smile(g, F + .97, .387, .14);
    face(g, { x: .15, y: F + 1.19, z: .325, s: .12, mood: 'happy' });
    B(g, [.06, .85, .03], teamMat('dark'), [-.03, F + .6, .33], .015, [0, 0, -.92]);
    B(g, [.36, .3, .18], teamMat(), [-.36, F + .3, .24], .06);
    B(g, [.37, .12, .19], teamMat('dark'), [-.36, F + .42, .24], .04);
    B(g, [.06, .06, .02], M.gold, [-.36, F + .38, .34], .015);
    B(g, [.22, .12, .02], M.white, [-.39, F + .51, .23], .01, [0, 0, -.15]);
    B(g, [.2, .11, .02], M.cream, [-.32, F + .5, .21], .01, [0, 0, .12]);
  },
  rexie(g: THREE.Group) {
    for (const sx of [-1, 1]) {
      B(g, [.28, .34, .34], M.dino, [sx * .23, F + .2, -.04], .11);
      B(g, [.3, .11, .38], M.dino, [sx * .23, F + .055, .06], .04);
      for (const tx of [-.08, 0, .08]) B(g, [.05, .05, .06], M.white, [sx * .23 + tx, F + .04, .27], .015);
      B(g, [.1, .12, .22], M.dino, [sx * .3, F + .84, .28], .04, [-.5, 0, 0]);
      B(g, [.04, .04, .05], M.white, [sx * .3, F + .78, .4], .012);
    }
    B(g, [.76, .74, .66], M.dino, [0, F + .68, -.04], .26, [-.15, 0, 0]);
    B(g, [.42, .44, .08], M.dinoBelly, [0, F + .62, .29], .1, [-.15, 0, 0]);
    for (const d of [-.11, 0, .11]) B(g, [.34, .02, .012], M.dinoBellyDark, [0, F + .62 + d, .336 - d * .15], .006, [-.15, 0, 0]);
    const cape = grp(g, [0, F + 1.02, -.48]);
    B(cape, [.84, .46, .06], teamMat(), [0, -.25, 0], .03);
    B(cape, [.88, .12, .24], M.white, [0, 0, .08], .05);
    for (const x of [-.3, -.1, .1, .3]) B(cape, [.03, .05, .01], M.black, [x, 0, .205], .008);
    tick(t => { cape.rotation.x = .12 + Math.sin(t * 2) * .05; });
    const hg = grp(g, [0, F + 1.08, .14]);
    B(hg, [.64, .46, .7], M.dino, [0, .24, 0], .18);
    B(hg, [.52, .06, .5], M.mouth, [0, 0, .06], .03);
    for (let i = 0; i < 4; i++) add(hg, pyramid(.045, .09), M.white, [-.15 + i * .1, -.035, .3], [Math.PI, Math.PI / 4, 0]);
    face(hg, { x: .16, y: .32, z: .355, s: .12, mood: 'brave' });
    const jaw = grp(hg, [0, .02, -.22]);
    B(jaw, [.58, .14, .58], M.dino, [0, -.07, .25], .06);
    for (let i = 0; i < 3; i++) add(jaw, pyramid(.04, .08), M.white, [-.1 + i * .1, .03, .48], [0, Math.PI / 4, 0]);
    tick(t => { jaw.rotation.x = .1 + (Math.sin(t * 2) * .5 + .5) * .16; });
    B(hg, [.42, .1, .42], M.gold, [0, .52, -.02], .02);
    B(hg, [.34, .06, .34], teamMat('dark'), [0, .58, -.02], .02);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(hg, pyramid(.06, .15), M.gold, [sx * .15, .645, -.02 + sz * .15], [0, Math.PI / 4, 0]);
    B(hg, [.07, .07, .02], M.red, [0, .52, .195], .015, [0, 0, Math.PI / 4]);
    for (const sx of [-1, 1]) B(hg, [.02, .06, .06], teamMat(), [sx * .215, .52, -.02], .012);
    const tail = grp(g, [0, F + .36, -.36]);
    for (let i = 0; i < 5; i++) {
      const s = 1 - i * .15, y = -i * .02 + (i > 2 ? (i - 2) * .05 : 0), z = -.06 - i * .17;
      B(tail, [.36 * s, .3 * s, .24], M.dino, [0, y, z], .08 * s);
      add(tail, pyramid(.06 * s, .14 * s), teamMat(), [0, y + .15 * s + .04, z], [-.4, Math.PI / 4, 0]);
    }
    tick(t => { tail.rotation.y = Math.sin(t * 1.8) * .25; });
  },
};

export const HEIGHT: Record<TroopId, number> = { pip: 1.3, mira: .95, boing: 1.1, brix: 1.25, hop: 1.4, clank: 1.55, bruno: 1.7, rexie: 1.85 };
export const T = .16;
export const LABEL: Record<TroopId, string> = { pip: '★', mira: '1', boing: '2', brix: '3', hop: '4', clank: '5', bruno: '6', rexie: '7' };

const numberCache = new Map<string, THREE.BufferGeometry>();
export function numberGeometry(label: string): THREE.BufferGeometry {
  const hit = numberCache.get(label);
  if (hit) return hit;
  const opts = { depth: .01, curveSegments: 6, bevelEnabled: true, bevelThickness: .003, bevelSize: .003, bevelSegments: 2 };
  let geo: THREE.BufferGeometry;
  if (label === '★') {
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .022 : .052;
      if (i) star.lineTo(Math.cos(a) * r, Math.sin(a) * r); else star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    geo = new THREE.ExtrudeGeometry(star, opts);
  } else {
    geo = new TextGeometry(label, { font: FONT, size: .085, ...opts });
  }
  geo.center();
  numberCache.set(label, geo);
  return geo;
}

function token(label: string, side: Side): THREE.Group {
  setBuildSide(side);
  const g = new THREE.Group();
  box(g, [1.16, .03, 1.16], M.gold, [0, .015, 0], [0, 0, 0], .015);
  box(g, [1.12, T - .05, 1.12], teamMat(), [0, .02 + (T - .05) / 2, 0], [0, 0, 0], .035);
  box(g, [1.12, .04, 1.12], M.tokenWood, [0, T - .02, 0], [0, 0, 0], .03);
  const geo = numberGeometry(label);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const plate = grp(g, [Math.sin(a) * .56, .02 + (T - .06) / 2, Math.cos(a) * .56], [0, a, 0]);
    B(plate, [.26, .1, .006], teamMat('dark'), [0, 0, .003], .003);
    for (const s of [-1, 1]) {
      B(plate, [.3, .018, .018], M.gold, [0, s * .055, .009], .006);
      B(plate, [.02, .1, .018], M.gold, [s * .14, 0, .009], .006);
    }
    add(plate, geo, M.white, [0, 0, .014]);
  }
  return g;
}

export function place(fig: THREE.Object3D, level: number, squash = 1) {
  const s = fig.userData.s as number;
  const spread = 1 + (1 - squash) * .25;
  fig.scale.set(s * spread, s * squash, s * spread);
  fig.position.y = level - F * s * squash;
}

function makeFigure(id: TroopId, side: Side): THREE.Group {
  setBuildSide(side);
  const fig = new THREE.Group();
  const inner = grp(fig);
  const ticks: Tick[] = collectTicks(() => BUILD[id](inner));
  const ph = Math.random() * 6;
  ticks.push(t => { const e = Math.sin(t * 2.4 + ph) * .012; inner.scale.set(1 - e * .5, 1 + e, 1 - e * .5); });
  fig.userData.ticks = ticks;
  const bounds = new THREE.Box3().setFromObject(fig);
  fig.userData.s = HEIGHT[id] / (bounds.max.y - F);
  return fig;
}

export const OUTLINE_RES = { value: new THREE.Vector2(1, 1) };
const outlineMat = new THREE.ShaderMaterial({
  uniforms: { uWidth: { value: 1.6 }, uColor: { value: new THREE.Color(0x5a4e44) }, uRes: OUTLINE_RES },
  vertexShader: `uniform float uWidth; uniform vec2 uRes;
    void main() {
      vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vec3 n = normalize(normalMatrix * normal);
      vec2 dir = normalize((projectionMatrix * vec4(n, 0.0)).xy + vec2(1e-6));
      clip.xy += dir * uWidth * 2.0 / uRes * clip.w;
      gl_Position = clip;
    }`,
  fragmentShader: `uniform vec3 uColor; void main() { gl_FragColor = vec4(uColor, 1.0); }`,
  side: THREE.BackSide,
});
const NO_OUTLINE = new Set(['PlaneGeometry', 'TextGeometry', 'ExtrudeGeometry']);
function addOutline(root: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  root.traverse(o => {
    const m = o as THREE.Mesh;
    if (m.isMesh && !m.userData.outline && !NO_OUTLINE.has(m.geometry.type) && (m.material as THREE.Material).type !== 'MeshBasicMaterial') meshes.push(m);
  });
  for (const m of meshes) {
    const h = new THREE.Mesh(m.geometry, outlineMat);
    h.userData.outline = true;
    m.add(h);
  }
}

export interface Piece extends THREE.Group {
  userData: { fig: THREE.Group; troop: TroopId; side: Side; uid: number };
}

export function makePiece(troop: TroopId, side: Side, uid: number): Piece {
  const g = new THREE.Group() as Piece;
  const fig = makeFigure(troop, side);
  place(fig, T);
  g.add(token(LABEL[troop], side), fig);
  g.userData = { fig, troop, side, uid };
  addOutline(g);
  return g;
}

export const figureTicks = (p: Piece) => p.userData.fig.userData.ticks as Tick[];
