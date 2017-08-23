


var VEShapeCounter = 1000;

class VEShapeType {
    public static Pushpin = 'Pushpin';
    public static Polyline = 'Polyline';
    public static Polygon = 'Polygon';
}

enum VEMapMode {
    Mode2D,
    Mode3D
}

class VEMapStyle {
    public static Road = 'r';
    public static Shaded = 's';
    public static Aerial = 'a';
    public static Hybrid = 'h';
    public static Oblique = 'o';
    public static Birdseye = 'o';
    public static BirdseyeHybrid = 'b';
}

class VEOrientation {
    public static North = 'North';
    public static South = 'South';
    public static East = 'East';
    public static West = 'West';
}

interface VEEvent {
    elementID?: string,
    eventName?: string,
    mapStyle?: string,
    clientX?: number,
    clientY?: number,
    screenX?: number,
    screenY?: number,
    mapX?: number,
    mapY?: number,
    zoomLevel?: number,
    latLong?: VELatLong
    leftMouseButton?: boolean,
    rightMouseButton?: boolean,
}

class VELatLong {
    public _location: Microsoft.Maps.Location;
    public _updatedEvent: () => void;

    constructor(latitude: number, longitude: number) {
        this._location = new Microsoft.Maps.Location(latitude, longitude);
    }

    set Latitude(lat: number) {
        this._location.latitude = lat;

        if (this._updatedEvent) {
            this._updatedEvent();
        }
    }

    get Latitude(): number {
        return this._location.latitude;
    }

    set Longitude(lon: number) {
        this._location.longitude = lon;

        if (this._updatedEvent) {
            this._updatedEvent();
        }
    }

    get Longitude(): number {
        return this._location.longitude;
    }

    public static _fromLocation(loc: Microsoft.Maps.Location | Microsoft.Maps.Search.IGeocodeLocation): VELatLong {
        return new VELatLong(loc.latitude, loc.longitude);
    }

    //Not supported
    public SetAltitude(): void { }
}

class VELatLongRectangle {
    private _topLeft: VELatLong;
    private _bottomRight: VELatLong;
    public _bounds: Microsoft.Maps.LocationRect;

    constructor(TopLeftLatLong: VELatLong, BottomRightLatLong: VELatLong) {
        this._topLeft = TopLeftLatLong;
        this._bottomRight = BottomRightLatLong; 

        this._updateBase();       
    }

    set TopLeftLatLong(loc: VELatLong) {
        this._topLeft = loc;
        this._topLeft._updatedEvent = this._updateBase;
        this._updateBase();
    }

    get TopLeftLatLong(): VELatLong {
        return this._topLeft;
    }

    set BottomRightLatLong(loc: VELatLong) {
        this._bottomRight = loc;
        this._bottomRight._updatedEvent = this._updateBase;
        this._updateBase();
    }

    get BottomRightLatLong(): VELatLong {
        return this._bottomRight;
    }

    private _updateBase(): void {
        if (this._topLeft && this._bottomRight) {
            this._bounds = Microsoft.Maps.LocationRect.fromCorners(this._topLeft._location, this._bottomRight._location);            
        }
    }

    public static _fromLocationRect(loc: Microsoft.Maps.LocationRect): VELatLongRectangle {
        if (loc) {
            return new VELatLongRectangle(VELatLong._fromLocation(loc.getNorthwest()), VELatLong._fromLocation(loc.getSoutheast()));
        }

        return null;
    }
}

class VEPixel {
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public x: number;
    public y: number;

    public _getPoint(): Microsoft.Maps.Point {
        return new Microsoft.Maps.Point(this.x, this.y);
    }

    public static _fromPoint(p: Microsoft.Maps.Point): VEPixel {
        return new VEPixel(p.x, p.y);
    }
}

class VEColor {
    constructor(r, g, b, a) {
        this.A = a;
        this.R = r;
        this.G = g;
        this.B = b;
    }

    public A: number;
    public R: number;
    public G: number;
    public B: number;

    public _getV8Color(): Microsoft.Maps.Color {
        return new Microsoft.Maps.Color(this.A, this.R, this.G, this.B);
    }

    public static _fromV8Color(c: Microsoft.Maps.Color): VEColor {
        return new VEColor(c.r, c.g, c.b, c.a);
    }
}

class VEShapeDragEventArgs {
    public Shape: VEShape;

    public LatLong: VELatLong;
}

class VECustomIconSpecification {
    constructor() {
    }

    public Image: string;

    public ImageOffset: VEPixel;

    public TextContent: string;

    public TextOffset: VEPixel;

    /* Not supported:
        BackColor,
        CustomHTML,
        ForeColor,
        TextBold,
        TextFont,
        TextItalics,
        TextSize,
        TextUnderline
    */
}

class VEShape {
    private _shapeType: VEShapeType;
    public _shape: Microsoft.Maps.IPrimitive;
    private _events = [];
    private _eventHandlers = [];
    public _layer: VEShapeLayer;
    public _map: VEMap;
    public _infoboxOffset = new Microsoft.Maps.Point(0, 0);

    constructor(type: VEShapeType, points?: VELatLong | VELatLong[]) {
        this._shapeType = type;

        if (points) {
            this._initShape(points);
        }
    }

    set Draggable(canDrag: boolean) {
        if (this._shape instanceof Microsoft.Maps.Pushpin) {
            var isDraggable = (<Microsoft.Maps.Pushpin>this._shape).getDraggable();

            if (isDraggable != canDrag) {
                this._shape.setOptions(<Microsoft.Maps.IPushpinOptions>{ draggable: canDrag });
            }
        }
    }

    get Draggable(): boolean {
        if (this._shape instanceof Microsoft.Maps.Pushpin) {
            return (<Microsoft.Maps.Pushpin>this._shape).getDraggable();
        }

        return false;
    } 

    set ondrag(callback: (args: VEShapeDragEventArgs) => void) {
        this._updateDragEvent('drag', callback);
    }

    get ondrag(): (args: VEShapeDragEventArgs) => void {
        return this._events['drag'];
    }

    set onstartdrag(callback: (args: VEShapeDragEventArgs) => void) {
        this._updateDragEvent('dragstart', callback);
    }

    get onstartdrag(): (args: VEShapeDragEventArgs) => void {
        return this._events['dragstart'];
    }

    set onenddrag(callback: (args: VEShapeDragEventArgs) => void) {
        this._updateDragEvent('dragend', callback);
    }

    get onenddrag(): (args: VEShapeDragEventArgs) => void {
        return this._events['dragend'];
    }

    public GetCustomIcon(): VECustomIconSpecification {
        if (this._shape instanceof Microsoft.Maps.Pushpin) {
            var p = <Microsoft.Maps.Pushpin>this._shape;

            return {
                Image: p.getIcon(),
                ImageOffset: VEPixel._fromPoint(p.getAnchor()),
                TextContent: p.getText(),
                TextOffset: VEPixel._fromPoint(p.getTextOffset())                
            };
        }

        return null;
    }

    public SetCustomIcon(icon: string | VECustomIconSpecification) {
        if (icon instanceof VECustomIconSpecification && this._shape instanceof Microsoft.Maps.Pushpin) {
            this._shape.setOptions(<Microsoft.Maps.IPushpinOptions>{
                icon: icon.Image,
                anchor: (icon.ImageOffset)? icon.ImageOffset._getPoint(): null,
                text: icon.TextContent,
                textOffset: (icon.ImageOffset) ? icon.TextOffset._getPoint(): null
            });
        }
    }

    public GetDescription(): string {
        return this._shape.metadata.description;
    }

    public SetDescription(val: string): void {
        this._shape.metadata.description = val;
    }

    public GetFillColor(): VEColor {
        if (this._shape instanceof Microsoft.Maps.Polygon) {
            return VEColor._fromV8Color(<Microsoft.Maps.Color>(<Microsoft.Maps.Polygon>this._shape).getFillColor());
        }

        return null;
    }

    public SetFillColor(c: VEColor): void {
        if (this._shape instanceof Microsoft.Maps.Polygon) {
            (<Microsoft.Maps.Polygon>this._shape).setOptions({
                fillColor: c._getV8Color()
            });
        }
    }

    public GetLineColor(): VEColor {
        if (!(this._shape instanceof Microsoft.Maps.Pushpin)) {
            return VEColor._fromV8Color(<Microsoft.Maps.Color>(<Microsoft.Maps.Polyline>this._shape).getStrokeColor());
        }

        return null;
    }

    public SetLineColor(c: VEColor): void {
        if (!(this._shape instanceof Microsoft.Maps.Pushpin)) {
            (<Microsoft.Maps.Polyline>this._shape).setOptions({
                strokeColor: c._getV8Color()
            });
        }
    }

    public GetIconAnchor(): VELatLong {
        if (this._shape instanceof Microsoft.Maps.Pushpin) {
            return VELatLong._fromLocation((<Microsoft.Maps.Pushpin>this._shape).getLocation());
        }

        return null;
    }

    public SetIconAnchor(loc: VELatLong): void {
        if (this._shape instanceof Microsoft.Maps.Pushpin) {
            (<Microsoft.Maps.Pushpin>this._shape).setLocation(loc._location);
        }
    }

    public GetId(): string {
        return this._shape.metadata.id;
    }

    public GetPoints(): VELatLong[] {
        if (this._shape instanceof Microsoft.Maps.Pushpin) {
            return [VELatLong._fromLocation((<Microsoft.Maps.Pushpin>this._shape).getLocation())];
        } else {
            var locs = (<Microsoft.Maps.Polyline>this._shape).getLocations();
            var latlongs = [];

            for (var i = 0, len = locs.length; i < len; i++) {
                latlongs.push(VELatLong._fromLocation(locs[i]));
            }

            return latlongs;
        }
    }

    public SetPoints(points: VELatLong | VELatLong[]): void {
        if (this._shape instanceof Microsoft.Maps.Pushpin) {
            if (points instanceof Array) {
                (<Microsoft.Maps.Pushpin>this._shape).setLocation(points[0]._location);
            } else {
                (<Microsoft.Maps.Pushpin>this._shape).setLocation((<VELatLong>points)._location);
            }
        } else if (points instanceof Array) {
            var locs = [];
            for (var i = 0; i < points.length; i++){
                locs.push(points[i]._location);
            }

            (<Microsoft.Maps.Polyline>this._shape).setLocations(locs);
        }
    }

