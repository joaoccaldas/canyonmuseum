export const DISCOVER_LANES=Object.freeze([
 {id:'places',title:'Places',subtitle:'Where Kona happens.',image:'assets/kona-years/kailua-bay.jpg'},
 {id:'machines',title:'Machines',subtitle:'The equipment that changed the sport.',image:'assets/share/studio.jpg'},
 {id:'people',title:'People',subtitle:'Athletes, builders, dreamers.',image:'assets/share/museum.jpg'},
 {id:'stories',title:'Stories',subtitle:'The moments worth remembering.',image:'assets/share/kona.jpg'},
]);
export function discoverLanes(){return DISCOVER_LANES.map(x=>({...x}));}
