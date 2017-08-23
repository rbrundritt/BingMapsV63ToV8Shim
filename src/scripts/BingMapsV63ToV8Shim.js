var VEShapeCounter = 1000;
var VEShapeType = (function () {
    function VEShapeType() {
    }
    return VEShapeType;
}());
VEShapeType.Pushpin = 'Pushpin';
VEShapeType.Polyline = 'Polyline';
VEShapeType.Polygon = 'Polygon';
var VEMapMode;
(function (VEMapMode) {
    VEMapMode[VEMapMode["Mode2D"] = 0] = "Mode2D";
    VEMapMode[VEMapMode["Mode3D"] = 1] = "Mode3D";
})(VEMapMode || (VEMapMode = {}));
var VEMapStyle = (function () {
    function VEMapStyle() {
    }
    return VEMapStyle;
}());
VEMapStyle.Road = 'r';
VEMapStyle.Shaded = 's';
VEMapStyle.Aerial = 'a';
VEMapStyle.Hybrid = 'h';
VEMapStyle.Oblique = 'o';
VEMapStyle.Birdseye = 'o';
VEMapStyle.BirdseyeHybrid = 'b';
var VEOrientation = (function () {
    function VEOrientation() {
    }
    return VEOrientation;
}());
VEOrientation.North = 'North';
VEOrientation.South = 'South';
VEOrientation.East = 'East';
VEOrientation.West = 'West';
var VELatLong = (function () {
    function VELatLong(latitude, longitude) {
        this._location = new Microsoft.Maps.Location(latitude, longitude);
    }
    Object.defineProperty(VELatLong.prototype, "Latitude", {
        get: function () {
            return this._location.latitude;
        },
        set: function (lat) {
            this._location.latitude = lat;
            if (this._updatedEvent) {
                this._updatedEvent();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VELatLong.prototype, "Longitude", {
        get: function () {
            return this._location.longitude;
        },
        set: function (lon) {
            this._location.longitude = lon;
            if (this._updatedEvent) {
                this._updatedEvent();
            }
        },
        enumerable: true,
        configurable: true
    });
    VELatLong._fromLocation = function (loc) {
        return new VELatLong(loc.latitude, loc.longitude);
    };
    //Not supported
    VELatLong.prototype.SetAltitude = function () { };
    return VELatLong;
}());
var VELatLongRectangle = (function () {
    function VELatLongRectangle(TopLeftLatLong, BottomRightLatLong) {
        this._topLeft = TopLeftLatLong;
        this._bottomRight = BottomRightLatLong;
        this._updateBase();
    }
    Object.defineProperty(VELatLongRectangle.prototype, "TopLeftLatLong", {
        get: function () {
            return this._topLeft;
        },
        set: function (loc) {
            this._topLeft = loc;
            this._topLeft._updatedEvent = this._updateBase;
            this._updateBase();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VELatLongRectangle.prototype, "BottomRightLatLong", {
        get: function () {
            return this._bottomRight;
        },
        set: function (loc) {
            this._bottomRight = loc;
            this._bottomRight._updatedEvent = this._updateBase;
            this._updateBase();
        },
        enumerable: true,
        configurable: true
    });
    VELatLongRectangle.prototype._updateBase = function () {
        if (this._topLeft && this._bottomRight) {
            this._bounds = Microsoft.Maps.LocationRect.fromCorners(this._topLeft._location, this._bottomRight._location);
        }
    };
    VELatLongRectangle._fromLocationRect = function (loc) {
        if (loc) {
            return new VELatLongRectangle(VELatLong._fromLocation(loc.getNorthwest()), VELatLong._fromLocation(loc.getSoutheast()));
        }
        return null;
    };
    return VELatLongRectangle;
}());
var VEPixel = (function () {
    function VEPixel(x, y) {
        this.x = x;
        this.y = y;
    }
    VEPixel.prototype._getPoint = function () {
        return new Microsoft.Maps.Point(this.x, this.y);
    };
    VEPixel._fromPoint = function (p) {
        return new VEPixel(p.x, p.y);
    };
    return VEPixel;
}());
var VEColor = (function () {
    function VEColor(r, g, b, a) {
        this.A = a;
        this.R = r;
        this.G = g;
        this.B = b;
    }
    VEColor.prototype._getV8Color = function () {
        return new Microsoft.Maps.Color(this.A, this.R, this.G, this.B);
    };
    VEColor._fromV8Color = function (c) {
        return new VEColor(c.r, c.g, c.b, c.a);
    };
    return VEColor;
}());
var VEShapeDragEventArgs = (function () {
    function VEShapeDragEventArgs() {
    }
    return VEShapeDragEventArgs;
}());
var VECustomIconSpecification = (function () {
    function VECustomIconSpecification() {
    }
    return VECustomIconSpecification;
}());
var VEShape = (function () {
    function VEShape(type, points) {
        this._events = [];
        this._eventHandlers = [];
        this._infoboxOffset = new Microsoft.Maps.Point(0, 0);
        this._shapeType = type;
        if (points) {
            this._initShape(points);
        }
    }
    Object.defineProperty(VEShape.prototype, "Draggable", {
        get: function () {
            if (this._shape instanceof Microsoft.Maps.Pushpin) {
                return this._shape.getDraggable();
            }
            return false;
        },
        set: function (canDrag) {
            if (this._shape instanceof Microsoft.Maps.Pushpin) {
                var isDraggable = this._shape.getDraggable();
                if (isDraggable != canDrag) {
                    this._shape.setOptions({ draggable: canDrag });
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VEShape.prototype, "ondrag", {
        get: function () {
            return this._events['drag'];
        },
        set: function (callback) {
            this._updateDragEvent('drag', callback);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VEShape.prototype, "onstartdrag", {
        get: function () {
            return this._events['dragstart'];
        },
        set: function (callback) {
            this._updateDragEvent('dragstart', callback);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VEShape.prototype, "onenddrag", {
        get: function () {
            return this._events['dragend'];
        },
        set: function (callback) {
            this._updateDragEvent('dragend', callback);
        },
        enumerable: true,
        configurable: true
    });
    VEShape.prototype.GetCustomIcon = function () {
        if (this._shape instanceof Microsoft.Maps.Pushpin) {
            var p = this._shape;
            return {
                Image: p.getIcon(),
                ImageOffset: VEPixel._fromPoint(p.getAnchor()),
                TextContent: p.getText(),
                TextOffset: VEPixel._fromPoint(p.getTextOffset())
            };
        }
        return null;
    };
    VEShape.prototype.SetCustomIcon = function (icon) {
        if (icon instanceof VECustomIconSpecification && this._shape instanceof Microsoft.Maps.Pushpin) {
            this._shape.setOptions({
                icon: icon.Image,
                anchor: (icon.ImageOffset) ? icon.ImageOffset._getPoint() : null,
                text: icon.TextContent,
                textOffset: (icon.ImageOffset) ? icon.TextOffset._getPoint() : null
            });
        }
    };
    VEShape.prototype.GetDescription = function () {
        return this._shape.metadata.description;
    };
    VEShape.prototype.SetDescription = function (val) {
        this._shape.metadata.description = val;
    };
    VEShape.prototype.GetFillColor = function () {
        if (this._shape instanceof Microsoft.Maps.Polygon) {
            return VEColor._fromV8Color(this._shape.getFillColor());
        }
        return null;
    };
    VEShape.prototype.SetFillColor = function (c) {
        if (this._shape instanceof Microsoft.Maps.Polygon) {
            this._shape.setOptions({
                fillColor: c._getV8Color()
            });
        }
    };
    VEShape.prototype.GetLineColor = function () {
        if (!(this._shape instanceof Microsoft.Maps.Pushpin)) {
            return VEColor._fromV8Color(this._shape.getStrokeColor());
        }
        return null;
    };
    VEShape.prototype.SetLineColor = function (c) {
        if (!(this._shape instanceof Microsoft.Maps.Pushpin)) {
            this._shape.setOptions({
                strokeColor: c._getV8Color()
            });
        }
    };
    VEShape.prototype.GetIconAnchor = function () {
        if (this._shape instanceof Microsoft.Maps.Pushpin) {
            return VELatLong._fromLocation(this._shape.getLocation());
        }
        return null;
    };
    VEShape.prototype.SetIconAnchor = function (loc) {
        if (this._shape instanceof Microsoft.Maps.Pushpin) {
            this._shape.setLocation(loc._location);
        }
    };
    VEShape.prototype.GetId = function () {
        return this._shape.metadata.id;
    };
    VEShape.prototype.GetPoints = function () {
        if (this._shape instanceof Microsoft.Maps.Pushpin) {
            return [VELatLong._fromLocation(this._shape.getLocation())];
        }
        else {
            var locs = this._shape.getLocations();
            var latlongs = [];
            for (var i = 0, len = locs.length; i < len; i++) {
                latlongs.push(VELatLong._fromLocation(locs[i]));
            }
            return latlongs;
        }
    };
    VEShape.prototype.SetPoints = function (points) {
        if (this._shape instanceof Microsoft.Maps.Pushpin) {
            if (points instanceof Array) {
                this._shape.setLocation(points[0]._location);
            }
            else {
                this._shape.setLocation(points._location);
            }
        }
        else if (points instanceof Array) {
            var locs = [];
            for (var i = 0; i < points.length; i++) {
                locs.push(points[i]._location);
            }
            this._shape.setLocations(locs);
        }
    };
    VEShape.prototype.GetShapeLayer = function () {
        return this._layer;
    };
    VEShape.prototype.GetTitle = function () {
        return this._shape.metadata.title;
    };
    VEShape.prototype.SetTitle = function (val) {
        this._shape.metadata.title = val;
    };
    VEShape.prototype.GetType = function () {
        return this._shapeType;
    };
    VEShape.prototype.Hide = function () {
        this._shape.setOptions({ visible: false });
    };
    VEShape.prototype.Show = function () {
        this._shape.setOptions({ visible: true });
    };
    VEShape._fromPrimitive = function (p) {
        var s;
        if (p instanceof Microsoft.Maps.Pushpin) {
            s = new VEShape(VEShapeType.Pushpin, null);
        }
        else if (p instanceof Microsoft.Maps.Polyline) {
            s = new VEShape(VEShapeType.Polyline, null);
        }
        else if (p instanceof Microsoft.Maps.Polygon) {
            s = new VEShape(VEShapeType.Polygon, null);
        }
        VEShapeCounter++;
        p.metadata.id = 'VEShape_' + VEShapeCounter;
        p.metadata.parent = s;
        s._shape = p;
        return s;
    };
    //Private functions
    VEShape.prototype._initShape = function (points) {
        this._shape = null;
        if (points != null) {
            var locs = [];
            if (points instanceof Array) {
                for (var i = 0; i < points.length; i++) {
                    locs.push(points[i]._location);
                }
            }
            else {
                locs.push(points._location);
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
    };
    VEShape.prototype._updateDragEvent = function (eventName, callback) {
        var _this = this;
        if (callback) {
            this._events[eventName] = function (a) {
                if (a.eventName === 'dragstart') {
                    if (_this._map) {
                        _this._map.HideInfoBox();
                    }
                    else if (_this._layer) {
                        _this._layer._map.HideInfoBox();
                    }
                }
                callback({
                    Shape: _this,
                    LatLong: VELatLong._fromLocation(_this._shape.getLocation())
                });
            };
            if (this._shape instanceof Microsoft.Maps.Pushpin) {
                if (this._eventHandlers[eventName]) {
                    Microsoft.Maps.Events.removeHandler(this._eventHandlers[eventName]);
                }
                this._eventHandlers[eventName] = Microsoft.Maps.Events.addHandler(this._shape, eventName, this._events[eventName]);
            }
        }
        else {
            this._events[eventName] = null;
            if (this._eventHandlers[eventName]) {
                Microsoft.Maps.Events.removeHandler(this._eventHandlers[eventName]);
            }
        }
    };
    //Upsupported functions
    VEShape.prototype.GetAltitude = function () {
        return 0;
    };
    VEShape.prototype.SetAltitude = function () {
    };
    VEShape.prototype.GetAltitudeMode = function () {
        return null;
    };
    VEShape.prototype.SetAltitudeMode = function () {
    };
    VEShape.prototype.GetLineToGround = function () {
        return false;
    };
    VEShape.prototype.SetLineToGround = function () {
    };
    VEShape.prototype.GetMaxZoomLevel = function () {
        return 19;
    };
    VEShape.prototype.SetMaxZoomLevel = function (zoom) {
    };
    VEShape.prototype.GetMinZoomLevel = function () {
        return 1;
    };
    VEShape.prototype.SetMinZoomLevel = function (zoom) {
    };
    VEShape.prototype.GetZIndex = function () {
        return 1;
    };
    VEShape.prototype.SetZIndex = function (zoom) {
    };
    return VEShape;
}());
var VEShapeLayer = (function () {
    function VEShapeLayer() {
        var _this = this;
        this._layer = new Microsoft.Maps.Layer();
        this._layer.metadata = {
            parent: this
        };
        Microsoft.Maps.Events.addHandler(this._layer, 'mouseover', function (e) {
            if (_this._map) {
                _this._map._shapeHovered(e);
            }
        });
        Microsoft.Maps.Events.addHandler(this._layer, 'mouseout', function (e) {
            if (_this._map) {
                _this._map._infobox.setOptions({ visible: false });
            }
        });
    }
    VEShapeLayer.prototype.AddShape = function (s) {
        if (s instanceof Array) {
            for (var i = 0; i < s.length; i++) {
                s[i]._layer = this;
                s[i]._map = this._map;
                this._layer.add(s[i]._shape);
            }
        }
        else {
            s._layer = this;
            s._map = this._map;
            this._layer.add(s._shape);
        }
    };
    VEShapeLayer.prototype.DeleteAllShapes = function () {
        this._layer.clear();
    };
    VEShapeLayer.prototype.DeleteShape = function (s) {
        this._layer.remove(s._shape);
    };
    VEShapeLayer.prototype.GetBoundingRectangle = function () {
        return VELatLongRectangle._fromLocationRect(Microsoft.Maps.LocationRect.fromShapes(this._layer.getPrimitives()));
    };
    VEShapeLayer.prototype.GetDescription = function () {
        return this._layer.metadata.description;
    };
    VEShapeLayer.prototype.SetDescription = function (val) {
        this._layer.metadata.description = val;
    };
    VEShapeLayer.prototype.GetTitle = function () {
        return this._layer.metadata.description;
    };
    VEShapeLayer.prototype.SetTitle = function (val) {
        this._layer.metadata.description = val;
    };
    VEShapeLayer.prototype.GetShapeById = function (id) {
        var shapes = this._layer.getPrimitives();
        for (var i = 0, len = shapes.length; i < len; i++) {
            if (shapes[i].metadata.id === id) {
                return shapes[i].metadata.parent;
            }
        }
        return null;
    };
    VEShapeLayer.prototype.GetShapeByIndex = function (idx) {
        return this._layer.getPrimitives()[idx].metadata.parent;
    };
    VEShapeLayer.prototype.GetShapeCount = function () {
        return this._layer.getPrimitives().length;
    };
    VEShapeLayer.prototype.IsIvisble = function () {
        return this._layer.getVisible();
    };
    VEShapeLayer.prototype.Hide = function () {
        this._layer.setVisible(false);
    };
    VEShapeLayer.prototype.Show = function () {
        this._layer.setVisible(true);
    };
    //Not Supported
    VEShapeLayer.prototype.GetClusteredShapes = function () {
    };
    VEShapeLayer.prototype.SetClusteringConfiguration = function () {
    };
    VEShapeLayer.prototype._updateMapReference = function () {
        var shapes = this._layer.getPrimitives();
        for (var i = 0, len = shapes.length; i < len; i++) {
            shapes[i].metadata.parent._map = this._map;
        }
    };
    return VEShapeLayer;
}());
var VETileSourceSpecification = (function () {
    function VETileSourceSpecification(tileSourceId, tileSource, numServers, bounds, minZoom, maxZoom, getTilePath, opacity, zindex) {
        this._id = tileSourceId;
        var o = {
            uriConstructor: tileSource,
            bounds: (bounds) ? bounds._bounds : null,
            minZoom: minZoom,
            maxZoom: maxZoom
        };
        this._opacity = (typeof opacity != 'undefined') ? opacity : 1;
        this._updateTileSource(o);
    }
    Object.defineProperty(VETileSourceSpecification.prototype, "Bounds", {
        get: function () {
            return VELatLongRectangle._fromLocationRect(this._tileLayer.getTileSource().getBounds());
        },
        set: function (bounds) {
            var s = this._getTileSourceOptions();
            s.bounds = bounds._bounds;
            this._updateTileSource(s);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VETileSourceSpecification.prototype, "ID", {
        get: function () {
            return this._id;
        },
        set: function (id) {
            this._id = id;
            this._tileLayer.metadata.id = id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VETileSourceSpecification.prototype, "Opacity", {
        get: function () {
            return this._opacity;
        },
        set: function (opacity) {
            this._opacity = opacity;
            this._tileLayer.setOptions({ opacity: opacity });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VETileSourceSpecification.prototype, "MaxZoomLevel", {
        get: function () {
            return this._tileLayer.getTileSource().getMaxZoom();
        },
        set: function (maxZoom) {
            var s = this._getTileSourceOptions();
            s.maxZoom = maxZoom;
            this._updateTileSource(s);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VETileSourceSpecification.prototype, "MinZoomLevel", {
        get: function () {
            return this._tileLayer.getTileSource().getMinZoom();
        },
        set: function (minZoom) {
            var s = this._getTileSourceOptions();
            s.minZoom = minZoom;
            this._updateTileSource(s);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VETileSourceSpecification.prototype, "TileSource", {
        get: function () {
            var url = this._tileLayer.getTileSource().getUriConstructor();
            return url;
        },
        set: function (uriConstructor) {
            var s = this._getTileSourceOptions();
            s.uriConstructor = uriConstructor;
            this._updateTileSource(s);
        },
        enumerable: true,
        configurable: true
    });
    VETileSourceSpecification.prototype._updateTileSource = function (source) {
        source.uriConstructor = source.uriConstructor.replace('%2', '{subdomain}').replace('%4', '{quadkey}');
        var o = {
            opacity: this._opacity,
            mercator: new Microsoft.Maps.TileSource(source)
        };
        var metadata = {
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
    };
    VETileSourceSpecification.prototype._getTileSourceOptions = function () {
        var s = this._tileLayer.getTileSource();
        return {
            bounds: s.getBounds(),
            maxZoom: s.getMaxZoom(),
            minZoom: s.getMinZoom(),
            uriConstructor: s.getUriConstructor().replace('{subdomain}', '%2').replace('{quadkey}', '%4')
        };
    };
    return VETileSourceSpecification;
}());
var VEMapOptions = (function () {
    function VEMapOptions() {
    }
    return VEMapOptions;
}());
var VEMap = (function () {
    function VEMap(elmId) {
        this._events = {};
        this._eventHandlers = {};
        this._eventNamesV7ToV8 = {
            'onclick': 'click',
            'ondoubleclick': 'dblclick',
            'onmousemove': 'mousemove',
            'onmousedown': 'mousedown',
            'onmouseup': 'mouseup',
            'onmouseover': 'mouseover',
            'onmouseout': 'mouseout',
            'onmousewheel': 'mousewheel',
            'onchangemapstyle': 'maptypechanged'
        };
        this._eventNamesV8ToV7 = {
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
        this._commonEvents = [
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
        this._navteqNA = 'https://spatial.virtualearth.net/REST/v1/data/f22876ec257b474b82fe2ffcb8393150/NavteqNA/NavteqPOIs';
        this._navteqEU = 'https://spatial.virtualearth.net/REST/v1/data/c2ae584bbccc4916a0acf75d1e6947b4/NavteqEU/NavteqPOIs';
        this._poiTypes = { '2084': 'Winery', '3578': 'ATM', '4013': 'Train Station', '4100': 'Commuter Rail Station', '4170': 'Bus Station', '4444': 'Named Place', '4482': 'Ferry Terminal', '4493': 'Marina', '4580': 'Public Sports Airport', '4581': 'Airport', '5000': 'Business Facility', '5400': 'Grocery Store', '5511': 'Auto Dealerships', '5512': 'Auto Dealership-Used Cars', '5540': 'Petrol/Gasoline Station', '5571': 'Motorcycle Dealership', '5800': 'Restaurant', '5813': 'Nightlife', '5999': 'Historical Monument', '6000': 'Bank', '6512': 'Shopping', '7011': 'Hotel', '7012': 'Ski Resort', '7013': 'Other Accommodation', '7014': 'Ski Lift', '7389': 'Tourist Information', '7510': 'Rental Car Agency', '7520': 'Parking Lot', '7521': 'Parking Garage/House', '7522': 'Park & Ride', '7538': 'Auto Service & Maintenance', '7832': 'Cinema', '7897': 'Rest Area', '7929': 'Performing Arts', '7933': 'Bowling Centre', '7940': 'Sports Complex', '7947': 'Park/Recreation Area', '7985': 'Casino', '7990': 'Convention/Exhibition Centre', '7992': 'Golf Course', '7994': 'Civic/Community Centre', '7996': 'Amusement Park', '7997': 'Sports Centre', '7998': 'Ice Skating Rink', '7999': 'Tourist Attraction', '8060': 'Hospital', '8200': 'Higher Education', '8211': 'School', '8231': 'Library', '8410': 'Museum', '8699': 'Automobile Club', '9121': 'City Hall', '9211': 'Court House', '9221': 'Police Station', '9517': 'Campground', '9522': 'Truck Stop/Plaza', '9525': 'Government Office', '9530': 'Post Office', '9535': 'Convenience Store', '9537': 'Clothing Store', '9545': 'Department Store', '9560': 'Home Specialty Store', '9565': 'Pharmacy', '9567': 'Specialty Store', '9568': 'Sporting Goods Store', '9583': 'Medical Service', '9590': 'Residential Area/Building', '9591': 'Cemetery', '9592': 'Highway Exit', '9593': 'Transportation Service', '9710': 'Weigh Station', '9714': 'Cargo Centre', '9715': 'Military Base', '9718': 'Animal Park', '9719': 'Truck Dealership', '9986': 'Home Improvement & Hardware Store', '9987': 'Consumer Electronics Store', '9988': 'Office Supply & Services Store', '9991': 'Industrial Zone', '9992': 'Place of Worship', '9993': 'Embassy', '9994': 'County Council', '9995': 'Bookstore', '9996': 'Coffee Shop', '9998': 'Hamlet', '9999': 'Border Crossing' };
        this._phoneRx = /([0-9]{3}-)([0-9]{3})([0-9]{4})/gi;
        this._waypointIcon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="52" height="49.4" viewBox="0 0 37 35" xml:space="preserve"><circle cx="32" cy="30" r="4" style="stroke-width:2;stroke:#ffffff;fill:#000000;"/><polygon style="fill:rgba(0,0,0,0.5)" points="18,1 32,30 18,18 18,1"/><rect x="2" y="2" width="15" height="15" style="stroke-width:2;stroke:#000000;fill:{color}"/><text x="9" y="13" style="font-size:11px;font-family:arial;fill:#ffffff;" text-anchor="middle">{text}</text></svg>';
        this._connectingWords = [" in ", " near ", " around ", " by "];
        this._rootElm = document.getElementById(elmId);
        Microsoft.Maps.loadModule(['Microsoft.Maps.SpatialMath']);
    }
    VEMap.prototype.AddShape = function (shape) {
        if (this._map) {
            if (shape instanceof Array) {
                for (var i = 0; i < shape.length; i++) {
                    this._map.entities.push(shape[i]._shape);
                    shape[i]._map = this;
                }
            }
            else {
                this._map.entities.push(shape._shape);
                shape._map = this;
            }
        }
    };
    VEMap.prototype.AddShapeLayer = function (layer) {
        if (this._map) {
            layer._map = this;
            layer._updateMapReference();
            this._map.layers.insert(layer._layer);
        }
    };
    VEMap.prototype.AddTileLayer = function (layer, visibleOnLoad) {
        if (this._map) {
            if (typeof visibleOnLoad === 'boolean') {
                layer._tileLayer.setOptions({ visible: visibleOnLoad });
            }
            this._map.layers.insert(layer._tileLayer);
            layer._map = this._map;
        }
    };
    VEMap.prototype.AttachEvent = function (eventName, callback) {
        var v8Name = this._eventNamesV7ToV8[eventName];
        if (v8Name) {
            this._updateEvent(v8Name, callback);
            if (eventName == 'onclick') {
                this._updateEvent('rightclick', callback);
            }
        }
        else if (this._commonEvents.indexOf(eventName) > -1) {
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
    };
    VEMap.prototype.DetachEvent = function (eventName) {
        var v8Name = this._eventNamesV7ToV8[eventName];
        var commonName = this._commonEvents[eventName];
        if (v8Name) {
            this._updateEvent(v8Name);
            if (eventName == 'onclick') {
                this._updateEvent('rightclick');
            }
        }
        else {
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
    };
    VEMap.prototype.HideInfoBox = function () {
        this._infobox.setOptions({ visible: false });
    };
    VEMap.prototype.ClearTraffic = function () {
        if (this._trafficManager) {
            this._trafficManager.hide();
        }
    };
    VEMap.prototype.DeleteAllShapeLayers = function () {
        for (var i = this._map.layers.length; i >= 0; i--) {
            if (this._map.layers[i] instanceof Microsoft.Maps.Layer) {
                this._map.layers[i].metadata.parent._map = null;
                this._map.layers.remove(this._map.layers[i]);
            }
        }
        this._map.entities.clear();
    };
    VEMap.prototype.DeleteAllShapes = function () {
        for (var i = this._map.layers.length; i >= 0; i--) {
            if (this._map.layers[i] instanceof Microsoft.Maps.Layer) {
                this._map.layers[i].clear();
            }
        }
        this._map.entities.clear();
    };
    VEMap.prototype.DeleteShape = function (shape) {
        if (shape._layer) {
            shape._layer._layer.remove(shape._shape);
        }
        else if (this._map.entities.indexOf(shape._shape) > -1) {
            this._map.entities.remove(shape._shape);
        }
    };
    VEMap.prototype.DeleteShapeLayer = function (layer) {
        layer._map = null;
        this._map.layers.remove(layer._layer);
    };
    VEMap.prototype.DeleteTileLayer = function (layer) {
        this._map.layers.remove(layer._tileLayer);
    };
    VEMap.prototype.Dispose = function () {
        this._map.dispose();
    };
    VEMap.prototype.SetCredentials = function (key) {
        this._key = key;
    };
    VEMap.prototype.SetClientToken = function (key) {
        this._key = key;
    };
    VEMap.prototype.GetCenter = function () {
        return VELatLong._fromLocation(this._map.getCenter());
    };
    VEMap.prototype.SetCenter = function (loc) {
        this._map.setView({ center: loc._location });
    };
    VEMap.prototype.GetHeading = function () {
        return this._map.getHeading();
    };
    VEMap.prototype.GetMapMode = function () {
        return VEMapMode.Mode2D;
    };
    VEMap.prototype.SetMapMode = function (mode) {
    };
    VEMap.prototype.GetMapStyle = function () {
        switch (this._map.getMapTypeId()) {
            case Microsoft.Maps.MapTypeId.aerial:
                return VEMapStyle.Hybrid;
            case Microsoft.Maps.MapTypeId.birdseye:
                return VEMapStyle.BirdseyeHybrid;
        }
        return VEMapStyle.Road;
    };
    VEMap.prototype.SetMapStyle = function (style) {
        var o = {
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
    };
    VEMap.prototype.GetMapView = function () {
        return VELatLongRectangle._fromLocationRect(this._map.getBounds());
    };
    VEMap.prototype.SetMapView = function (bounds) {
        this._map.setView({ bounds: bounds._bounds });
    };
    VEMap.prototype.GetShapeById = function (id) {
        var s;
        for (var i = 0; i < this._map.layers.length; i++) {
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
    };
    VEMap.prototype.GetShapeLayerByIndex = function (idx) {
        var cnt = 0;
        for (var i = 0; i < this._map.layers.length; i++) {
            if (this._map.layers[i] instanceof Microsoft.Maps.Layer) {
                if (cnt === idx) {
                    return this._map.layers[i];
                }
                cnt++;
            }
        }
    };
    VEMap.prototype.GetShapeLayerCount = function (idx) {
        var cnt = 0;
        for (var i = 0; i < this._map.layers.length; i++) {
            if (this._map.layers[i] instanceof Microsoft.Maps.Layer) {
                cnt++;
            }
        }
        return cnt;
    };
    VEMap.prototype.GetTileLayerById = function (id) {
        for (var i = 0; i < this._map.layers.length; i++) {
            if (this._map.layers[i] instanceof VETileSourceSpecification) {
                if (this._map.layers[i].metadata.id === id) {
                    return this._map.layers[i];
                }
            }
        }
    };
    VEMap.prototype.GetTileLayerByIndex = function (idx) {
        var cnt = 0;
        for (var i = 0; i < this._map.layers.length; i++) {
            if (this._map.layers[i] instanceof VETileSourceSpecification) {
                if (cnt === idx) {
                    return this._map.layers[i];
                }
                cnt++;
            }
        }
    };
    VEMap.prototype.GetTileLayerCount = function (idx) {
        var cnt = 0;
        for (var i = 0; i < this._map.layers.length; i++) {
            if (this._map.layers[i] instanceof VETileSourceSpecification) {
                cnt++;
            }
        }
        return cnt;
    };
    VEMap.prototype.GetVersion = function () {
        return 'V8';
    };
    VEMap.prototype.GetZoomLevel = function () {
        return this._map.getZoom();
    };
    VEMap.prototype.SetZoomLevel = function (z) {
        this._map.setView({ zoom: z });
    };
    VEMap.prototype.HideAllShapeLayers = function () {
        for (var i = this._map.layers.length; i >= 0; i--) {
            if (this._map.layers[i] instanceof Microsoft.Maps.Layer) {
                this._map.layers[i].setVisible(false);
            }
        }
    };
    VEMap.prototype.ShowAllShapeLayers = function () {
        for (var i = this._map.layers.length; i >= 0; i--) {
            if (this._map.layers[i] instanceof Microsoft.Maps.Layer) {
                this._map.layers[i].setVisible(true);
            }
        }
    };
    VEMap.prototype.HideBaseTileLayer = function () {
        this._map.setMapType(Microsoft.Maps.MapTypeId.mercator);
    };
    VEMap.prototype.ShowBaseTileLayer = function () {
        this._map.setMapType(Microsoft.Maps.MapTypeId.road);
    };
    VEMap.prototype.HideTileLayer = function (id) {
        this.GetTileLayerById(id)._tileLayer.setVisible(false);
    };
    VEMap.prototype.ShowTileLayer = function (id) {
        this.GetTileLayerById(id)._tileLayer.setVisible(true);
    };
    VEMap.prototype.HideTrafficLegend = function () {
        if (this._trafficManager) {
            this._trafficManager.hideLegend();
        }
    };
    VEMap.prototype.IncludePointInView = function (loc) {
        var b = this._map.getBounds();
        var r = Microsoft.Maps.LocationRect.fromLocations([b.getNorthwest(), b.getSoutheast(), loc._location]);
        this._map.setView({ bounds: b });
    };
    VEMap.prototype.LatLongToPixel = function (locs, zoom, callback) {
        var r;
        var scale = Math.pow(2, zoom - this._map.getZoom());
        var tl = this._map.tryLocationToPixel(new Microsoft.Maps.Location(-180, 85.5));
        if (locs instanceof Array) {
            r = [];
            for (var i = 0; i < locs.length; i++) {
                var g = Microsoft.Maps.SpatialMath.Tiles.locationToGlobalPixel(locs[i]._location, zoom);
                g.x += tl.x * scale;
                g.y += tl.y * scale;
                r.push(g);
            }
        }
        else if (locs instanceof VELatLong) {
            r = Microsoft.Maps.SpatialMath.Tiles.locationToGlobalPixel(locs._location, zoom);
            r.x += tl.x * scale;
            r.y += tl.y * scale;
        }
        if (callback) {
            callback(r);
        }
        else {
            return r;
        }
    };
    VEMap.prototype.PixelToLatLong = function (locs) {
        return VELatLong._fromLocation(this._map.tryPixelToLocation(locs._getPoint()));
    };
    VEMap.prototype.LoadMap = function (center, zoom, style, fixed, mode, showSwitch, tileBuffer, mapOptions) {
        var _this = this;
        var o = {
            center: (center) ? center._location : null,
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
        Microsoft.Maps.Events.addHandler(this._map, 'viewchange', function (e) {
            if (_this._events['onchangeview']) {
                _this._events['onchangeview'](self._fillEventArg(e, 'onchangeview', self._map));
            }
        });
        Microsoft.Maps.Events.addHandler(this._map, 'viewchangestart', function (e) {
            if (self._events['onstartzoom']) {
                self._events['onstartzoom'](self._fillEventArg(e, 'onstartzoom', self._map));
            }
            if (self._events['onstartpan']) {
                self._events['onstartpan'](self._fillEventArg(e, 'onstartpan', self._map));
            }
        });
        Microsoft.Maps.Events.addHandler(this._map, 'viewchangeend', function (e) {
            if (self._events['onendzoom']) {
                self._events['onendzoom'](self._fillEventArg(e, 'onendzoom', self._map));
            }
            if (self._events['onendpan']) {
                self._events['onendpan'](self._fillEventArg(e, 'onendpan', self._map));
            }
            lastCenter = self._map.getCenter();
            lastZoom = self._map.getZoom();
        });
        Microsoft.Maps.Events.addHandler(this._map.entities, 'mouseover', function (e) {
            _this._shapeHovered(e);
        });
        Microsoft.Maps.Events.addHandler(this._map.entities, 'mouseout', function (e) {
            _this._infobox.setOptions({ visible: false });
        });
        this._rootElm.addEventListener('keydown', function (e) {
            if (self._events['onkeydown']) {
                e['eventName'] = 'onkeydown';
                e['mapStyle'] = self.GetMapStyle();
                e['zoomLevel'] = self.GetZoomLevel();
                self._events['onkeydown'](e);
            }
        }, false);
        this._rootElm.addEventListener('keypress', function (e) {
            if (self._events['onkeypress']) {
                e['eventName'] = 'onkeypress';
                e['mapStyle'] = self.GetMapStyle();
                e['zoomLevel'] = self.GetZoomLevel();
                self._events['onkeypress'](e);
            }
        }, false);
        this._rootElm.addEventListener('keyup', function (e) {
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
    };
    VEMap.prototype.LoadTraffic = function () {
        if (!this._trafficManager) {
            var self = this;
            Microsoft.Maps.loadModule('Microsoft.Maps.Traffic', function () {
                self._trafficManager = new Microsoft.Maps.Traffic.TrafficManager(self._map);
                self._trafficManager.show();
            });
        }
        else {
            this._trafficManager.show();
        }
    };
    VEMap.prototype.Resize = function (width, height) {
        this._rootElm.style.width = width + 'px';
        this._rootElm.style.height = height + 'px';
        if (this._events['resize']) {
            this._events['resize']();
        }
    };
    VEMap.prototype.SetBirdseyeOrientation = function (or) {
        var o = {};
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
    };
    VEMap.prototype.SetCenterAndZoom = function (c, zoom) {
        this._map.setView({ center: c._location, zoom: zoom });
    };
    VEMap.prototype.ShowInfoBox = function (shape, anchor, offset) {
        var loc = null;
        if (anchor) {
            if (anchor instanceof VEPixel) {
                loc = this._map.tryPixelToLocation(anchor._getPoint());
            }
            else {
                loc = anchor._location;
            }
        }
        else if (shape._shape instanceof Microsoft.Maps.Pushpin) {
            loc = shape._shape.getLocation();
        }
        else {
            loc = Microsoft.Maps.SpatialMath.Geometry.centroid(shape._shape);
        }
        var o = {
            title: shape._shape.metadata.title || '',
            description: shape._shape.metadata.description || '',
            location: loc,
            offset: (offset) ? offset._getPoint() : shape._infoboxOffset,
            visible: true
        };
        this._infobox.setOptions(o);
    };
    VEMap.prototype.ShowTrafficLegend = function () {
        if (this._trafficManager) {
            this._trafficManager.showLegend();
        }
    };
    VEMap.prototype.ZoomIn = function () {
        this._map.setView({ zoom: this._map.getZoom() + 1 });
    };
    VEMap.prototype.ZoomOut = function () {
        this._map.setView({ zoom: this._map.getZoom() - 1 });
    };
    VEMap.prototype.GetLeft = function () {
        return this._rootElm.clientLeft;
    };
    VEMap.prototype.GetTop = function () {
        return this._rootElm.clientTop;
    };
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
    VEMap.prototype.Find = function (what, where, findType, shapeLayer, startIndex, numberOfResults, showResults, createResults, useDefaultDisambiguation, setBestMapView, callback) {
        var _this = this;
        if (startIndex === void 0) { startIndex = 0; }
        if (numberOfResults === void 0) { numberOfResults = 10; }
        if (showResults === void 0) { showResults = true; }
        if (setBestMapView === void 0) { setBestMapView = true; }
        if (!this._searchManager || !Microsoft.Maps.SpatialDataService) {
            Microsoft.Maps.loadModule(['Microsoft.Maps.Search', 'Microsoft.Maps.SpatialDataService'], function () {
                _this._searchManager = new Microsoft.Maps.Search.SearchManager(_this._map);
            });
            return;
        }
        if (where) {
            this._searchManager.geocode({
                where: where,
                callback: function (r) {
                    if (r && r.results && r.results.length > 0) {
                        _this._performPoiSearch(what, r.results[0].location, shapeLayer, startIndex, numberOfResults, showResults, createResults, setBestMapView, _this._convertPlaceResults(r.results), callback);
                    }
                    else if (callback) {
                        callback(null);
                    }
                }
            });
        }
        else if (what) {
            this._searchManager.reverseGeocode({
                location: this._map.getCenter(),
                callback: function (r) {
                    _this._performPoiSearch(what, _this._map.getCenter(), shapeLayer, startIndex, numberOfResults, showResults, createResults, setBestMapView, _this._convertPlaceResults([r]), callback);
                }
            });
        }
        else if (callback) {
            callback(null);
        }
    };
    VEMap.prototype._performPoiSearch = function (what, loc, shapeLayer, startIndex, numberOfResults, showResults, createResults, setBestMapView, places, callback) {
        var _this = this;
        if (showResults === void 0) { showResults = true; }
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
        }, this._map, function (r, inlineCount) {
            if (r && r.length > 0) {
                var results = [];
                var shapes = [];
                var locs = [];
                for (var i = 0; i < r.length; i++) {
                    if (what) {
                        //Filter results client side.
                        if (_this._fuzzyPoiMatch(what, r[i].metadata)) {
                            var fr = self._convertFindResult(r[i]);
                            results.push(fr);
                            shapes.push(fr.Shape);
                            locs.push(fr.Shape._shape.getLocation());
                        }
                    }
                    else {
                        var fr = self._convertFindResult(r[i]);
                        results.push(fr);
                        shapes.push(fr.Shape);
                        locs.push(fr.Shape._shape.getLocation());
                    }
                    if (results.length >= numberOfResults) {
                        break;
                    }
                }
                if (showResults && shapes.length > 0) {
                    if (shapeLayer) {
                        shapeLayer.AddShape(shapes);
                    }
                    else {
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
            }
            else if (callback) {
                callback(null);
            }
        });
    };
    VEMap.prototype._fuzzyPoiMatch = function (what, metadata) {
        return (metadata.Name && metadata.Name.toLowerCase().indexOf(what) > -1) ||
            (metadata.DisplayName && metadata.DisplayName.toLowerCase().indexOf(what) > -1) ||
            (metadata.EntityTypeID && this._poiTypes[metadata.EntityTypeID] && this._poiTypes[metadata.EntityTypeID].toLowerCase().indexOf(what) > -1);
    };
    VEMap.prototype._createPoiFilter = function (what) {
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
    };
    VEMap.prototype._convertFindResult = function (shape) {
        var s = VEShape._fromPrimitive(shape);
        var m = s._shape.metadata;
        var phone = m.Phone || '';
        if (this._phoneRx.test(m.Phone)) {
            phone = m.Phone.replace(this._phoneRx, '$1$2-$3');
        }
        var desc = [m.AddressLine, '<br/>', m.Locality, ', ', m.AdminDistrict, '<br/>', m.PostalCode];
        if (phone !== '') {
            desc.push('<br/><br/><div style="min-width:200px;">Phone: ', phone, '</div>');
        }
        s._shape.metadata.title = shape.metadata.DisplayName;
        s._shape.metadata.description = desc.join('');
        return {
            Shape: s,
            Name: m.DisplayName,
            Description: desc.join(''),
            LatLong: VELatLong._fromLocation(shape.getLocation()),
            IsSponsored: false,
            FindType: VEFindType.Businesses,
            Phone: m.Phone
        };
    };
    VEMap.prototype.FindLocations = function (veLatLong, callback) {
        var _this = this;
        if (!this._searchManager) {
            Microsoft.Maps.loadModule('Microsoft.Maps.Search', function () {
                _this._searchManager = new Microsoft.Maps.Search.SearchManager(_this._map);
            });
            return;
        }
        if (callback) {
            this._searchManager.reverseGeocode({
                location: veLatLong._location,
                callback: function (r) {
                    callback(_this._convertPlaceResults([r]));
                }
            });
        }
    };
    VEMap.prototype.Geocode = function (query, callback, options) {
        var _this = this;
        if (!this._searchManager) {
            Microsoft.Maps.loadModule('Microsoft.Maps.Search', function () {
                _this._searchManager = new Microsoft.Maps.Search.SearchManager(_this._map);
            });
            return;
        }
        if (callback) {
            this._searchManager.geocode({
                where: query,
                callback: function (r) {
                    var results = _this._convertPlaceResults(r.results);
                    var setMapView = true;
                    if (options && typeof options.SetBestMapView === 'boolean') {
                        setMapView = options.SetBestMapView;
                    }
                    if (setMapView && results && results.length > 0) {
                        _this._map.setView({
                            bounds: r.results[0].bestView
                        });
                    }
                    callback(null, null, results, false, null);
                }
            });
        }
    };
    VEMap.prototype.GetDirections = function (locations, options) {
        var _this = this;
        options = options || new VERouteOptions();
        if (!locations || locations.length > 25) {
            options.RouteCallback(null);
            return;
        }
        if (!this._directionsManager) {
            Microsoft.Maps.loadModule('Microsoft.Maps.Directions', function () {
                _this._directionsManager = new Microsoft.Maps.Directions.DirectionsManager(_this._map);
                Microsoft.Maps.Events.addHandler(_this._directionsManager, 'directionsUpdated', function (e) {
                    if (options.RouteCallback && e.route && e.route.length > 0) {
                        var r = e.route[0];
                        var legs = [];
                        var idx = 0;
                        var waypointCnt = 0;
                        var waypointLabel = "ABCDEFGHIJKLMNOPQRSTYVWXYZ";
                        var wp = [];
                        var steps = [];
                        for (var i = 0; i < r.routeLegs.length; i++) {
                            var l = _this._convertRouteLeg(r.routeLegs[i], idx, options.UseTraffic);
                            idx = l.Itinerary._idx;
                            legs.push(l);
                            if (options.DrawRoute) {
                                for (var j = 0; j < l.Itinerary.Items.length; j++) {
                                    if (j == 0) {
                                        l.Itinerary.Items[j].Shape._infoboxOffset = new Microsoft.Maps.Point(-30, 25);
                                        if (i == 0) {
                                            //Start                                           
                                            l.Itinerary.Items[j].Shape._shape.setOptions({
                                                icon: _this._waypointIcon,
                                                anchor: new Microsoft.Maps.Point(42, 39),
                                                color: '#008f09',
                                                text: 'A'
                                            });
                                            wp.push(l.Itinerary.Items[j].Shape._shape);
                                            waypointCnt++;
                                        }
                                        else {
                                            //Waypoint
                                            l.Itinerary.Items[j].Shape._shape.setOptions({
                                                icon: _this._waypointIcon,
                                                anchor: new Microsoft.Maps.Point(42, 39),
                                                color: '#737373',
                                                text: waypointLabel[waypointCnt]
                                            });
                                            wp.push(l.Itinerary.Items[j].Shape._shape);
                                            waypointCnt++;
                                        }
                                    }
                                    else if (i == r.routeLegs.length - 1 && j == l.Itinerary.Items.length - 1) {
                                        //End
                                        l.Itinerary.Items[j].Shape._infoboxOffset = new Microsoft.Maps.Point(-30, 25);
                                        l.Itinerary.Items[j].Shape._shape.setOptions({
                                            icon: _this._waypointIcon,
                                            anchor: new Microsoft.Maps.Point(42, 39),
                                            color: '#d60000',
                                            text: waypointLabel[waypointCnt]
                                        });
                                        wp.push(l.Itinerary.Items[j].Shape._shape);
                                        waypointCnt++;
                                    }
                                    else {
                                        steps.push(l.Itinerary.Items[j].Shape._shape);
                                    }
                                }
                            }
                        }
                        wp.reverse();
                        _this._map.entities.push(wp);
                        _this._map.entities.push(steps);
                        var points = [];
                        for (var i = 0; i < r.routePath.length; i++) {
                            points.push(VELatLong._fromLocation(r.routePath[i]));
                        }
                        var route = {
                            Distance: e.routeSummary[0].distance,
                            Time: (options.UseTraffic) ? e.routeSummary[0].timeWithTraffic : e.routeSummary[0].time,
                            RouteLegs: legs,
                            ShapePoints: points
                        };
                        options.RouteCallback(route);
                    }
                });
                _this.GetDirections(locations, options);
            });
            return;
        }
        else {
            this._directionsManager.clearAll();
        }
        for (var i = 0; i < locations.length; i++) {
            if (locations[i] instanceof VELatLong) {
                this._directionsManager.addWaypoint(new Microsoft.Maps.Directions.Waypoint({
                    location: locations[i]._location
                }));
            }
            else {
                this._directionsManager.addWaypoint(new Microsoft.Maps.Directions.Waypoint({
                    address: locations[i]
                }));
            }
        }
        var optimize;
        if (options.RouteOptimize == VERouteOptimize.MinimizeDistance) {
            optimize = Microsoft.Maps.Directions.RouteOptimization.shortestDistance;
        }
        else {
            if (options.UseTraffic) {
                optimize = Microsoft.Maps.Directions.RouteOptimization.timeWithTraffic;
            }
            else {
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
        var lineOptions = {
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
    };
    VEMap.prototype._convertRouteLeg = function (leg, idx, useTraffic) {
        return {
            Distance: leg.summary.distance,
            Time: (useTraffic) ? leg.summary.timeWithTraffic : leg.summary.time,
            Itinerary: this._convertItinerary(leg, idx, useTraffic)
        };
    };
    VEMap.prototype._convertItinerary = function (leg, idx, useTraffic) {
        var items = [];
        for (var i = 0; i < leg.itineraryItems.length; i++) {
            idx++;
            items.push(this._convertItineraryItem(leg.itineraryItems[i], idx));
        }
        return {
            Items: items,
            _idx: idx
        };
    };
    VEMap.prototype._convertItineraryItem = function (item, idx) {
        var hints = [];
        var warnings = [];
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
        shape._shape.setOptions({
            icon: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="18" height="17" viewBox="0 0 36 34" xml:space="preserve"><circle cx="16" cy="16" r="14" style="fill:{color}"/><text x="16" y="21" style="font-size:16px;font-family:arial;fill:#ffffff;" text-anchor="middle">{text}</text></svg>',
            anchor: new Microsoft.Maps.Point(9, 9),
            color: '#d60000',
            text: idx + ''
        });
        shape.SetDescription(item.formattedText);
        return {
            Distance: parseFloat(item.distance),
            Time: item.durationInSeconds,
            LatLong: VELatLong._fromLocation(item.coordinate),
            Text: item.formattedText,
            Shape: shape,
            Hints: hints,
            Warnings: warnings
        };
    };
    VEMap.prototype.DeleteRoute = function () {
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
    };
    VEMap.prototype.Search = function (query, callback, options) {
        if (query && callback) {
            options = options || new VESearchOptions();
            var keys = Object.keys(this._poiTypes);
            var isPoi;
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
                    }
                    else if (vals.length == 1) {
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
    };
    VEMap.prototype.ImportShapeLayerData = function (shapeSource, callback, setBestView) {
        var _this = this;
        if (setBestView === void 0) { setBestView = true; }
        if (shapeSource && shapeSource.LayerSource) {
            Microsoft.Maps.loadModule('Microsoft.Maps.GeoXml', function () {
                if (!shapeSource.Layer) {
                    shapeSource.Layer = new VEShapeLayer();
                }
                Microsoft.Maps.GeoXml.readFromUrl(shapeSource.LayerSource, null, function (data) {
                    if (data) {
                        var shapes = [];
                        for (var i = 0; i < data.shapes.length; i++) {
                            shapes.push(VEShape._fromPrimitive(data.shapes[i]));
                        }
                        for (var i = 0; i < data.layers.length; i++) {
                            if (data.layers[i] instanceof Microsoft.Maps.Layer) {
                                var p = data.layers[i].getPrimitives();
                                for (var j = 0; j < p.length; j++) {
                                    shapes.push(VEShape._fromPrimitive(p[j]));
                                }
                            }
                        }
                        shapeSource.Layer.AddShape(shapes);
                        if (!shapeSource.Layer._map) {
                            _this.AddShapeLayer(shapeSource.Layer);
                        }
                        if (setBestView) {
                            _this._map.setView({
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
    };
    /////////////////////
    // Private functions
    ////////////////////
    VEMap.prototype._convertPlaceResults = function (results) {
        var locs = [];
        for (var i = 0; i < results.length; i++) {
            var p = VELocationPrecision.Interpolated;
            var gl = [];
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
            var place = {
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
    };
    VEMap.prototype._convertLocationPrecision = function (precision) {
        if (precision === 'Rooftop' || precision === 'Parcel') {
            return VELocationPrecision.Rooftop;
        }
        return VELocationPrecision.Interpolated;
    };
    VEMap.prototype._updateEvent = function (eventName, callback) {
        var _this = this;
        if (callback) {
            var v7Name = this._eventNamesV8ToV7[eventName];
            this._events[eventName] = function (a) {
                var r = callback(_this._fillEventArg(a, v7Name, a.target));
                if (eventName === 'onmouseover') {
                    //User is returning false for mouse over event and trying to disable default behaviour which is to show infobox.
                    _this._disableInfoboxHover = !r;
                }
            };
            if (this._eventHandlers[eventName]) {
                Microsoft.Maps.Events.removeHandler(this._eventHandlers[eventName]);
            }
            this._eventHandlers[eventName] = Microsoft.Maps.Events.addHandler(this._map, eventName, this._events[eventName]);
        }
        else {
            this._events[eventName] = null;
            if (this._eventHandlers[eventName]) {
                Microsoft.Maps.Events.removeHandler(this._eventHandlers[eventName]);
            }
        }
    };
    VEMap.prototype._fillEventArg = function (arg, eventName, shape) {
        var _this = this;
        arg = arg || {};
        var x = (arg.getX) ? arg.getX() : 0;
        var y = (arg.getY) ? arg.getY() : 0;
        var e = {
            leftMouseButton: arg.isPrimary,
            rightMouseButton: arg.isSecondary,
            clientX: x,
            clientY: y,
            screenX: x + this.GetLeft(),
            screenY: y + this.GetTop(),
            mapX: x,
            mapY: y,
            latLong: (arg.location) ? VELatLong._fromLocation(arg.location) : null,
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
                if (shape.metadata) {
                    e.elementID = shape.metadata.id;
                }
                else if (shape instanceof Microsoft.Maps.Map) {
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
            this._lastMouseUpTimer = setTimeout(function () {
                _this._lastMousedUpShapeId = null;
                _this._lastMouseButtonLeft = null;
                _this._lastMouseButtonRight = null;
                _this._lastMouseUpTimer = null;
            }, 1);
        }
        if (eventName === 'onmouseout') {
            this._infobox.setOptions({ visible: false });
        }
        return e;
    };
    VEMap.prototype._shapeHovered = function (e) {
        if (!this._disableInfoboxHover && (e.primitive.metadata.title || e.primitive.metadata.description)) {
            this._infobox.setOptions({
                location: (e.primitive instanceof Microsoft.Maps.Pushpin) ? e.primitive.getLocation() : Microsoft.Maps.SpatialMath.Geometry.centroid(e.primitive),
                title: e.primitive.metadata.title || '',
                description: e.primitive.metadata.description || '',
                offset: (e.primitive.metadata.parent && e.primitive.metadata.parent._infoboxOffset) ? e.primitive.metadata.parent._infoboxOffset : null,
                visible: true
            });
        }
    };
    /////////////////////
    //Not Supported
    ////////////////////
    VEMap.prototype.AddControl = function () { };
    VEMap.prototype.AddCustomLayer = function () { };
    VEMap.prototype.ClearInfoBoxStyles = function () { };
    VEMap.prototype.DeleteControl = function () { };
    VEMap.prototype.EnableShapeDisplayThreshold = function () { };
    VEMap.prototype.EndContinuousPan = function () { };
    VEMap.prototype.GetAltitude = function () { return null; };
    VEMap.prototype.GetBirdseyeScene = function () { return null; };
    VEMap.prototype.GetImageryMetadata = function () { return null; };
    VEMap.prototype.GetPitch = function () { return 0; };
    VEMap.prototype.GetRoute = function () { return null; };
    VEMap.prototype.Hide3DNavigationControl = function () { };
    VEMap.prototype.HideControl = function () { };
    VEMap.prototype.HideDashboard = function () { };
    VEMap.prototype.HideFindControl = function () { };
    VEMap.prototype.HideMiniMap = function () { };
    VEMap.prototype.HideScalebar = function () { };
    VEMap.prototype.Import3DModel = function () { };
    VEMap.prototype.IsBirdseyeAvailable = function () { return false; };
    VEMap.prototype.PanToLatLong = function () { };
    VEMap.prototype.RemoveCustomLayer = function () { };
    VEMap.prototype.SetAltitude = function () { };
    VEMap.prototype.SetBirdseyeScene = function () { };
    VEMap.prototype.SetDashboardSize = function () { };
    VEMap.prototype.SetDefaultInfoboxStyles = function () { };
    VEMap.prototype.SetFailedShapeRequest = function () { };
    VEMap.prototype.SetMouseWheelZoomToCenter = function () { };
    VEMap.prototype.SetPitch = function () { };
    VEMap.prototype.SetPrintOptions = function () { };
    VEMap.prototype.SetScaleBarDistanceUnit = function () { };
    VEMap.prototype.SetShapeAccuracy = function () { };
    VEMap.prototype.SetShapesAccuracyRequestLimit = function () { };
    VEMap.prototype.SetTileBuffer = function () { };
    VEMap.prototype.SetTrafficLegendText = function () { };
    VEMap.prototype.Show3DBirdseye = function () { };
    VEMap.prototype.Show3DNavigationControl = function () { };
    VEMap.prototype.ShowControl = function () { };
    VEMap.prototype.ShowDashboard = function () { };
    VEMap.prototype.ShowDisambiguationDialog = function () { };
    VEMap.prototype.ShowFindControl = function () { };
    VEMap.prototype.ShowMessage = function () { };
    VEMap.prototype.ShowMiniMap = function () { };
    VEMap.prototype.ShowScaleBar = function () { };
    VEMap.prototype.StartContinuousPan = function () { };
    VEMap.prototype.Pan = function () { };
    return VEMap;
}());
var VEGeocodeOptions = (function () {
    function VEGeocodeOptions() {
    }
    return VEGeocodeOptions;
}());
var VEMatchCode;
(function (VEMatchCode) {
    VEMatchCode[VEMatchCode["None"] = 0] = "None";
    VEMatchCode[VEMatchCode["Good"] = 1] = "Good";
    VEMatchCode[VEMatchCode["Ambiguous"] = 2] = "Ambiguous";
    VEMatchCode[VEMatchCode["UpHierarchy"] = 3] = "UpHierarchy";
    VEMatchCode[VEMatchCode["Modified"] = 4] = "Modified";
})(VEMatchCode || (VEMatchCode = {}));
var VEMatchConfidence;
(function (VEMatchConfidence) {
    VEMatchConfidence[VEMatchConfidence["High"] = 0] = "High";
    VEMatchConfidence[VEMatchConfidence["Medium"] = 1] = "Medium";
    VEMatchConfidence[VEMatchConfidence["Low"] = 2] = "Low";
})(VEMatchConfidence || (VEMatchConfidence = {}));
var VELocationPrecision;
(function (VELocationPrecision) {
    VELocationPrecision[VELocationPrecision["Interpolated"] = 0] = "Interpolated";
    VELocationPrecision[VELocationPrecision["Rooftop"] = 1] = "Rooftop";
})(VELocationPrecision || (VELocationPrecision = {}));
var VEFindType;
(function (VEFindType) {
    VEFindType[VEFindType["Businesses"] = 0] = "Businesses";
})(VEFindType || (VEFindType = {}));
var VERouteOptions = (function () {
    function VERouteOptions() {
        this.DistanceUnit = VERouteDistanceUnit.Mile;
        this.DrawRoute = true;
        this.RouteColor = new VEColor(0, 169, 235, 0.7);
        this.RouteMode = VERouteMode.Driving;
        this.RouteOptimize = VERouteOptimize.MinimizeTime;
        this.RouteWeight = 6;
        this.SetBestMapView = true;
        this.UseTraffic = true;
        //Not Supported: RouteZIndex, ShowDisambiguation, ShowErrorMessage, UseMWS, 
    }
    return VERouteOptions;
}());
var VERouteDistanceUnit;
(function (VERouteDistanceUnit) {
    VERouteDistanceUnit[VERouteDistanceUnit["Mile"] = 0] = "Mile";
    VERouteDistanceUnit[VERouteDistanceUnit["Kilometer"] = 1] = "Kilometer";
})(VERouteDistanceUnit || (VERouteDistanceUnit = {}));
var VERouteMode;
(function (VERouteMode) {
    VERouteMode[VERouteMode["Driving"] = 0] = "Driving";
    VERouteMode[VERouteMode["Walking"] = 1] = "Walking";
})(VERouteMode || (VERouteMode = {}));
var VERouteOptimize;
(function (VERouteOptimize) {
    VERouteOptimize[VERouteOptimize["MinimizeTime"] = 0] = "MinimizeTime";
    VERouteOptimize[VERouteOptimize["MinimizeDistance"] = 1] = "MinimizeDistance";
})(VERouteOptimize || (VERouteOptimize = {}));
var VERouteWarningSeverity;
(function (VERouteWarningSeverity) {
    VERouteWarningSeverity[VERouteWarningSeverity["None"] = 0] = "None";
    VERouteWarningSeverity[VERouteWarningSeverity["LowImpact"] = 1] = "LowImpact";
    VERouteWarningSeverity[VERouteWarningSeverity["Minor"] = 2] = "Minor";
    VERouteWarningSeverity[VERouteWarningSeverity["Moderate"] = 3] = "Moderate";
    VERouteWarningSeverity[VERouteWarningSeverity["Serious"] = 4] = "Serious";
})(VERouteWarningSeverity || (VERouteWarningSeverity = {}));
var VERouteHintType;
(function (VERouteHintType) {
    VERouteHintType[VERouteHintType["PreviousIntersection"] = 0] = "PreviousIntersection";
    VERouteHintType[VERouteHintType["NextIntersection"] = 1] = "NextIntersection";
    VERouteHintType[VERouteHintType["Landmark"] = 2] = "Landmark";
})(VERouteHintType || (VERouteHintType = {}));
var VEShapeSourceSpecification = (function () {
    function VEShapeSourceSpecification(dataType, dataSource, layer) {
        //Not Supported
        this.MaxImportedShapes = 200;
        this.Layer = layer;
        this.LayerSource = dataSource;
        this.Type = dataType;
    }
    return VEShapeSourceSpecification;
}());
var VEDataType = (function () {
    function VEDataType() {
    }
    return VEDataType;
}());
VEDataType.GeoRSS = 'g';
VEDataType.VECollection = 'c';
VEDataType.ImportXML = 'i';
VEDataType.VETileSource = 't';
var VESearchOptions = (function () {
    function VESearchOptions() {
        this.CreateResults = true;
        this.NumberOfResults = 10;
        this.SetBestMapView = true;
        this.ShowResults = true;
        this.StartIndex = 0;
        //Not supported
        this.BoundingRectangle = null;
    }
    return VESearchOptions;
}());
/////////////////////
//Not Supported
////////////////////
var VEAltitudeMode;
(function (VEAltitudeMode) {
    VEAltitudeMode[VEAltitudeMode["Default"] = 0] = "Default";
    VEAltitudeMode[VEAltitudeMode["Absolute"] = 1] = "Absolute";
    VEAltitudeMode[VEAltitudeMode["RelativeToGround"] = 2] = "RelativeToGround";
})(VEAltitudeMode || (VEAltitudeMode = {}));
var VEBirdseyeScene = (function () {
    function VEBirdseyeScene() {
    }
    return VEBirdseyeScene;
}());
var VEClusteringOptions = (function () {
    function VEClusteringOptions() {
    }
    return VEClusteringOptions;
}());
var VEClusteringType;
(function (VEClusteringType) {
    VEClusteringType[VEClusteringType["None"] = 0] = "None";
    VEClusteringType[VEClusteringType["Grid"] = 1] = "Grid";
})(VEClusteringType || (VEClusteringType = {}));
var VEClusterSpecification = (function () {
    function VEClusterSpecification() {
    }
    return VEClusterSpecification;
}());
var VEDashboardSize = (function () {
    function VEDashboardSize() {
    }
    return VEDashboardSize;
}());
VEDashboardSize.Normal = 'normal';
VEDashboardSize.Small = 'small';
VEDashboardSize.Tiny = 'tiny';
var VEDistanceUnit = (function () {
    function VEDistanceUnit() {
    }
    return VEDistanceUnit;
}());
VEDistanceUnit.Miles = 'm';
VEDistanceUnit.Kilometers = 'k';
var VEFailedShapeRequest;
(function (VEFailedShapeRequest) {
    VEFailedShapeRequest[VEFailedShapeRequest["DoNotDraw"] = 0] = "DoNotDraw";
    VEFailedShapeRequest[VEFailedShapeRequest["DrawInaccurately"] = 1] = "DrawInaccurately";
    VEFailedShapeRequest[VEFailedShapeRequest["QueueRequest"] = 2] = "QueueRequest";
})(VEFailedShapeRequest || (VEFailedShapeRequest = {}));
var VEImageryMetadata = (function () {
    function VEImageryMetadata() {
    }
    return VEImageryMetadata;
}());
var VEImageryMetadataOptions = (function () {
    function VEImageryMetadataOptions() {
    }
    return VEImageryMetadataOptions;
}());
var VEMiniMapSize;
(function (VEMiniMapSize) {
    VEMiniMapSize[VEMiniMapSize["Small"] = 0] = "Small";
    VEMiniMapSize[VEMiniMapSize["Large"] = 1] = "Large";
})(VEMiniMapSize || (VEMiniMapSize = {}));
var VEModelFormat;
(function (VEModelFormat) {
    VEModelFormat[VEModelFormat["OBJ"] = 0] = "OBJ";
})(VEModelFormat || (VEModelFormat = {}));
var VEModelOrientation = (function () {
    function VEModelOrientation() {
    }
    return VEModelOrientation;
}());
var VEModelScale = (function () {
    function VEModelScale() {
    }
    return VEModelScale;
}());
var VEModelScaleUnit;
(function (VEModelScaleUnit) {
    VEModelScaleUnit[VEModelScaleUnit["Inches"] = 0] = "Inches";
    VEModelScaleUnit[VEModelScaleUnit["Feet"] = 1] = "Feet";
    VEModelScaleUnit[VEModelScaleUnit["Yards"] = 2] = "Yards";
    VEModelScaleUnit[VEModelScaleUnit["Millimeters"] = 3] = "Millimeters";
    VEModelScaleUnit[VEModelScaleUnit["Centimeters"] = 4] = "Centimeters";
    VEModelScaleUnit[VEModelScaleUnit["Meters"] = 5] = "Meters";
})(VEModelScaleUnit || (VEModelScaleUnit = {}));
var VEModelSourceSpecification = (function () {
    function VEModelSourceSpecification() {
    }
    return VEModelSourceSpecification;
}());
var VEModelStatusCode;
(function (VEModelStatusCode) {
    VEModelStatusCode[VEModelStatusCode["Success"] = 0] = "Success";
    VEModelStatusCode[VEModelStatusCode["InvalidURL"] = 1] = "InvalidURL";
    VEModelStatusCode[VEModelStatusCode["Failed"] = 2] = "Failed";
})(VEModelStatusCode || (VEModelStatusCode = {}));
var VEPrintOptions = (function () {
    function VEPrintOptions() {
    }
    return VEPrintOptions;
}());
var VERouteDeprected = (function () {
    function VERouteDeprected() {
    }
    return VERouteDeprected;
}());
var VERouteItineraryDeprecated = (function () {
    function VERouteItineraryDeprecated() {
    }
    return VERouteItineraryDeprecated;
}());
var VERouteType = (function () {
    function VERouteType() {
    }
    return VERouteType;
}());
VERouteType.Shortest = 'q';
VERouteType.Quickest = 's';
var VEShapeAccuracy;
(function (VEShapeAccuracy) {
    VEShapeAccuracy[VEShapeAccuracy["None"] = 0] = "None";
    VEShapeAccuracy[VEShapeAccuracy["Pushpin"] = 1] = "Pushpin";
})(VEShapeAccuracy || (VEShapeAccuracy = {}));
//# sourceMappingURL=BingMapsV63ToV8Shim.js.map