    public GetShapeLayer(): VEShapeLayer {
        return this._layer;
    }

    public GetTitle(): string {
        return this._shape.metadata.title;
    }

    public SetTitle(val: string): void {
        this._shape.metadata.title = val;
    }

    public GetType(): VEShapeType {
        return this._shapeType;
    }

    public Hide(): void {
        this._shape.setOptions({ visible: false });
    }

    public Show(): void {
        this._shape.setOptions({ visible: true });
    }

    public static _fromPrimitive(p: Microsoft.Maps.IPrimitive): VEShape {
        var s: VEShape;

        if (p instanceof Microsoft.Maps.Pushpin) {
            s = new VEShape(VEShapeType.Pushpin, null);
        } else if (p instanceof Microsoft.Maps.Polyline) {
            s = new VEShape(VEShapeType.Polyline, null);
        } else if (p instanceof Microsoft.Maps.Polygon) {
            s = new VEShape(VEShapeType.Polygon, null);
        }

        VEShapeCounter++;

        p.metadata.id = 'VEShape_' + VEShapeCounter;
        p.metadata.parent = s;

        s._shape = p;

        return s;
    }

    //Private functions

    private _initShape(points: VELatLong | VELatLong[]) {
        this._shape = null;

        if (points != null) {
            var locs = [];

            if (points instanceof Array) {
                for (var i = 0; i < points.length; i++) {
                    locs.push(points[i]._location);
                }
            } else {
                locs.push((<VELatLong>points)._location);
            }

            switch (this._shapeType) {
                case VEShapeType.Pushpin:
                    this._shape = new Microsoft.Maps.Pushpin(locs[0]);
                    break;
                case VEShapeType.Polyline:
                    if (points instanceof Array) {
                        this._shape = new Microsoft.Maps.Polyline(locs);
                    }
                    break;
                case VEShapeType.Polygon:
                    if (points instanceof Array) {
                        this._shape = new Microsoft.Maps.Polygon(locs);
                    }
                    break;
                default:
                    break;
            }

            if (this._shape) {
                VEShapeCounter++;

                this._shape.metadata = {
                    id: 'VEShape_' + VEShapeCounter,
                    parent: this
                };
            }
        }
    }

    private _updateDragEvent(eventName: string, callback: (args: VEShapeDragEventArgs) => void): void {
        if (callback) {
            this._events[eventName] = (a: Microsoft.Maps.IMouseEventArgs) => {
                if (a.eventName === 'dragstart') {
                    if (this._map) {
                        this._map.HideInfoBox();
                    } else if (this._layer) {
                        this._layer._map.HideInfoBox();
                    }
                }

                callback(<VEShapeDragEventArgs>{
                    Shape: this,
                    LatLong: VELatLong._fromLocation((<Microsoft.Maps.Pushpin>this._shape).getLocation())
                });
            };

            if (this._shape instanceof Microsoft.Maps.Pushpin) {
                if (this._eventHandlers[eventName]) {
                    Microsoft.Maps.Events.removeHandler(this._eventHandlers[eventName]);
                }

                this._eventHandlers[eventName] = Microsoft.Maps.Events.addHandler(this._shape, eventName, this._events[eventName]);
            }
        } else {
            this._events[eventName] = null;
            if (this._eventHandlers[eventName]) {
                Microsoft.Maps.Events.removeHandler(this._eventHandlers[eventName]);
            }
        }
    }

    //Upsupported functions

    public GetAltitude(): number {
        return 0;
    }

    public SetAltitude(): void {
    }

    public GetAltitudeMode(): any {
        return null;
    }

    public SetAltitudeMode(): void {
    }

    public GetLineToGround(): boolean {
        return false;
    }

    public SetLineToGround(): void {
    }

    public GetMaxZoomLevel(): number {
        return 19;
    }

    public SetMaxZoomLevel(zoom: number): void {
    }

    public GetMinZoomLevel(): number {
        return 1;
    }

    public SetMinZoomLevel(zoom: number): void {
    }

    public GetZIndex(): number {
        return 1;
    }

    public SetZIndex(zoom: number): void {
    }
}

class VEShapeLayer {

    public _layer: Microsoft.Maps.Layer;
    public _map: VEMap;

    constructor() {
        this._layer = new Microsoft.Maps.Layer();
        this._layer.metadata = {
            parent: this
        };

        Microsoft.Maps.Events.addHandler(this._layer, 'mouseover', (e) => {
            if (this._map) {
                this._map._shapeHovered(e)
            }
        });

        Microsoft.Maps.Events.addHandler(this._layer, 'mouseout', (e) => {
            if (this._map) {
                this._map._infobox.setOptions({ visible: false });
            }
        });
    }

    public AddShape(s: VEShape | VEShape[]): void {
        if (s instanceof Array) {
            for (var i = 0; i < s.length; i++) {
                s[i]._layer = this;
                s[i]._map = this._map;
                this._layer.add(s[i]._shape);
            }
        } else {
            s._layer = this;
            s._map = this._map;
            this._layer.add(s._shape);
        }
    }

    public DeleteAllShapes(): void {
        this._layer.clear();
    }

    public DeleteShape(s: VEShape): void {
        this._layer.remove(s._shape);
    }

    public GetBoundingRectangle(): VELatLongRectangle {
        return VELatLongRectangle._fromLocationRect(Microsoft.Maps.LocationRect.fromShapes(this._layer.getPrimitives()));
    }

    public GetDescription(): string {
        return this._layer.metadata.description;
    }

    public SetDescription(val: string) {
        this._layer.metadata.description = val;
    }

    public GetTitle(): string {
        return this._layer.metadata.title;
    }

    public SetTitle(val: string) {
        this._layer.metadata.title = val;
    }

    public GetShapeById(id: string): VEShape {
        var shapes = this._layer.getPrimitives();

        for (var i = 0, len = shapes.length; i < len; i++) {
            if (shapes[i].metadata.id === id) {
                return <VEShape>shapes[i].metadata.parent;
            }
        }

        return null;
    }

    public GetShapeByIndex(idx: number): VEShape {
        return <VEShape>this._layer.getPrimitives()[idx].metadata.parent;
    }

    public GetShapeCount(): number {
        return this._layer.getPrimitives().length;
    }

    public IsIvisble(): boolean {
        return this._layer.getVisible();
    }

    public Hide(): void {
        this._layer.setVisible(false);
    }

    public Show(): void {
        this._layer.setVisible(true);
    } 
    
    //Not Supported

    public GetClusteredShapes(): void {
    }

    public SetClusteringConfiguration(): void {
    }

    public _updateMapReference(): void {
        var shapes = this._layer.getPrimitives();

        for (var i = 0, len = shapes.length; i < len; i++) {
            (<VEShape>shapes[i].metadata.parent)._map = this._map;
        }
    }
}

class VETileSourceSpecification {

    public _tileLayer: Microsoft.Maps.TileLayer;
    public _map: Microsoft.Maps.Map;
    public _id: string;
    public _opacity: number;

    constructor(tileSourceId: string, tileSource: string, numServers?: number, bounds?: VELatLongRectangle, minZoom?: number, maxZoom?: number, getTilePath?: () => void, opacity?: number, zindex?: number) {
        this._id = tileSourceId;

        var o: Microsoft.Maps.ITileSourceOptions = {
            uriConstructor: tileSource,
            bounds: (bounds)?bounds._bounds: null,
            minZoom: minZoom,
            maxZoom: maxZoom
        };

        this._opacity = (typeof opacity != 'undefined') ? opacity : 1;

        this._updateTileSource(o);
    }

    set Bounds(bounds: VELatLongRectangle) {
        var s = this._getTileSourceOptions();
        s.bounds = bounds._bounds;
        this._updateTileSource(s);
    }

    get Bounds(): VELatLongRectangle {
        return VELatLongRectangle._fromLocationRect(this._tileLayer.getTileSource().getBounds());
    }

    set ID(id: string) {
        this._id = id;
        this._tileLayer.metadata.id = id;
    }

    get ID(): string {
        return this._id;
    }

    set Opacity(opacity: number) {
        this._opacity = opacity;
        this._tileLayer.setOptions({ opacity: opacity });
    }

    get Opacity(): number {
        return this._opacity;
    }

    set MaxZoomLevel(maxZoom: number) {
        var s = this._getTileSourceOptions();
        s.maxZoom = maxZoom;
        this._updateTileSource(s);
    }

    get MaxZoomLevel(): number {
        return this._tileLayer.getTileSource().getMaxZoom();
    }

    set MinZoomLevel(minZoom: number) {
        var s = this._getTileSourceOptions();
        s.minZoom = minZoom;
        this._updateTileSource(s);
    }

    get MinZoomLevel(): number {
        return this._tileLayer.getTileSource().getMinZoom();
    }
    
    set TileSource(uriConstructor: string) {
        var s = this._getTileSourceOptions();
        s.uriConstructor = uriConstructor;
        this._updateTileSource(s);
    }

    get TileSource(): string {        
        var url = <string>this._tileLayer.getTileSource().getUriConstructor();
        return url;
    }

    private _updateTileSource(source: Microsoft.Maps.ITileSourceOptions): void {

        source.uriConstructor = (<string>source.uriConstructor).replace('%2', '{subdomain}').replace('%4', '{quadkey}');

        var o = <Microsoft.Maps.ITileLayerOptions>{
            opacity: this._opacity,
            mercator: new Microsoft.Maps.TileSource(source)
        }

        var metadata: any = {
            id: this._id
        };
        
        if (this._tileLayer) {
            o.visible = this._tileLayer.getVisible();
            
            if (this._map) {
                this._map.layers.remove(this._tileLayer);
            }
        }

        this._tileLayer = new Microsoft.Maps.TileLayer(o);
        metadata.parent = this._tileLayer;
        this._tileLayer.metadata = metadata;

        if (this._map) {
            this._map.layers.insert(this._tileLayer);
        }
    }

