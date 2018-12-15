import * as ActionHelpers from './action-helpers'
import * as qmath from '@jtl/qmath';

export const EditFace = {
  cssIcons: ['file-picture-o'],
  label: 'sketch',
  icon96: 'img/3d/face-edit96.png',
  info: 'open sketcher for a face/plane',
  listens: ['selection'],
  update: ActionHelpers.checkForSelectedFaces(1),
  invoke: (app) => app.sketchSelectedFace()
};

export const Save = {
  cssIcons: ['floppy-o'],
  label: 'save',
  info: 'save project to storage',
  invoke: (app) => app.save()
};

export const StlExport = {
  cssIcons: ['upload', 'flip-vertical'],
  label: 'STL Export',
  info: 'export model to STL file',
  invoke: (app) => app.stlExport()
};

export const RefreshSketches = {
  cssIcons: ['refresh'],
  label: 'Refresh Sketches',
  info: 'refresh all visible sketches',
  invoke: (app) => app.refreshSketches()
};

export const DeselectAll = {
  cssIcons: ['square-o'],
  label: 'deselect all',
  info: 'deselect everything',
  invoke: (app) => app.viewer.selectionMgr.deselectAll()
};

export const Info = {
  cssIcons: ['info-circle'],
  label: 'info',
  info: 'opens help dialog',
  invoke: (app) => app.showInfo()
};

export const Donate = {
  cssIcons: ['paypal'],
  label: 'donate',
  info: 'open paypal donate page',
  invoke: (app, e) => window.open('https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=WADW7V7CC32CY&lc=US&item_name=web%2dcad%2eorg&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted', '_blank')
};

export const GitHub = {
  cssIcons: ['github'],
  label: 'GitHub',
  info: 'open GitHub project page',
  invoke: (app, e) => window.open('https://github.com/xibyte/jsketcher', '_blank')
};

export const ShowSketches = {
  type: 'binary',
  property: 'showSketches',
  cssIcons: ['image'],
  label: 'show sketches',
  info: 'toggle whether to show sketches on a solid face'
};

export const LookAtSolid = {
  cssIcons: ['crosshairs'],
  label: 'look at solid',
  info: 'position camera at the solid at zoom to fit it',
  invoke: (app, e) => app.lookAtSolid(app.inputManager.context.attr('data-id'))
};

export const noIcon = {
  label: 'no icon'
};

/**
 * 
 */
function soildToBrepBody(solid) {
  const brepBody = new qmath.JM.BrepBody();

  const hisIdToArrayIdx = new Map();
  // Faces
  for (let i = 0; i < solid.polyFaces.length; i++) {
    const polyFace = solid.polyFaces[i];
    const { csgGroup } = polyFace;

    const [u, v, normal] = polyFace.basis();
    const origin = normal.multiply(polyFace.depth());
    const plane = new qmath.JM.Plane(origin, u, v);

    const ptsArr = csgGroup.polygons.map(polygon => {
      return polygon.vertices.map(vertice => {
        return plane.getUVAt(vertice.pos);
      });
    });

    const polygon = new qmath.JM.Polygon(ptsArr);
    const face = new qmath.JM.Face(plane, true, polygon);
    brepBody.addFace(face);
    hisIdToArrayIdx.set(polyFace.id, i);
  }

  // Edge
  for (const key of solid.wires.getKeys()) {
    const edge = brepBody.addNewEdge(new qmath.JM.Line3d(key[0], key[1]));
    try {
      const value = solid.wires.get(key);
      const id0 = hisIdToArrayIdx.get(value.sharedFaces[0].id);
      const id1 = hisIdToArrayIdx.get(value.sharedFaces[1].id);
      const face0 = brepBody.getFaces()[id0];
      const face1 = brepBody.getFaces()[id1];

      try {
        face0.makeEdgeAndFaceRefEachOther(edge, 0);
      } catch (error) {
        console.error(error);
      }
      try {
        face1.makeEdgeAndFaceRefEachOther(edge, 1);
      } catch (error) {
        console.error(error);
      }
    } catch (error) { console.error(error); }
  }

  return brepBody;
}

export const exporter = {
  label: 'exporter',
  invoke: (app, e) => {
    const solids = app.craft.solids;
    let result = '';
    for (const solid of solids) {
      const body = soildToBrepBody(solid);
      let offset = new qmath.JM.Vector3(0, 0, 3);
      // body.translate(offset);
      // 缩放
      body.scale(0.01);
      result += body.asString() + '\n\n';
    }
    console.log('结果\n', result);
  }
};