    private _getTileSourceOptions(): Microsoft.Maps.ITileSourceOptions {
        var s = this._tileLayer.getTileSource();

        return <Microsoft.Maps.ITileSourceOptions>{
            bounds: s.getBounds(),
            maxZoom: s.getMaxZoom(),
            minZoom: s.getMinZoom(),
            uriConstructor: (<string>s.getUriConstructor()).replace('{subdomain}', '%2').replace('{quadkey}', '%4')
        };
    }

    //Not supported
    public NumServers: number;
    public ZIndex: number;
}

class VEMapOptions {

    public BirdseyeOrientation: VEOrientation;

    //Not Supported
    
    public DashboardColor: string;
    public EnableBirdseye: boolean;
    public EnableClickableLogo: boolean;
    public EnableSearchLogo: boolean;
    public EnableDashboardLabels: boolean;
    public LoadBaseTiles: boolean;
    public UseEnhancedRoadStyle: boolean;
}

class VEMap {    
    private _rootElm: HTMLElement;
    private _key: string;
    private _map: Microsoft.Maps.Map;
    private _trafficManager: Microsoft.Maps.Traffic.TrafficManager;
    public _infobox: Microsoft.Maps.Infobox;
    private _events: any = {};
    private _eventHandlers: any = {};

    private _eventNamesV7ToV8 = {
        'onclick':'click',
        'ondoubleclick':'dblclick',
        'onmousemove':'mousemove',
        'onmousedown':'mousedown',
        'onmouseup':'mouseup',
        'onmouseover':'mouseover',
        'onmouseout':'mouseout',
        'onmousewheel':'mousewheel',
        'onchangemapstyle':'maptypechanged'
    };

    private _eventNamesV8ToV7 = {
        'click': 'onclick',
        'dblclick': 'ondoubleclick',
        'mousemove': 'onmousemove',
        'mousedown': 'onmousedown',
        'mouseup': 'onmouseup',
        'mouseover': 'onmouseover',
        'mouseout': 'onmouseout',
        'mousewheel': 'onmousewheel',
        'maptypechanged': 'onchangemapstyle'
    };

    private _commonEvents = [
        'onchangeview',
        'oncredentialserror',
        'oncredentialsvalid',
        'onendpan',
        'onendzoom',
        'onresize',
        'onstartpan',
        'onstartzoom',
        'onkeypress',
        'onkeydown',
        'onkeyup'
    ];

    constructor(elmId: string) {
        this._rootElm = document.getElementById(elmId);

        Microsoft.Maps.loadModule(['Microsoft.Maps.SpatialMath']);
    }

    public onLoadMap: () => void; 

    public AddShape(shape: VEShape | VEShape[]): void {
        if (this._map) {
            if (shape instanceof Array) {
                for (var i = 0; i < shape.length; i++) {
                    this._map.entities.push(shape[i]._shape);
                    shape[i]._map = this;
                }
            } else {
                this._map.entities.push(shape._shape);
                shape._map = this;
            }
        }
    }

    public AddShapeLayer(layer: VEShapeLayer): void {
        if (this._map) {
            layer._map = this;
            layer._updateMapReference();
            this._map.layers.insert(layer._layer);
        }
    }

    public AddTileLayer(layer: VETileSourceSpecification, visibleOnLoad: boolean): void{
        if (this._map) {
            if (typeof visibleOnLoad === 'boolean') {
                layer._tileLayer.setOptions({ visible: visibleOnLoad });
            }

            this._map.layers.insert(layer._tileLayer);
            layer._map = this._map;
        }
    }

    public AttachEvent(eventName: string, callback: () => void): void {
        var v8Name = this._eventNamesV7ToV8[eventName];

        if (v8Name) {
            this._updateEvent(v8Name, callback);

            if (eventName == 'onclick') {
                this._updateEvent('rightclick', callback);
            }
        } else if (this._commonEvents.indexOf(eventName) > -1){
            switch (eventName) {
                case 'onchangeview':
                case 'resize':
                case 'onendpan':
                case 'onendzoom':
                case 'onresize':
                case 'onstartpan':
                case 'onstartzoom':
                case 'onkeypress':
                case 'onkeydown':
                case 'onkeyup':
                    this._events[eventName] = callback;
                    break;
                default:
                    break;
            }
        }
    }

    public DetachEvent(eventName) {
        var v8Name = this._eventNamesV7ToV8[eventName];
        var commonName = this._commonEvents[eventName];

        if (v8Name) {
            this._updateEvent(v8Name);

            if (eventName == 'onclick') {
                this._updateEvent('rightclick');
            }
        } else {
            switch (eventName) {
                case 'onchangeview':
                case 'resize':
                case 'onendpan':
                case 'onendzoom':
                case 'onresize':
                case 'onstartpan':
                case 'onstartzoom':
                    this._events[eventName] = null;
                    break;
                default:
                    break;
            }
        }        
    }
        
    public HideInfoBox(): void {
        this._infobox.setOptions({ visible: false });
    }

    public ClearTraffic() {
        if (this._trafficManager) {
            this._trafficManager.hide();
        }
    }

    public DeleteAllShapeLayers(): void {
        for (var i = this._map.layers.length; i >= 0; i--) {
            if (this._map.layers[i] instanceof Microsoft.Maps.Layer) {
                (<VEShapeLayer>this._map.layers[i].metadata.parent)._map = null;
                this._map.layers.remove(this._map.layers[i]);
            }
        }

        this._map.entities.clear();
    }

    public DeleteAllShapes(): void {
        for (var i = this._map.layers.length; i >= 0; i--) {
            if (this._map.layers[i] instanceof Microsoft.Maps.Layer) {
                (<Microsoft.Maps.Layer>this._map.layers[i]).clear();
            }
        }

        this._map.entities.clear();
    }

    public DeleteShape(shape: VEShape): void {
        if (shape._layer) {
            shape._layer._layer.remove(shape._shape);
        } else if (this._map.entities.indexOf(shape._shape) > -1) {
            this._map.entities.remove(shape._shape);
        }
    }

    public DeleteShapeLayer(layer: VEShapeLayer): void {
        layer._map = null;
        this._map.layers.remove(layer._layer);
    }

    public DeleteTileLayer(layer: VETileSourceSpecification): void {
        this._map.layers.remove(layer._tileLayer);
    }

    public Dispose(): void {
        this._map.dispose();
    }

    public SetCredentials(key: string) {
        this._key = key;
    }

    public SetClientToken(key: string) {
        this._key = key;
    }

    public GetCenter(): VELatLong {
        return VELatLong._fromLocation(this._map.getCenter());
    }

    public SetCenter(loc: VELatLong): void {
        this._map.setView({ center: loc._location });
    }

    public GetHeading(): number {
        return this._map.getHeading();
    }

    public GetMapMode(): VEMapMode {
        return VEMapMode.Mode2D;
    }

    public SetMapMode(mode: VEMapMode): void {
    }

    public GetMapStyle(): VEMapStyle {
        switch (this._map.getMapTypeId()) {
            case Microsoft.Maps.MapTypeId.aerial:
                return VEMapStyle.Hybrid;
            case Microsoft.Maps.MapTypeId.birdseye:
                return VEMapStyle.BirdseyeHybrid;
        }

        return VEMapStyle.Road;
    }

    public SetMapStyle(style: VEMapStyle): void {
        var o: Microsoft.Maps.IViewOptions = {
            labelOverlay: Microsoft.Maps.LabelOverlay.visible
        };

        switch (style) {
            case VEMapStyle.Aerial:
                o.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                o.labelOverlay = Microsoft.Maps.LabelOverlay.hidden;
                break;
            case VEMapStyle.Oblique:
            case VEMapStyle.Birdseye:
                o.mapTypeId = Microsoft.Maps.MapTypeId.birdseye;
                o.labelOverlay = Microsoft.Maps.LabelOverlay.hidden;
                if (this._map.getZoom() < 18) {
                    o.zoom = 18;
                }
                break;
            case VEMapStyle.BirdseyeHybrid:
                o.mapTypeId = Microsoft.Maps.MapTypeId.birdseye;
                if (this._map.getZoom() < 18) {
                    o.zoom = 18;
                }
                break;
            case VEMapStyle.Hybrid:
                o.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                break;
            case VEMapStyle.Road:
            case VEMapStyle.Shaded:
                o.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                break;
            default:
                break;
        }

        this._map.setView(o);
    }

    public GetMapView(): VELatLongRectangle {
        return VELatLongRectangle._fromLocationRect(this._map.getBounds());
    }

    public SetMapView(bounds: VELatLongRectangle): void {
        this._map.setView({ bounds: bounds._bounds });
    }

    public GetShapeById(id: string): VEShape {
        var s;
        for (var i = 0; i< this._map.layers.length; i++) {
            if (this._map.layers[i] instanceof Microsoft.Maps.Layer) {
                s = this._map.layers[i].metadata.parent.GetShapeById(id);

                if (s) {
                    return s;
                }
            }
        }

        for (var i = 0; i < this._map.entities.getLength(); i++) {
            s = this._map.entities.get(i);
            if (s._shape.metadata.id === id) {
                return s;
            }
        }
    }

    public GetShapeLayerByIndex(idx: number): VEShapeLayer {
        var cnt = 0;

        for (var i = 0; i < this._map.layers.length; i++) {
            if (this._map.layers[i] instanceof Microsoft.Maps.Layer) {
                if (cnt === idx) {
                    return this._map.layers[i];
                }
                cnt++;
            }
        }
    }

    public GetShapeLayerCount(idx: number): number {
        var cnt = 0;

        for (var i = 0; i < this._map.layers.length; i++) {
            if (this._map.layers[i] instanceof Microsoft.Maps.Layer) {
                cnt++;
            }
        }

        return cnt;
    }

    public GetTileLayerById(id: string): VETileSourceSpecification {
        for (var i = 0; i < this._map.layers.length; i++) {
            if (this._map.layers[i] instanceof VETileSourceSpecification) {
                if (this._map.layers[i].metadata.id === id) {
                    return this._map.layers[i];
                }
            }
        }
    }

    public GetTileLayerByIndex(idx: number): VETileSourceSpecification {
        var cnt = 0;

        for (var i = 0; i < this._map.layers.length; i++) {
            if (this._map.layers[i] instanceof VETileSourceSpecification) {
                if (cnt === idx) {
                    return this._map.layers[i];
                }
                cnt++;
            }
        }
    }

    public GetTileLayerCount(idx: number): number {
        var cnt = 0;

        for (var i = 0; i < this._map.layers.length; i++) {
            if (this._map.layers[i] instanceof VETileSourceSpecification) {
                cnt++;
            }
        }

        return cnt;
    }

    public GetVersion(): string {
        return 'V8';
    }

    public GetZoomLevel(): number {
        return this._map.getZoom();
    }

    public SetZoomLevel(z: number): void {
        this._map.setView({ zoom: z });
    }

    public HideAllShapeLayers(): void {
        for (var i = this._map.layers.length; i >= 0; i--) {
            if (this._map.layers[i] instanceof Microsoft.Maps.Layer) {
                (<Microsoft.Maps.Layer>this._map.layers[i]).setVisible(false);
            }
        }
    }

    public ShowAllShapeLayers(): void {
        for (var i = this._map.layers.length; i >= 0; i--) {
            if (this._map.layers[i] instanceof Microsoft.Maps.Layer) {
                (<Microsoft.Maps.Layer>this._map.layers[i]).setVisible(true);
            }
        }
    }

    public HideBaseTileLayer(): void {
        this._map.setMapType(Microsoft.Maps.MapTypeId.mercator);
    }

    public ShowBaseTileLayer(): void {
        this._map.setMapType(Microsoft.Maps.MapTypeId.road);
    }

    public HideTileLayer(id: string): void {
        this.GetTileLayerById(id)._tileLayer.setVisible(false);
    }

    public ShowTileLayer(id: string): void {
        this.GetTileLayerById(id)._tileLayer.setVisible(true);
    }

    public HideTrafficLegend(): void {
        if (this._trafficManager) {
            this._trafficManager.hideLegend();
        }
    }

    public IncludePointInView(loc: VELatLong): void {
        var b = this._map.getBounds();
        var r = Microsoft.Maps.LocationRect.fromLocations([b.getNorthwest(), b.getSoutheast(), loc._location]);

        this._map.setView({ bounds: b });
    }

    public LatLongToPixel(locs: VELatLong | VELatLong[], zoom: number, callback): VEPixel | VEPixel[] {
        var r;

        var scale = Math.pow(2, zoom - this._map.getZoom());
        var tl = <Microsoft.Maps.Point>this._map.tryLocationToPixel(new Microsoft.Maps.Location(-180, 85.5));

        if (locs instanceof Array) {
            r = [];

            for (var i = 0; i < locs.length; i++) {
                var g = Microsoft.Maps.SpatialMath.Tiles.locationToGlobalPixel(locs[i]._location, zoom);

                g.x += tl.x * scale;
                g.y += tl.y * scale;
                r.push(g);
            }
        } else if (locs instanceof VELatLong) {
            r = Microsoft.Maps.SpatialMath.Tiles.locationToGlobalPixel(locs._location, zoom);

            r.x += tl.x * scale;
            r.y += tl.y * scale;
        }

        if (callback) {
            callback(r);
        } else {
            return r;
        }
    }

    public PixelToLatLong(locs: VEPixel): VELatLong {
        return VELatLong._fromLocation(<Microsoft.Maps.Location>this._map.tryPixelToLocation(locs._getPoint()));
    }

    public LoadMap(center?: VELatLong, zoom?: number, style?: VEMapStyle, fixed?: boolean, mode?: VEMapMode, showSwitch?: boolean, tileBuffer?: number, mapOptions?: VEMapOptions): void {
        var o: Microsoft.Maps.IMapLoadOptions = {
            center: (center)? center._location: null,
            zoom: zoom,
            credentials: this._key,
            allowInfoboxOverflow: true
        };

        if (style) {
            switch (style) {
                case VEMapStyle.Aerial:
                    o.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                    o.labelOverlay = Microsoft.Maps.LabelOverlay.hidden;
                    break;
                case VEMapStyle.Oblique:
                case VEMapStyle.Birdseye:
                    o.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                    o.labelOverlay = Microsoft.Maps.LabelOverlay.hidden;
                    break;
                case VEMapStyle.BirdseyeHybrid:
                    o.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                    break;
                case VEMapStyle.Hybrid:
                    o.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                    break;
                case VEMapStyle.Road:
                case VEMapStyle.Shaded:
                    o.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                    break;
                default:
                    break;
            }
        }

        if (mapOptions) {
            switch (mapOptions.BirdseyeOrientation) {
                case VEOrientation.North:
                    o.heading = 0;
                    break;
                case VEOrientation.South:
                    o.heading = 180;
                    break;
                case VEOrientation.East:
                    o.heading = 90;
                    break;
                case VEOrientation.West:
                    o.heading = 270;
                    break;
            }
        }

        this._map = new Microsoft.Maps.Map(this._rootElm, o);

        this._infobox = new Microsoft.Maps.Infobox(this._map.getCenter(), {
            showCloseButton: false,
            visible: false,
            maxHeight: 200,
            maxWidth: 320
        });
        this._infobox.setMap(this._map);

        var lastCenter = this._map.getCenter();
        var lastZoom = this._map.getZoom();
        var self = this;

        Microsoft.Maps.Events.addHandler(this._map, 'viewchange', (e) => {
            if (this._events['onchangeview']) {
                this._events['onchangeview'](self._fillEventArg(<Microsoft.Maps.IMouseEventArgs>e, 'onchangeview', self._map));
            }
        });

        Microsoft.Maps.Events.addHandler(this._map, 'viewchangestart', (e) => {
            if (self._events['onstartzoom']) {
                self._events['onstartzoom'](self._fillEventArg(<Microsoft.Maps.IMouseEventArgs>e, 'onstartzoom', self._map));
            }
            
            if (self._events['onstartpan']) {
                self._events['onstartpan'](self._fillEventArg(<Microsoft.Maps.IMouseEventArgs>e, 'onstartpan', self._map));
            }
        });

        Microsoft.Maps.Events.addHandler(this._map, 'viewchangeend', (e) => {
            if (self._events['onendzoom']) {
                self._events['onendzoom'](self._fillEventArg(<Microsoft.Maps.IMouseEventArgs>e, 'onendzoom', self._map));
            }
            
            if (self._events['onendpan']) {
                self._events['onendpan'](self._fillEventArg(<Microsoft.Maps.IMouseEventArgs>e, 'onendpan', self._map));
            }

            lastCenter = self._map.getCenter();
            lastZoom = self._map.getZoom();
        });

        Microsoft.Maps.Events.addHandler(this._map.entities, 'mouseover', (e) => {
            this._shapeHovered(e)
        });

        Microsoft.Maps.Events.addHandler(this._map.entities, 'mouseout', (e) => {
            this._infobox.setOptions({ visible: false });
        });

        this._rootElm.addEventListener('keydown', (e) => {
            if (self._events['onkeydown']) {
                e['eventName'] = 'onkeydown';
                e['mapStyle'] = self.GetMapStyle();
                e['zoomLevel'] = self.GetZoomLevel();
                self._events['onkeydown'](e);
            }
        }, false);

        this._rootElm.addEventListener('keypress', (e) => {
            if (self._events['onkeypress']) {
                e['eventName'] = 'onkeypress';
                e['mapStyle'] = self.GetMapStyle();
                e['zoomLevel'] = self.GetZoomLevel();
                self._events['onkeypress'](e);
            }
        }, false);

        this._rootElm.addEventListener('keyup', (e) => {
            if (self._events['onkeyup']) {
                e['eventName'] = 'onkeyup';
                e['mapStyle'] = self.GetMapStyle();
                e['zoomLevel'] = self.GetZoomLevel();
                self._events['onkeyup'](e);
            }
        }, false);


        if (this.onLoadMap) {
            this.onLoadMap();
        }
    }

    public LoadTraffic(): void {
        if (!this._trafficManager) {
            var self = this;
            Microsoft.Maps.loadModule('Microsoft.Maps.Traffic', () => {
                self._trafficManager = new Microsoft.Maps.Traffic.TrafficManager(self._map);
                self._trafficManager.show();
            });
        } else {
            this._trafficManager.show();
        }
    }

    public Resize(width: number, height: number): void {
        this._rootElm.style.width = width + 'px';
        this._rootElm.style.height = height + 'px';

        if (this._events['resize']) {
            this._events['resize']();
        }
    }

    public SetBirdseyeOrientation(or: VEOrientation): void {
        var o: Microsoft.Maps.IViewOptions = {};

        switch (or) {
            case VEOrientation.North:
                o.heading = 0;
                break;
            case VEOrientation.South:
                o.heading = 180;
                break;
            case VEOrientation.East:
                o.heading = 90;
                break;
            case VEOrientation.West:
                o.heading = 270;
                break;
        }

        this._map.setView(o);
    }

    public SetCenterAndZoom(c: VELatLong, zoom: number): void {
        this._map.setView({ center: c._location, zoom: zoom });
    }

    public ShowInfoBox(shape: VEShape, anchor: VELatLong | VEPixel, offset: VEPixel): void {
        var loc = null;

        if (anchor) {
            if (anchor instanceof VEPixel) {
                loc = <Microsoft.Maps.Location>this._map.tryPixelToLocation(anchor._getPoint());
            } else {
                loc = anchor._location;
            }
        } else if (shape._shape instanceof Microsoft.Maps.Pushpin) {
            loc = (<Microsoft.Maps.Pushpin>shape._shape).getLocation();
        } else {
            loc = Microsoft.Maps.SpatialMath.Geometry.centroid(shape._shape);
        }

        var o: Microsoft.Maps.IInfoboxOptions = {
            title: shape._shape.metadata.title || '',
            description: shape._shape.metadata.description || '',
            location: loc,
            offset: (offset) ? offset._getPoint() : shape._infoboxOffset,
            visible: true
        };

        this._infobox.setOptions(o);
    }

    public ShowTrafficLegend(): void {
        if (this._trafficManager) {
            this._trafficManager.showLegend();
        }
    }

    public ZoomIn(): void {
        this._map.setView({ zoom: this._map.getZoom() + 1});
    }

    public ZoomOut(): void {
        this._map.setView({ zoom: this._map.getZoom() - 1 });
    }
    
    public GetLeft(): number {
        return this._rootElm.clientLeft;
    }

    public GetTop(): number {
        return this._rootElm.clientTop;
    }

    private _searchManager: Microsoft.Maps.Search.SearchManager;

    /**
     * Finds points of interests
     * @param what The business name, category, or other item for which the search is conducted. This parameter must be supplied for a pushpin to be included in the results.
     * @param where The address or place name of the area for which the search is conducted.
     * @param findType Not Supported
     * @param shapeLayer A reference to the VEShapeLayer Class object that contain the pins that result from this search if a what parameter is specified. Optional. If the shape layer is not specified, the pins are added to the base map layer. If the reference is not a valid VEShapeLayer reference, an exception is thrown.
     * @param startIndex The beginning index of the results returned. Optional. Default is 0.
     * @param numberOfResults The number of results to be returned, starting at startIndex. The default is 10, the minimum is 1, and the maximum is 20.
     * @param showResults A Boolean value that specifies whether the resulting pushpins are visible. Optional. Default is true.
     * @param createResults Not Supported
     * @param useDefaultDisambiguation Not Supported
     * @param setBestMapView A Boolean value that specifies whether the map control moves the view to the first location match. If true, the map control moves the view. Optional. Default is true.
     * @param callback The name of the function that the server calls with the search results.
     */
    public Find(what: string,
        where: string,
        findType: VEFindType,
        shapeLayer: VEShapeLayer,
        startIndex: number = 0,
        numberOfResults: number = 10,
        showResults: boolean = true,
        createResults: boolean,
        useDefaultDisambiguation: boolean,
        setBestMapView: boolean = true,
        callback: (layer?: VEShapeLayer, results?: VEFindResult[], places?: VEPlace[], moreResults?: boolean, error?: string) => void): void {

        if (!this._searchManager || !Microsoft.Maps.SpatialDataService) {
            Microsoft.Maps.loadModule(['Microsoft.Maps.Search', 'Microsoft.Maps.SpatialDataService'], () => {
                this._searchManager = new Microsoft.Maps.Search.SearchManager(this._map);
            });
            return;
        }

        if (where) {
            this._searchManager.geocode({
                where: where,
                callback: (r) => {
                    if (r && r.results && r.results.length > 0) {
                        this._performPoiSearch(what, r.results[0].location, shapeLayer, startIndex, numberOfResults, showResults, createResults, setBestMapView, this._convertPlaceResults(r.results), callback);
                    } else if (callback) {
                        callback(null);
                    }
                }
            });
        } else if (what) {
            this._searchManager.reverseGeocode({
                location: this._map.getCenter(),
                callback: (r) => {
                    this._performPoiSearch(what, this._map.getCenter(), shapeLayer, startIndex, numberOfResults, showResults, createResults, setBestMapView, this._convertPlaceResults([r]), callback);
                }
            });
        } else if (callback) {
            callback(null);
        }
    }
    
    private _navteqNA = 'https://spatial.virtualearth.net/REST/v1/data/f22876ec257b474b82fe2ffcb8393150/NavteqNA/NavteqPOIs';
    private _navteqEU = 'https://spatial.virtualearth.net/REST/v1/data/c2ae584bbccc4916a0acf75d1e6947b4/NavteqEU/NavteqPOIs';
    private _poiTypes = { '2084': 'Winery', '3578': 'ATM', '4013': 'Train Station', '4100': 'Commuter Rail Station', '4170': 'Bus Station', '4444': 'Named Place', '4482': 'Ferry Terminal', '4493': 'Marina', '4580': 'Public Sports Airport', '4581': 'Airport', '5000': 'Business Facility', '5400': 'Grocery Store', '5511': 'Auto Dealerships', '5512': 'Auto Dealership-Used Cars', '5540': 'Petrol/Gasoline Station', '5571': 'Motorcycle Dealership', '5800': 'Restaurant', '5813': 'Nightlife', '5999': 'Historical Monument', '6000': 'Bank', '6512': 'Shopping', '7011': 'Hotel', '7012': 'Ski Resort', '7013': 'Other Accommodation', '7014': 'Ski Lift', '7389': 'Tourist Information', '7510': 'Rental Car Agency', '7520': 'Parking Lot', '7521': 'Parking Garage/House', '7522': 'Park & Ride', '7538': 'Auto Service & Maintenance', '7832': 'Cinema', '7897': 'Rest Area', '7929': 'Performing Arts', '7933': 'Bowling Centre', '7940': 'Sports Complex', '7947': 'Park/Recreation Area', '7985': 'Casino', '7990': 'Convention/Exhibition Centre', '7992': 'Golf Course', '7994': 'Civic/Community Centre', '7996': 'Amusement Park', '7997': 'Sports Centre', '7998': 'Ice Skating Rink', '7999': 'Tourist Attraction', '8060': 'Hospital', '8200': 'Higher Education', '8211': 'School', '8231': 'Library', '8410': 'Museum', '8699': 'Automobile Club', '9121': 'City Hall', '9211': 'Court House', '9221': 'Police Station', '9517': 'Campground', '9522': 'Truck Stop/Plaza', '9525': 'Government Office', '9530': 'Post Office', '9535': 'Convenience Store', '9537': 'Clothing Store', '9545': 'Department Store', '9560': 'Home Specialty Store', '9565': 'Pharmacy', '9567': 'Specialty Store', '9568': 'Sporting Goods Store', '9583': 'Medical Service', '9590': 'Residential Area/Building', '9591': 'Cemetery', '9592': 'Highway Exit', '9593': 'Transportation Service', '9710': 'Weigh Station', '9714': 'Cargo Centre', '9715': 'Military Base', '9718': 'Animal Park', '9719': 'Truck Dealership', '9986': 'Home Improvement & Hardware Store', '9987': 'Consumer Electronics Store', '9988': 'Office Supply & Services Store', '9991': 'Industrial Zone', '9992': 'Place of Worship', '9993': 'Embassy', '9994': 'County Council', '9995': 'Bookstore', '9996': 'Coffee Shop', '9998': 'Hamlet', '9999': 'Border Crossing' };

    private _performPoiSearch(
        what: string,
        loc: Microsoft.Maps.Location,
        shapeLayer: VEShapeLayer,
        startIndex: number,
        numberOfResults: number,
        showResults: boolean = true,
        createResults: boolean,
        setBestMapView: boolean,
        places: VEPlace[],
        callback: (layer?: VEShapeLayer, results?: VEFindResult[], places?: VEPlace[], moreResults?: boolean, error?: string) => void): void {

        what = what.toLowerCase();

        var self = this;

        Microsoft.Maps.SpatialDataService.QueryAPIManager.search({
            skip: startIndex,
            top: 250,
            queryUrl: (loc.longitude < -6) ? this._navteqNA : this._navteqEU,
            inlineCount: true,
            spatialFilter: {
                spatialFilterType: 'nearby',
                location: loc,
                radius: 25
            },
            filter: this._createPoiFilter(what)
        }, this._map, (r, inlineCount) => {

            if (r && r.length > 0) {
                var results: VEFindResult[] = [];
                var shapes: VEShape[] = [];
                var locs: Microsoft.Maps.Location[] = []
                
                for (var i = 0; i < r.length; i++) {
                    if (what) {
                        //Filter results client side.
                        if (this._fuzzyPoiMatch(what, r[i].metadata)){
                            var fr = self._convertFindResult(r[i]);
                            results.push(fr);
                            shapes.push(fr.Shape);
                            locs.push((<Microsoft.Maps.Pushpin>fr.Shape._shape).getLocation());
                        }
                    } else {
                        var fr = self._convertFindResult(r[i]);
                        results.push(fr);
                        shapes.push(fr.Shape);
                        locs.push((<Microsoft.Maps.Pushpin>fr.Shape._shape).getLocation());
                    }

                    if (results.length >= numberOfResults) {
                        break;
                    }
                }                

                if (showResults && shapes.length > 0) {
                    if (shapeLayer) {
                        shapeLayer.AddShape(shapes);
                    } else {
                        self.AddShape(shapes);
                    }
                }

                if (setBestMapView) {
                    self._map.setView({
                        bounds: Microsoft.Maps.LocationRect.fromLocations(locs),
                        padding: 30
                    });
                }

                if (callback) {
                    var hasMore = (startIndex + numberOfResults) < inlineCount;

                    callback(shapeLayer, results, places, hasMore, null);
                }
            } else if (callback) {
                callback(null);
            }
        });
    }

    private _fuzzyPoiMatch(what: string, metadata: any): boolean {
        return (metadata.Name && metadata.Name.toLowerCase().indexOf(what) > -1) ||
            (metadata.DisplayName && metadata.DisplayName.toLowerCase().indexOf(what) > -1) ||
            (metadata.EntityTypeID && this._poiTypes[metadata.EntityTypeID] && this._poiTypes[metadata.EntityTypeID].toLowerCase().indexOf(what) > -1);
    }

    private _createPoiFilter(what: string): Microsoft.Maps.SpatialDataService.Filter {
        if (what) {
            var keys = Object.keys(this._poiTypes);
            var ids = [];

            for (var i = 0; i < keys.length; i++) {
                if (this._poiTypes[keys[i]].toLowerCase().indexOf(what) > -1) {
                    ids.push(keys[i]);
                }
            }

            if (ids.length > 0) {
                return new Microsoft.Maps.SpatialDataService.Filter('EntityTypeID', Microsoft.Maps.SpatialDataService.FilterCompareOperator.isIn, ids);
            }
        }
        return null;
    }

    private _phoneRx = /([0-9]{3}-)([0-9]{3})([0-9]{4})/gi;

    private _convertFindResult(shape: Microsoft.Maps.IPrimitive): VEFindResult {
        var s = VEShape._fromPrimitive(shape);

        var m = s._shape.metadata;

        var phone = m.Phone || '';        

        if (this._phoneRx.test(m.Phone)) {
            phone = m.Phone.replace(this._phoneRx, '$1$2-$3');
        }

        var desc =  [m.AddressLine, '<br/>', m.Locality, ', ', m.AdminDistrict, '<br/>', m.PostalCode];

        if (phone !== '') {
            desc.push('<br/><br/><div style="min-width:200px;">Phone: ', phone, '</div>');
        }

        s._shape.metadata.title = shape.metadata.DisplayName;
        s._shape.metadata.description = desc.join('');

        return {
            Shape:s,
            Name: m.DisplayName,
            Description: desc.join(''),
            LatLong: VELatLong._fromLocation((<Microsoft.Maps.Pushpin>shape).getLocation()),
            IsSponsored: false,
            FindType: VEFindType.Businesses,
            Phone: m.Phone
        };
    }

    public FindLocations(veLatLong: VELatLong, callback: (r: VEPlace[]) => void): void {
        if (!this._searchManager) {
            Microsoft.Maps.loadModule('Microsoft.Maps.Search', () => {
                this._searchManager = new Microsoft.Maps.Search.SearchManager(this._map);
            });
            return;
        }

        if (callback) {
            this._searchManager.reverseGeocode({
                location: veLatLong._location,
                callback: (r) => {
                    callback(this._convertPlaceResults([r]));
                }
            });
        }
    }

    public Geocode(query: string, callback: (layer: VEShapeLayer, results: VEFindResult[], places: VEPlace[], moreResults: boolean, error: string) => void, options?: VEGeocodeOptions): void {
        if (!this._searchManager) {
            Microsoft.Maps.loadModule('Microsoft.Maps.Search', () => {
                this._searchManager = new Microsoft.Maps.Search.SearchManager(this._map);
            });
            return;
        }

        if (callback) {
            this._searchManager.geocode({
                where: query,
                callback: (r) => {
                    var results = this._convertPlaceResults(r.results);
                    var setMapView = true;

                    if (options && typeof options.SetBestMapView === 'boolean') {
                        setMapView = options.SetBestMapView;
                    }

                    if (setMapView && results && results.length > 0) {
                        this._map.setView({
                            bounds: r.results[0].bestView
                        });
                    }

                    callback(null, null, results, false, null);
                }
            });
        }
    }

    private _directionsManager: Microsoft.Maps.Directions.DirectionsManager;

    private _waypointIcon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="52" height="49.4" viewBox="0 0 37 35" xml:space="preserve"><circle cx="32" cy="30" r="4" style="stroke-width:2;stroke:#ffffff;fill:#000000;"/><polygon style="fill:rgba(0,0,0,0.5)" points="18,1 32,30 18,18 18,1"/><rect x="2" y="2" width="15" height="15" style="stroke-width:2;stroke:#000000;fill:{color}"/><text x="9" y="13" style="font-size:11px;font-family:arial;fill:#ffffff;" text-anchor="middle">{text}</text></svg>';

    public GetDirections(locations: (string | VELatLong)[], options: VERouteOptions): void {
        options = options || new VERouteOptions();

        if (!locations || locations.length > 25) {
            options.RouteCallback(null);
            return
        }

        if (!this._directionsManager) {
            Microsoft.Maps.loadModule('Microsoft.Maps.Directions', () => {
                this._directionsManager = new Microsoft.Maps.Directions.DirectionsManager(this._map);
                Microsoft.Maps.Events.addHandler(this._directionsManager, 'directionsUpdated', (e: Microsoft.Maps.Directions.IDirectionsEventArgs) => {
                    if (options.RouteCallback && e.route && e.route.length > 0) {
                        var r = e.route[0];
                        var legs = [];
                        var idx = 0;

                        var waypointCnt = 0;
                        var waypointLabel = "ABCDEFGHIJKLMNOPQRSTYVWXYZ";
                        var wp = [];
                        var steps = [];

                        for (var i = 0; i < r.routeLegs.length; i++) {
                            var l = this._convertRouteLeg(r.routeLegs[i], idx, options.UseTraffic);   
                            idx = l.Itinerary._idx;                       
                            legs.push(l);
                            
                            if (options.DrawRoute) {

                                for (var j = 0; j < l.Itinerary.Items.length; j++) {
                                    if (j == 0) {
                                        l.Itinerary.Items[j].Shape._infoboxOffset = new Microsoft.Maps.Point(-30, 25);

                                        if (i == 0) {
                                            //Start                                           
                                            (<Microsoft.Maps.Pushpin>l.Itinerary.Items[j].Shape._shape).setOptions({
                                                icon: this._waypointIcon,
                                                anchor: new Microsoft.Maps.Point(42, 39),
                                                color: '#008f09',
                                                text: 'A'
                                            });
                                            wp.push(l.Itinerary.Items[j].Shape._shape);
                                            waypointCnt++;
                                        } else {
                                            //Waypoint

                                            (<Microsoft.Maps.Pushpin>l.Itinerary.Items[j].Shape._shape).setOptions({
                                                icon: this._waypointIcon,
                                                anchor: new Microsoft.Maps.Point(42, 39),
                                                color: '#737373',
                                                text: waypointLabel[waypointCnt]
                                            });
                                            wp.push(l.Itinerary.Items[j].Shape._shape);
                                            waypointCnt++;
                                        }
                                    } else if (i == r.routeLegs.length - 1 && j == l.Itinerary.Items.length - 1) {
                                        //End
                                        l.Itinerary.Items[j].Shape._infoboxOffset = new Microsoft.Maps.Point(-30, 25);

                                        (<Microsoft.Maps.Pushpin>l.Itinerary.Items[j].Shape._shape).setOptions({
                                            icon: this._waypointIcon,
                                            anchor: new Microsoft.Maps.Point(42, 39),
                                            color: '#d60000',
                                            text: waypointLabel[waypointCnt]
                                        });
                                        wp.push(l.Itinerary.Items[j].Shape._shape);
                                        waypointCnt++;
                                    } else {
                                        steps.push(l.Itinerary.Items[j].Shape._shape);
                                    }
                                }
                            }
                        }

                        wp.reverse();
                        this._map.entities.push(wp);
                        this._map.entities.push(steps);

                        var points = [];

                        for (var i = 0; i < r.routePath.length; i++) {
                            points.push(VELatLong._fromLocation(r.routePath[i]));
                        }

                        var route: VERoute = {
                            Distance: e.routeSummary[0].distance,
                            Time: (options.UseTraffic) ? e.routeSummary[0].timeWithTraffic : e.routeSummary[0].time,
                            RouteLegs: legs,
                            ShapePoints: points
                        };

                        options.RouteCallback(route);
                    }
                });

                this.GetDirections(locations, options);
            });

            return;
        } else {
            this._directionsManager.clearAll();
        }

        for (var i = 0; i < locations.length; i++) {
            if (locations[i] instanceof VELatLong) {
                this._directionsManager.addWaypoint(new Microsoft.Maps.Directions.Waypoint({
                    location: (<VELatLong>locations[i])._location
                }));
            } else {
                this._directionsManager.addWaypoint(new Microsoft.Maps.Directions.Waypoint({
                    address: <string>locations[i]
                }));
            }
        }

        var optimize: Microsoft.Maps.Directions.RouteOptimization;

        if (options.RouteOptimize == VERouteOptimize.MinimizeDistance) {
            optimize = Microsoft.Maps.Directions.RouteOptimization.shortestDistance;
        } else {
            if (options.UseTraffic) {
                optimize = Microsoft.Maps.Directions.RouteOptimization.timeWithTraffic;
            } else {
                optimize = Microsoft.Maps.Directions.RouteOptimization.shortestTime;
            }
        }

        this._directionsManager.setRequestOptions({
            distanceUnit: (options.DistanceUnit == VERouteDistanceUnit.Mile) ? Microsoft.Maps.Directions.DistanceUnit.miles : Microsoft.Maps.Directions.DistanceUnit.km,
            routeMode: (options.RouteMode == VERouteMode.Driving) ? Microsoft.Maps.Directions.RouteMode.driving : Microsoft.Maps.Directions.RouteMode.walking,
            routeOptimization: optimize,
            routeDraggable: false,
            maxRoutes: 1
        });
        
        var lineOptions = <Microsoft.Maps.IPolylineOptions>{
            strokeColor: options.RouteColor._getV8Color(),
            strokeThickness: options.RouteWeight,
            visible: options.DrawRoute
        };

        this._directionsManager.setRenderOptions({
            autoUpdateMapView: options.SetBestMapView,
            drivingPolylineOptions: lineOptions,
            walkingPolylineOptions: lineOptions,
            firstWaypointPushpinOptions: {
                visible: false
            },
            lastWaypointPushpinOptions: {
                visible: false
            },
            waypointPushpinOptions: {
                visible: false
            }
        });

        this._directionsManager.calculateDirections();
    }

    private _convertRouteLeg(leg: Microsoft.Maps.Directions.IRouteLeg, idx: number, useTraffic: boolean): VERouteLeg {
        return <VERouteLeg>{
            Distance: leg.summary.distance,
            Time: (useTraffic) ? leg.summary.timeWithTraffic : leg.summary.time,
            Itinerary: this._convertItinerary(leg, idx, useTraffic)
        };
    }

    private _convertItinerary(leg: Microsoft.Maps.Directions.IRouteLeg, idx: number, useTraffic: boolean): VERouteItinerary {
        var items: VERouteItineraryItem[] = [];

        for (var i = 0; i < leg.itineraryItems.length; i++) {
            idx++;
            items.push(this._convertItineraryItem(leg.itineraryItems[i], idx));
        }

        return <VERouteItinerary>{
            Items: items,
            _idx: idx
        };
    }

    private _convertItineraryItem(item: Microsoft.Maps.Directions.IDirectionsStep, idx: number): VERouteItineraryItem {
        var hints: VERouteHint[] = [];
        var warnings: VERouteWarning[] = [];

        if (item.preIntersectionHints) {
            for (var i = 0; i < item.preIntersectionHints.length; i++) {
                hints.push({
                    Text: item.preIntersectionHints[i],
                    Type: VERouteHintType.PreviousIntersection
                });
            }
        }

        if (item.postIntersectionHints) {
            for (var i = 0; i < item.postIntersectionHints.length; i++) {
                hints.push({
                    Text: item.postIntersectionHints[i],
                    Type: VERouteHintType.NextIntersection
                });
            }
        }

        if (item.warnings) {
            for (var i = 0; i < item.warnings.length; i++) {
                var s;

                switch (item.warnings[i].severity) {
                    //Low Impact, Minor, Moderate, Serious or None.
                    case 'Minor':
                        s = VERouteWarningSeverity.Minor;
                        break;
                    case "Low Impact":
                    case "LowImpact":
                        s = VERouteWarningSeverity.LowImpact;
                        break;
                    case "Moderate":
                        s = VERouteWarningSeverity.Moderate;
                        break;
                    case "Serious":
                        s = VERouteWarningSeverity.Serious;
                        break;
                    case "None":
                        s = VERouteWarningSeverity.None;
                        break;
                    default:
                        var t = item.warnings[i].severity;
                        break;
                }

                warnings.push({
                    Text: item.warnings[i].text,
                    Severity: s
                });
            }
        }

        var shape = new VEShape(VEShapeType.Pushpin, VELatLong._fromLocation(item.coordinate));
        shape._shape.metadata.isRoute = true;
        (<Microsoft.Maps.Pushpin>shape._shape).setOptions({
            icon: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="18" height="17" viewBox="0 0 36 34" xml:space="preserve"><circle cx="16" cy="16" r="14" style="fill:{color}"/><text x="16" y="21" style="font-size:16px;font-family:arial;fill:#ffffff;" text-anchor="middle">{text}</text></svg>',
            anchor: new Microsoft.Maps.Point(9, 9),
            color: '#d60000',
            text: idx + ''
        });
        shape.SetDescription(item.formattedText);

        return <VERouteItineraryItem>{
            Distance: parseFloat(item.distance),
            Time: item.durationInSeconds,
            LatLong: VELatLong._fromLocation(item.coordinate),
            Text: item.formattedText,
            Shape: shape,
            Hints: hints,
            Warnings: warnings
        };
    }

    public DeleteRoute(): void {
        if (this._directionsManager) {
            this._directionsManager.clearAll();

            var remove = [];
            var s;

            for (var i = 0; i < this._map.entities.getLength(); i++) {
                s = this._map.entities.get(i);
                if (s.metadata && s.metadata.isRoute) {
                    remove.push(i);
                }
            }

            for (var i = remove.length - 1; i >= 0; i--) {
                this._map.entities.removeAt(remove[i]);
            }
        }
    }

    private _connectingWords = [" in ", " near ", " around ", " by "]

    public Search(query: string, callback: (layer?: VEShapeLayer, results?: VEFindResult[], places?: VEPlace[], moreResults?: boolean, error?: string) => void, options: VESearchOptions): void {
        if (query && callback) {
            options = options || new VESearchOptions();

            var keys = Object.keys(this._poiTypes);
            var isPoi: boolean;

            query = query.toLowerCase();

            if (query.indexOf('find ') === 0 || query.indexOf('get ') === 0) {
                query = query.replace('find ', '').replace('get ', '');
            }

            for (var i = 0; i < keys.length; i++) {
                if (this._poiTypes[keys[i]].toLowerCase().indexOf(query) > -1) {
                    isPoi = true;
                    break;
                }
            }

            if (isPoi) {
                this.Find(query, null, null, options.ShapeLayer, options.StartIndex, options.NumberOfResults, options.ShowResults, options.CreateResults, null, options.SetBestMapView, callback);
                return;
            }

            for (var i = 0; i < this._connectingWords.length; i++) {
                if (query.indexOf(this._connectingWords[i]) > 0) {
                    var vals = query.split(this._connectingWords[i]);

                    if (vals.length >= 2) {
                        this.Find(vals[0], vals[1], null, null, 0, 20, true, true, null, true, callback);
                        return;
                    } else if (vals.length == 1) {
                        this.Find(vals[0], null, null, null, 0, 20, true, true, null, true, callback);
                        return;
                    }
                }
            }

            var o = new VEGeocodeOptions();
            o.SetBestMapView = options.SetBestMapView;

            //Try geocoding.
            this.Geocode(query, callback, o);
        }
    }

    public ImportShapeLayerData(shapeSource: VEShapeSourceSpecification, callback: (layer: VEShapeLayer) => void, setBestView: boolean = true): void {
        if (shapeSource && shapeSource.LayerSource) {
            Microsoft.Maps.loadModule('Microsoft.Maps.GeoXml', () => {
                if (!shapeSource.Layer) {
                    shapeSource.Layer = new VEShapeLayer();
                }

                Microsoft.Maps.GeoXml.readFromUrl(shapeSource.LayerSource, null, (data) => {
                    if (data) {
                        var shapes = [];

                        for (var i = 0; i < data.shapes.length; i++) {
                            shapes.push(VEShape._fromPrimitive(data.shapes[i]));
                        }

                        for (var i = 0; i < data.layers.length; i++) {
                            if (data.layers[i] instanceof Microsoft.Maps.Layer) {
                                var p = (<Microsoft.Maps.Layer>data.layers[i]).getPrimitives();

                                for (var j = 0; j < p.length; j++) {
                                    shapes.push(VEShape._fromPrimitive(p[j]));
                                }
                            }
                        }

                        shapeSource.Layer.AddShape(shapes);
                        
                        if (!shapeSource.Layer._map) {
                            this.AddShapeLayer(shapeSource.Layer);
                        }

                        if (setBestView) {
                            this._map.setView({
                                bounds: data.summary.bounds,
                                padding: 30
                            });
                        }

                        if (callback) {
                            callback(shapeSource.Layer);
                        }
                    }
                });
            });
        }
    }

    /////////////////////
    // Private functions
    ////////////////////

    private _convertPlaceResults(results: Microsoft.Maps.Search.IPlaceResult[]): VEPlace[] {
        var locs: VEPlace[] = [];

        for (var i = 0; i < results.length; i++) {

            var p = VELocationPrecision.Interpolated;
            var gl: VEGeocodeLocation[] = [];

            for (var j = 0; j < results[i].locations.length; j++) {
                gl.push({
                    LatLong: VELatLong._fromLocation(results[i].locations[j]),
                    Precision: this._convertLocationPrecision(results[i].locations[j].precision)
                });

                if (gl[j].Precision == VELocationPrecision.Rooftop) {
                    p = VELocationPrecision.Rooftop;
                }
            }

            var confidence;

            switch (results[i].matchConfidence) {
                case Microsoft.Maps.Search.MatchConfidence.high:
                    matchCode = VEMatchConfidence.High;
                    break;
                case Microsoft.Maps.Search.MatchConfidence.low:
                    matchCode = VEMatchConfidence.Low;
                    break;
                case Microsoft.Maps.Search.MatchConfidence.medium:
                    matchCode = VEMatchConfidence.Medium;
                    break;
                default:
                    break;
            }

            var matchCode;

            switch (results[i].matchCode) {
                case Microsoft.Maps.Search.MatchCode.ambiguous:
                    matchCode = VEMatchCode.Ambiguous;
                    break;
                case Microsoft.Maps.Search.MatchCode.good:
                    matchCode = VEMatchCode.Good;
                    break;
                case Microsoft.Maps.Search.MatchCode.modified:
                    matchCode = VEMatchCode.Modified;
                    break;
                case Microsoft.Maps.Search.MatchCode.none:
                    matchCode = VEMatchCode.None;
                    break;
                case Microsoft.Maps.Search.MatchCode.upHierarchy:
                    matchCode = VEMatchCode.UpHierarchy;
                    break;
                default:
                    break;
            }

            var place: VEPlace = {
                LatLong: VELatLong._fromLocation(results[i].location),
                LatLongRect: VELatLongRectangle._fromLocationRect(results[i].bestView),
                Locations: gl,
                Name: results[i].name,
                Precision: p,
                MathCode: matchCode,
                MatchConfidence: confidence
            };

            locs.push(place);
        }

        if (locs.length == 0) {
            locs = null;
        }

        return locs;
    }

    private _convertLocationPrecision(precision: string): VELocationPrecision {
        if (precision === 'Rooftop' || precision === 'Parcel') {
            return VELocationPrecision.Rooftop;
        }

        return VELocationPrecision.Interpolated;
    }

    private _updateEvent(eventName: string, callback?: (args: VEEvent) => void): void {
        if (callback) {
            var v7Name = this._eventNamesV8ToV7[eventName];

            this._events[eventName] = (a: Microsoft.Maps.IMouseEventArgs) => {
                var r = callback(this._fillEventArg(a, v7Name, a.target));

                if (eventName === 'onmouseover') {
                    //User is returning false for mouse over event and trying to disable default behaviour which is to show infobox.
                    this._disableInfoboxHover = !r;
                }
            };
            
            if (this._eventHandlers[eventName]) {
                Microsoft.Maps.Events.removeHandler(this._eventHandlers[eventName]);
            }

            this._eventHandlers[eventName] = Microsoft.Maps.Events.addHandler(this._map, eventName, this._events[eventName]);
        } else {
            this._events[eventName] = null;
            if (this._eventHandlers[eventName]) {
                Microsoft.Maps.Events.removeHandler(this._eventHandlers[eventName]);
            }
        }
    }

    private _disableInfoboxHover: boolean;
    private _lastMousedUpShapeId: string;
    private _lastMouseUpTimer: number;
    private _lastMouseButtonLeft: boolean;
    private _lastMouseButtonRight: boolean;

    private _fillEventArg(arg: Microsoft.Maps.IMouseEventArgs, eventName: string, shape: Microsoft.Maps.Map | Microsoft.Maps.IPrimitive): VEEvent {
        arg = arg || <Microsoft.Maps.IMouseEventArgs>{};

        var x = (arg.getX)? arg.getX(): 0;
        var y = (arg.getY) ? arg.getY() : 0;

        var e: VEEvent = {
            leftMouseButton: arg.isPrimary,
            rightMouseButton: arg.isSecondary,
            clientX: x,
            clientY: y,
            screenX: x + this.GetLeft(),
            screenY: y + this.GetTop(),
            mapX: x,
            mapY: y,
            latLong: (arg.location)? VELatLong._fromLocation(arg.location): null,
            mapStyle: this._map.getMapTypeId().toString(),
            zoomLevel: this._map.getZoom(),
            eventName: eventName
        };

        if (eventName === 'onclick' || eventName === 'ondoubleclick') {
            e.elementID = this._lastMousedUpShapeId;
            e.leftMouseButton = this._lastMouseButtonLeft;
            e.rightMouseButton = this._lastMouseButtonRight;
        }

        if (!e.elementID) {
            if (arg && arg.primitive && arg.primitive.metadata) {
                e.elementID = arg.primitive.metadata.id;
            }

            if (shape && !e.elementID) {
                if ((<Microsoft.Maps.IPrimitive>shape).metadata) {
                    e.elementID = (<Microsoft.Maps.IPrimitive>shape).metadata.id;
                } else if (shape instanceof Microsoft.Maps.Map) {
                    e.elementID = this._rootElm.id;
                }
            }
        }

        if (eventName === 'onmouseup') {
            if (this._lastMouseUpTimer) {
                clearTimeout(this._lastMouseUpTimer);
            }

            this._lastMousedUpShapeId = e.elementID;
            this._lastMouseButtonLeft = arg.isPrimary;
            this._lastMouseButtonRight = arg.isSecondary;

            this._lastMouseUpTimer = setTimeout(() => {
                this._lastMousedUpShapeId = null;
                this._lastMouseButtonLeft = null;
                this._lastMouseButtonRight = null;
                this._lastMouseUpTimer = null;
            }, 1);
        }
        
        if (eventName === 'onmouseout') {
            this._infobox.setOptions({ visible: false });
        }
        
        return e;
    }
    
    public _shapeHovered(e) {
        if (!this._disableInfoboxHover && (e.primitive.metadata.title || e.primitive.metadata.description)) {
            this._infobox.setOptions({
                location: (e.primitive instanceof Microsoft.Maps.Pushpin) ? (<Microsoft.Maps.Pushpin>e.primitive).getLocation() : Microsoft.Maps.SpatialMath.Geometry.centroid(e.primitive),
                title: e.primitive.metadata.title || '',
                description: e.primitive.metadata.description || '',
                offset: (e.primitive.metadata.parent && e.primitive.metadata.parent._infoboxOffset) ? e.primitive.metadata.parent._infoboxOffset : null,
                visible: true
            });
        }
    }

    /////////////////////
    //Not Supported
    ////////////////////

    public AddControl(): void { }
    public AddCustomLayer(): void { }
    public ClearInfoBoxStyles(): void { }
    public DeleteControl(): void { }
    public EnableShapeDisplayThreshold(): void { }
    public EndContinuousPan(): void { }   
    public GetAltitude(): any { return null; }
    public GetBirdseyeScene(): any { return null; }
    public GetImageryMetadata(): any { return null; }
    public GetPitch(): number { return 0; }
    public GetRoute(): any { return null; }
    public Hide3DNavigationControl(): void { }
    public HideControl(): void { }
    public HideDashboard(): void { }
    public HideFindControl(): void { }
    public HideMiniMap(): void {}
    public HideScalebar(): void { }
    public Import3DModel(): void { }
    public IsBirdseyeAvailable(): boolean {  return false; }
    public PanToLatLong(): void { }
    public RemoveCustomLayer(): void { }
    public SetAltitude(): void { }
    public SetBirdseyeScene(): void { }
    public SetDashboardSize(): void { }
    public SetDefaultInfoboxStyles(): void { }
    public SetFailedShapeRequest(): void { }
    public SetMouseWheelZoomToCenter(): void { }
    public SetPitch(): void { }
    public SetPrintOptions(): void { }
    public SetScaleBarDistanceUnit(): void { }
    public SetShapeAccuracy(): void { }
    public SetShapesAccuracyRequestLimit(): void { }
    public SetTileBuffer(): void { }
    public SetTrafficLegendText(): void { }
    public Show3DBirdseye(): void { }
    public Show3DNavigationControl(): void { }
    public ShowControl(): void { }
    public ShowDashboard(): void { }
    public ShowDisambiguationDialog(): void { }
    public ShowFindControl(): void { }
    public ShowMessage(): void { }
    public ShowMiniMap(): void { }
    public ShowScaleBar(): void { }
    public StartContinuousPan(): void { }
    public Pan(): void { }
}

interface VEPlace {
    LatLong: VELatLong;
    LatLongRect: VELatLongRectangle;
    Locations: VEGeocodeLocation[];
    Name: string;
    MathCode: VEMatchCode;
    MatchConfidence: VEMatchConfidence;
    Precision: VELocationPrecision;
}

class VEGeocodeOptions {
    public SetBestMapView: boolean;

    //Not supported
    public UseDefaultDisambiguation: boolean;
}

interface VEGeocodeLocation {
    LatLong: VELatLong,
    Precision: VELocationPrecision
}

enum VEMatchCode { None, Good, Ambiguous, UpHierarchy, Modified }
enum VEMatchConfidence { High, Medium, Low }
enum VELocationPrecision { Interpolated, Rooftop }
enum VEFindType { Businesses }

interface VEFindResult {
    Shape?: VEShape;

    Name: string;

    Description?: string;

    FindType?: VEFindType;

    IsSponsored?: boolean;

    LatLong: VELatLong;

    Phone?: string;
}

class VERouteOptions {
    public DistanceUnit: VERouteDistanceUnit = VERouteDistanceUnit.Mile;
    public DrawRoute: boolean = true;
    public RouteCallback: (r: VERoute) => void;
    public RouteColor: VEColor = new VEColor(0, 169, 235, 0.7);
    public RouteMode: VERouteMode = VERouteMode.Driving;
    public RouteOptimize: VERouteOptimize = VERouteOptimize.MinimizeTime;
    public RouteWeight: number = 6;
    public SetBestMapView: boolean = true;
    public UseTraffic: boolean = true;
    
    //Not Supported: RouteZIndex, ShowDisambiguation, ShowErrorMessage, UseMWS, 
}

enum VERouteDistanceUnit { Mile, Kilometer }
enum VERouteMode { Driving, Walking }
enum VERouteOptimize { MinimizeTime, MinimizeDistance }

interface VERoute {
    Distance: number;
    RouteLegs: VERouteLeg[];
    ShapePoints: VELatLong[];
    Time: number;
}

interface VERouteLeg {
    Distance: number;
    Itinerary: VERouteItinerary;
    Time: number;
}

interface VERouteItinerary {
    Items: VERouteItineraryItem[];
    _idx: number;
}

interface VERouteItineraryItem {
    Distance: number;
    LatLong: VELatLong;
    Shape: VEShape;
    Text: string;
    Time: number;
    Warnings: VERouteWarning[];
    Hints: VERouteHint[];
}

enum VERouteWarningSeverity { None, LowImpact, Minor, Moderate, Serious }
enum VERouteHintType { PreviousIntersection, NextIntersection, Landmark }

interface VERouteHint {
    Type: VERouteHintType;
    Text: string;
}

interface VERouteWarning {
    Severity: VERouteWarningSeverity;
    Text: string;
}

class VEShapeSourceSpecification {

    constructor(dataType: string, dataSource: string, layer: VEShapeLayer) {
        this.Layer = layer;
        this.LayerSource = dataSource;
        this.Type = dataType;
    }

    public Layer: VEShapeLayer;
    public LayerSource: string;
    public Type: string;

    //Not Supported
    public MaxImportedShapes: number = 200;
}

class VEDataType {
    public static GeoRSS = 'g';
    public static VECollection = 'c';
    public static ImportXML = 'i';
    public static VETileSource = 't';
}

class VESearchOptions {
    public CreateResults: boolean = true;
    public NumberOfResults: number = 10;
    public SetBestMapView: boolean = true;
    public ShapeLayer: VEShapeLayer;
    public ShowResults: boolean = true;
    public StartIndex: number = 0;

    //Not supported
    public BoundingRectangle: VELatLongRectangle = null;
    public FindType: VEFindType;
    public UseDefaultDisambiguation: boolean;
}

    /////////////////////
    //Not Supported
    ////////////////////

enum VEAltitudeMode { Default, Absolute, RelativeToGround }
class VEBirdseyeScene { }
class VEClusteringOptions { }
enum VEClusteringType { None, Grid }
class VEClusterSpecification { }
class VEDashboardSize {
    public static Normal = 'normal';
    public static Small = 'small';
    public static Tiny = 'tiny';
}
class VEDistanceUnit {
    public static Miles = 'm';
    public static Kilometers = 'k';
}
interface VEException {
    source: any,
    name: string,
    message: string
}
enum VEFailedShapeRequest { DoNotDraw, DrawInaccurately, QueueRequest }
class VEImageryMetadata { }
class VEImageryMetadataOptions { }
enum VEMiniMapSize { Small, Large }
enum VEModelFormat { OBJ }
class VEModelOrientation { }
class VEModelScale { }
enum VEModelScaleUnit { Inches, Feet, Yards, Millimeters, Centimeters, Meters }
class VEModelSourceSpecification { }
enum VEModelStatusCode { Success, InvalidURL, Failed }
class VEPrintOptions { }
class VERouteDeprected { }
class VERouteItineraryDeprecated { }
interface VERouteLocation {
    Address: string;
    LatLong: VELatLong;
}
interface VERouteSegment { }
class VERouteType {
    public static Shortest = 'q';
    public static Quickest = 's';
}
enum VEShapeAccuracy { None, Pushpin }
