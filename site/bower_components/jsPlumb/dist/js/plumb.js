/**
 * Created by root on 28/5/15.
 */
}), t(a)
}, this.clearFor = function(a) {
    delete b[a], b[a] = []
};
var u = function(b, c, d, e, f, g, h, i, j, k, l, m) {
    var n = -1,
        o = -1,
        p = e.endpoints[h],
        q = p.id,
        r = [1, 0][h],
        s = [
            [c, d], e, f, g, q
        ],
        t = b[j],
        u = p._continuousAnchorEdge ? b[p._continuousAnchorEdge] : null;
    if (u) {
        var v = jsPlumbUtil.findWithFunction(u, function(a) {
            return a[4] == q
        });
        if (-1 != v) {
            u.splice(v, 1);
            for (var w = 0; w < u.length; w++) jsPlumbUtil.addWithFunction(l, u[w][1], function(a) {
                return a.id == u[w][1].id
            }), jsPlumbUtil.addWithFunction(m, u[w][1].endpoints[h], function(a) {
                return a.id == u[w][1].endpoints[h].id
            }), jsPlumbUtil.addWithFunction(m, u[w][1].endpoints[r], function(a) {
                return a.id == u[w][1].endpoints[r].id
            })
        }
    }
    for (w = 0; w < t.length; w++) 1 == a.idx && t[w][3] === g && -1 == o && (o = w), jsPlumbUtil.addWithFunction(l, t[w][1], function(a) {
        return a.id == t[w][1].id
    }), jsPlumbUtil.addWithFunction(m, t[w][1].endpoints[h], function(a) {
        return a.id == t[w][1].endpoints[h].id
    }), jsPlumbUtil.addWithFunction(m, t[w][1].endpoints[r], function(a) {
        return a.id == t[w][1].endpoints[r].id
    });
    if (-1 != n) t[n] = s;
    else {
        var x = i ? -1 != o ? o : 0 : t.length;
        t.splice(x, 0, s)
    }
    p._continuousAnchorEdge = j
};
this.updateOtherEndpoint = function(a, b, c, d) {
    var e = jsPlumbUtil.findWithFunction(h[a], function(a) {
            return a[0].id === d.id
        }),
        f = jsPlumbUtil.findWithFunction(h[b], function(a) {
            return a[0].id === d.id
        }); - 1 != e && (h[a][e][0] = d, h[a][e][1] = d.endpoints[1], h[a][e][2] = d.endpoints[1].anchor.constructor == jsPlumb.DynamicAnchor), f > -1 && (h[b].splice(f, 1), jsPlumbUtil.addToList(h, c, [d, d.endpoints[0], d.endpoints[0].anchor.constructor == jsPlumb.DynamicAnchor]))
}, this.sourceChanged = function(a, b, c) {
    if (a !== b) {
        jsPlumbUtil.removeWithFunction(h[a], function(a) {
            return a[0].id === c.id
        });
        var d = jsPlumbUtil.findWithFunction(h[c.targetId], function(a) {
            return a[0].id === c.id
        });
        d > -1 && (h[c.targetId][d][0] = c, h[c.targetId][d][1] = c.endpoints[0], h[c.targetId][d][2] = c.endpoints[0].anchor.constructor == jsPlumb.DynamicAnchor), jsPlumbUtil.addToList(h, b, [c, c.endpoints[1], c.endpoints[1].anchor.constructor == jsPlumb.DynamicAnchor])
    }
}, this.rehomeEndpoint = function(a, c, d) {
    var e = b[c] || [],
        f = k.getId(d);
    if (f !== c) {
        var g = jsPlumbUtil.indexOf(e, a);
        if (g > -1) {
            var h = e.splice(g, 1)[0];
            i.add(h, f)
        }
    }
    for (var j = 0; j < a.connections.length; j++) a.connections[j].sourceId == c ? (a.connections[j].sourceId = a.elementId, a.connections[j].source = a.element, i.sourceChanged(c, a.elementId, a.connections[j])) : a.connections[j].targetId == c && (a.connections[j].targetId = a.elementId, a.connections[j].target = a.element, i.updateOtherEndpoint(a.connections[j].sourceId, c, a.elementId, a.connections[j]))
}, this.redraw = function(a, c, d, e, f, g) {
    if (!k.isSuspendDrawing()) {
        var i = b[a] || [],
            n = h[a] || [],
            o = [],
            p = [],
            q = [];
        d = d || k.timestamp(), e = e || {
                left: 0,
                top: 0
            }, c && (c = {
            left: c.left + e.left,
            top: c.top + e.top
        });
        for (var r = k.updateOffset({
            elId: a,
            offset: c,
            recalc: !1,
            timestamp: d
        }), t = {}, v = 0; v < n.length; v++) {
            var w = n[v][0],
                x = w.sourceId,
                y = w.targetId,
                z = w.endpoints[0].anchor.isContinuous,
                A = w.endpoints[1].anchor.isContinuous;
            if (z || A) {
                var B = x + "_" + y,
                    C = t[B],
                    D = w.sourceId == a ? 1 : 0;
                z && !j[x] && (j[x] = {
                    top: [],
                    right: [],
                    bottom: [],
                    left: []
                }), A && !j[y] && (j[y] = {
                    top: [],
                    right: [],
                    bottom: [],
                    left: []
                }), a != y && k.updateOffset({
                    elId: y,
                    timestamp: d
                }), a != x && k.updateOffset({
                    elId: x,
                    timestamp: d
                });
                var E = k.getCachedData(y),
                    F = k.getCachedData(x);
                y == x && (z || A) ? u(j[x], -Math.PI / 2, 0, w, !1, y, 0, !1, "top", x, o, p) : (C || (C = m(x, y, F.o, E.o, w.endpoints[0].anchor, w.endpoints[1].anchor), t[B] = C), z && u(j[x], C.theta, 0, w, !1, y, 0, !1, C.a[0], x, o, p), A && u(j[y], C.theta2, -1, w, !0, x, 1, !0, C.a[1], y, o, p)), z && jsPlumbUtil.addWithFunction(q, x, function(a) {
                    return a === x
                }), A && jsPlumbUtil.addWithFunction(q, y, function(a) {
                    return a === y
                }), jsPlumbUtil.addWithFunction(o, w, function(a) {
                    return a.id == w.id
                }), (z && 0 === D || A && 1 === D) && jsPlumbUtil.addWithFunction(p, w.endpoints[D], function(a) {
                    return a.id == w.endpoints[D].id
                })
            }
        }
        for (v = 0; v < i.length; v++) 0 === i[v].connections.length && i[v].anchor.isContinuous && (j[a] || (j[a] = {
            top: [],
            right: [],
            bottom: [],
            left: []
        }), u(j[a], -Math.PI / 2, 0, {
            endpoints: [i[v], i[v]],
            paint: function() {}
        }, !1, a, 0, !1, "top", a, o, p), jsPlumbUtil.addWithFunction(q, a, function(b) {
            return b === a
        }));
        for (v = 0; v < q.length; v++) s(q[v], j[q[v]]);
        for (v = 0; v < i.length; v++) i[v].paint({
            timestamp: d,
            offset: r,
            dimensions: r.s,
            recalc: g !== !0
        });
        for (v = 0; v < p.length; v++) {
            var G = k.getCachedData(p[v].elementId);
            p[v].paint({
                timestamp: d,
                offset: G,
                dimensions: G.s
            })
        }
        for (v = 0; v < n.length; v++) {
            var H = n[v][1];
            if (H.anchor.constructor == jsPlumb.DynamicAnchor) {
                H.paint({
                    elementWithPrecedence: a,
                    timestamp: d
                }), jsPlumbUtil.addWithFunction(o, n[v][0], function(a) {
                    return a.id == n[v][0].id
                });
                for (var I = 0; I < H.connections.length; I++) H.connections[I] !== n[v][0] && jsPlumbUtil.addWithFunction(o, H.connections[I], function(a) {
                    return a.id == H.connections[I].id
                })
            } else H.anchor.constructor == jsPlumb.Anchor && jsPlumbUtil.addWithFunction(o, n[v][0], function(a) {
                return a.id == n[v][0].id
            })
        }
        var J = l[a];
        for (J && J.paint({
            timestamp: d,
            recalc: !1,
            elId: a
        }), v = 0; v < o.length; v++) {
            var K = d;
            o[v].paint({
                elId: a,
                timestamp: K,
                recalc: !1,
                clearEdits: f
            })
        }
    }
};
var v = function(a) {
    jsPlumbUtil.EventGenerator.apply(this), this.type = "Continuous", this.isDynamic = !0, this.isContinuous = !0;
    for (var b = a.faces || ["top", "right", "bottom", "left"], c = !(a.clockwise === !1), g = {}, h = {
        top: "bottom",
        right: "left",
        left: "right",
        bottom: "top"
    }, i = {
        top: "right",
        right: "bottom",
        left: "top",
        bottom: "left"
    }, j = {
        top: "left",
        right: "top",
        left: "bottom",
        bottom: "right"
    }, k = c ? i : j, l = c ? j : i, m = a.cssClass || "", n = 0; n < b.length; n++) g[b[n]] = !0;
    this.verifyEdge = function(a) {
        return g[a] ? a : g[h[a]] ? h[a] : g[k[a]] ? k[a] : g[l[a]] ? l[a] : a
    }, this.compute = function(a) {
        return e[a.element.id] || d[a.element.id] || [0, 0]
    }, this.getCurrentLocation = function(a) {
        return e[a.element.id] || d[a.element.id] || [0, 0]
    }, this.getOrientation = function(a) {
        return f[a.id] || [0, 0]
    }, this.clearUserDefinedLocation = function() {
        delete e[a.elementId]
    }, this.setUserDefinedLocation = function(b) {
        e[a.elementId] = b
    }, this.getCssClass = function() {
        return m
    }, this.setCssClass = function(a) {
        m = a
    }
};
k.continuousAnchorFactory = {
    get: function(a) {
        var b = c[a.elementId];
        return b || (b = new v(a), c[a.elementId] = b), b
    },
    clear: function(a) {
        delete c[a]
    }
}
}, jsPlumb.Anchor = function(a) {
    this.x = a.x || 0, this.y = a.y || 0, this.elementId = a.elementId, this.cssClass = a.cssClass || "", this.userDefinedLocation = null, this.orientation = a.orientation || [0, 0], jsPlumbUtil.EventGenerator.apply(this), a.jsPlumbInstance, this.lastReturnValue = null, this.offsets = a.offsets || [0, 0], this.timestamp = null, this.compute = function(a) {
        var b = a.xy,
            c = a.wh,
            d = (a.element, a.timestamp);
        return a.clearUserDefinedLocation && (this.userDefinedLocation = null), d && d === self.timestamp ? this.lastReturnValue : (this.lastReturnValue = null != this.userDefinedLocation ? this.userDefinedLocation : [b[0] + this.x * c[0] + this.offsets[0], b[1] + this.y * c[1] + this.offsets[1]], this.timestamp = d, this.lastReturnValue)
    }, this.getCurrentLocation = function(a) {
        return null == this.lastReturnValue || null != a.timestamp && this.timestamp != a.timestamp ? this.compute(a) : this.lastReturnValue
    }
}, jsPlumbUtil.extend(jsPlumb.Anchor, jsPlumbUtil.EventGenerator, {
    equals: function(a) {
        if (!a) return !1;
        var b = a.getOrientation(),
            c = this.getOrientation();
        return this.x == a.x && this.y == a.y && this.offsets[0] == a.offsets[0] && this.offsets[1] == a.offsets[1] && c[0] == b[0] && c[1] == b[1]
    },
    getUserDefinedLocation: function() {
        return this.userDefinedLocation
    },
    setUserDefinedLocation: function(a) {
        this.userDefinedLocation = a
    },
    clearUserDefinedLocation: function() {
        this.userDefinedLocation = null
    },
    getOrientation: function() {
        return this.orientation
    },
    getCssClass: function() {
        return this.cssClass
    }
}), jsPlumb.FloatingAnchor = function(a) {
    jsPlumb.Anchor.apply(this, arguments);
    var b = a.reference,
        c = (a.jsPlumbInstance, a.referenceCanvas),
        d = jsPlumb.getSize(c),
        e = 0,
        f = 0,
        g = null,
        h = null;
    this.orientation = null, this.x = 0, this.y = 0, this.isFloating = !0, this.compute = function(a) {
        var b = a.xy,
            c = (a.element, [b[0] + d[0] / 2, b[1] + d[1] / 2]);
        return h = c, c
    }, this.getOrientation = function(a) {
        if (g) return g;
        var c = b.getOrientation(a);
        return [-1 * Math.abs(c[0]) * e, -1 * Math.abs(c[1]) * f]
    }, this.over = function(a, b) {
        g = a.getOrientation(b)
    }, this.out = function() {
        g = null
    }, this.getCurrentLocation = function(a) {
        return null == h ? this.compute(a) : h
    }
}, jsPlumbUtil.extend(jsPlumb.FloatingAnchor, jsPlumb.Anchor);
var a = function(a, b, c) {
    return a.constructor == jsPlumb.Anchor ? a : b.makeAnchor(a, c, b)
};
jsPlumb.DynamicAnchor = function(b) {
    jsPlumb.Anchor.apply(this, arguments), this.isSelective = !0, this.isDynamic = !0, this.anchors = [], this.elementId = b.elementId, this.jsPlumbInstance = b.jsPlumbInstance;
    for (var c = 0; c < b.anchors.length; c++) this.anchors[c] = a(b.anchors[c], this.jsPlumbInstance, this.elementId);
    this.addAnchor = function(b) {
        this.anchors.push(a(b, this.jsPlumbInstance, this.elementId))
    }, this.getAnchors = function() {
        return this.anchors
    }, this.locked = !1;
    var d = this.anchors.length > 0 ? this.anchors[0] : null,
        e = (this.anchors.length > 0 ? 0 : -1, d),
        f = this,
        g = function(a, b, c, d, e) {
            var f = d[0] + a.x * e[0],
                g = d[1] + a.y * e[1],
                h = d[0] + e[0] / 2,
                i = d[1] + e[1] / 2;
            return Math.sqrt(Math.pow(b - f, 2) + Math.pow(c - g, 2)) + Math.sqrt(Math.pow(h - f, 2) + Math.pow(i - g, 2))
        },
        h = b.selector || function(a, b, c, d, e) {
                for (var f = c[0] + d[0] / 2, h = c[1] + d[1] / 2, i = -1, j = 1 / 0, k = 0; k < e.length; k++) {
                    var l = g(e[k], f, h, a, b);
                    j > l && (i = k + 0, j = l)
                }
                return e[i]
            };
    this.compute = function(a) {
        var b = a.xy,
            c = a.wh,
            g = a.timestamp,
            i = a.txy,
            j = a.twh;
        a.clearUserDefinedLocation && (userDefinedLocation = null), this.timestamp = g;
        var k = f.getUserDefinedLocation();
        return null != k ? k : this.locked || null == i || null == j ? d.compute(a) : (a.timestamp = null, d = h(b, c, i, j, this.anchors), this.x = d.x, this.y = d.y, d != e && this.fire("anchorChanged", d), e = d, d.compute(a))
    }, this.getCurrentLocation = function(a) {
        return this.getUserDefinedLocation() || (null != d ? d.getCurrentLocation(a) : null)
    }, this.getOrientation = function(a) {
        return null != d ? d.getOrientation(a) : [0, 0]
    }, this.over = function(a, b) {
        null != d && d.over(a, b)
    }, this.out = function() {
        null != d && d.out()
    }, this.getCssClass = function() {
        return d && d.getCssClass() || ""
    }
}, jsPlumbUtil.extend(jsPlumb.DynamicAnchor, jsPlumb.Anchor);
var b = function(a, b, c, d, e, f) {
    jsPlumb.Anchors[e] = function(g) {
        var h = g.jsPlumbInstance.makeAnchor([a, b, c, d, 0, 0], g.elementId, g.jsPlumbInstance);
        return h.type = e, f && f(h, g), h
    }
};
b(.5, 0, 0, -1, "TopCenter"), b(.5, 1, 0, 1, "BottomCenter"), b(0, .5, -1, 0, "LeftMiddle"), b(1, .5, 1, 0, "RightMiddle"), b(.5, 0, 0, -1, "Top"), b(.5, 1, 0, 1, "Bottom"), b(0, .5, -1, 0, "Left"), b(1, .5, 1, 0, "Right"), b(.5, .5, 0, 0, "Center"), b(1, 0, 0, -1, "TopRight"), b(1, 1, 0, 1, "BottomRight"), b(0, 0, 0, -1, "TopLeft"), b(0, 1, 0, 1, "BottomLeft"), jsPlumb.Defaults.DynamicAnchors = function(a) {
    return a.jsPlumbInstance.makeAnchors(["TopCenter", "RightMiddle", "BottomCenter", "LeftMiddle"], a.elementId, a.jsPlumbInstance)
}, jsPlumb.Anchors.AutoDefault = function(a) {
    var b = a.jsPlumbInstance.makeDynamicAnchor(jsPlumb.Defaults.DynamicAnchors(a));
    return b.type = "AutoDefault", b
};
var c = function(a, b) {
    jsPlumb.Anchors[a] = function(c) {
        var d = c.jsPlumbInstance.makeAnchor(["Continuous", {
            faces: b
        }], c.elementId, c.jsPlumbInstance);
        return d.type = a, d
    }
};
jsPlumb.Anchors.Continuous = function(a) {
    return a.jsPlumbInstance.continuousAnchorFactory.get(a)
}, c("ContinuousLeft", ["left"]), c("ContinuousTop", ["top"]), c("ContinuousBottom", ["bottom"]), c("ContinuousRight", ["right"]), b(0, 0, 0, 0, "Assign", function(a, b) {
    var c = b.position || "Fixed";
    a.positionFinder = c.constructor == String ? b.jsPlumbInstance.AnchorPositionFinders[c] : c, a.constructorParams = b
}), jsPlumbInstance.prototype.AnchorPositionFinders = {
    Fixed: function(a, b, c) {
        return [(a.left - b.left) / c[0], (a.top - b.top) / c[1]]
    },
    Grid: function(a, b, c, d) {
        var e = a.left - b.left,
            f = a.top - b.top,
            g = c[0] / d.grid[0],
            h = c[1] / d.grid[1],
            i = Math.floor(e / g),
            j = Math.floor(f / h);
        return [(i * g + g / 2) / c[0], (j * h + h / 2) / c[1]]
    }
}, jsPlumb.Anchors.Perimeter = function(a) {
    a = a || {};
    var b = a.anchorCount || 60,
        c = a.shape;
    if (!c) throw new Error("no shape supplied to Perimeter Anchor type");
    var d = function() {
            for (var a = .5, c = 2 * Math.PI / b, d = 0, e = [], f = 0; b > f; f++) {
                var g = a + a * Math.sin(d),
                    h = a + a * Math.cos(d);
                e.push([g, h, 0, 0]), d += c
            }
            return e
        },
        e = function(a) {
            for (var c = b / a.length, d = [], e = function(a, e, f, g, h) {
                c = b * h;
                for (var i = (f - a) / c, j = (g - e) / c, k = 0; c > k; k++) d.push([a + i * k, e + j * k, 0, 0])
            }, f = 0; f < a.length; f++) e.apply(null, a[f]);
            return d
        },
        f = function(a) {
            for (var b = [], c = 0; c < a.length; c++) b.push([a[c][0], a[c][1], a[c][2], a[c][3], 1 / a.length]);
            return e(b)
        },
        g = function() {
            return f([
                [0, 0, 1, 0],
                [1, 0, 1, 1],
                [1, 1, 0, 1],
                [0, 1, 0, 0]
            ])
        },
        h = {
            Circle: d,
            Ellipse: d,
            Diamond: function() {
                return f([
                    [.5, 0, 1, .5],
                    [1, .5, .5, 1],
                    [.5, 1, 0, .5],
                    [0, .5, .5, 0]
                ])
            },
            Rectangle: g,
            Square: g,
            Triangle: function() {
                return f([
                    [.5, 0, 1, 1],
                    [1, 1, 0, 1],
                    [0, 1, .5, 0]
                ])
            },
            Path: function(a) {
                for (var b = a.points, c = [], d = 0, f = 0; f < b.length - 1; f++) {
                    var g = Math.sqrt(Math.pow(b[f][2] - b[f][0]) + Math.pow(b[f][3] - b[f][1]));
                    d += g, c.push([b[f][0], b[f][1], b[f + 1][0], b[f + 1][1], g])
                }
                for (var h = 0; h < c.length; h++) c[h][4] = c[h][4] / d;
                return e(c)
            }
        },
        i = function(a, b) {
            for (var c = [], d = b / 180 * Math.PI, e = 0; e < a.length; e++) {
                var f = a[e][0] - .5,
                    g = a[e][1] - .5;
                c.push([.5 + (f * Math.cos(d) - g * Math.sin(d)), .5 + (f * Math.sin(d) + g * Math.cos(d)), a[e][2], a[e][3]])
            }
            return c
        };
    if (!h[c]) throw new Error("Shape [" + c + "] is unknown by Perimeter Anchor type");
    var j = h[c](a);
    a.rotation && (j = i(j, a.rotation));
    var k = a.jsPlumbInstance.makeDynamicAnchor(j);
    return k.type = "Perimeter", k
}
}(),
    function() {
        "use strict";
        jsPlumb.DOMElementComponent = jsPlumbUtil.extend(jsPlumb.jsPlumbUIComponent, function() {
            this.mousemove = this.dblclick = this.click = this.mousedown = this.mouseup = function() {}
        }), jsPlumb.Segments = {
            AbstractSegment: function(a) {
                this.params = a, this.findClosestPointOnPath = function() {
                    return {
                        d: 1 / 0,
                        x: null,
                        y: null,
                        l: null
                    }
                }, this.getBounds = function() {
                    return {
                        minX: Math.min(a.x1, a.x2),
                        minY: Math.min(a.y1, a.y2),
                        maxX: Math.max(a.x1, a.x2),
                        maxY: Math.max(a.y1, a.y2)
                    }
                }
            },
            Straight: function(a) {
                var b, c, d, e, f, g, h, i = (jsPlumb.Segments.AbstractSegment.apply(this, arguments), function() {
                    b = Math.sqrt(Math.pow(f - e, 2) + Math.pow(h - g, 2)), c = Biltong.gradient({
                        x: e,
                        y: g
                    }, {
                        x: f,
                        y: h
                    }), d = -1 / c
                });
                this.type = "Straight", this.getLength = function() {
                    return b
                }, this.getGradient = function() {
                    return c
                }, this.getCoordinates = function() {
                    return {
                        x1: e,
                        y1: g,
                        x2: f,
                        y2: h
                    }
                }, this.setCoordinates = function(a) {
                    e = a.x1, g = a.y1, f = a.x2, h = a.y2, i()
                }, this.setCoordinates({
                    x1: a.x1,
                    y1: a.y1,
                    x2: a.x2,
                    y2: a.y2
                }), this.getBounds = function() {
                    return {
                        minX: Math.min(e, f),
                        minY: Math.min(g, h),
                        maxX: Math.max(e, f),
                        maxY: Math.max(g, h)
                    }
                }, this.pointOnPath = function(a, c) {
                    if (0 !== a || c) {
                        if (1 != a || c) {
                            var d = c ? a > 0 ? a : b + a : a * b;
                            return Biltong.pointOnLine({
                                x: e,
                                y: g
                            }, {
                                x: f,
                                y: h
                            }, d)
                        }
                        return {
                            x: f,
                            y: h
                        }
                    }
                    return {
                        x: e,
                        y: g
                    }
                }, this.gradientAtPoint = function() {
                    return c
                }, this.pointAlongPathFrom = function(a, b, c) {
                    var d = this.pointOnPath(a, c),
                        i = 0 >= b ? {
                            x: e,
                            y: g
                        } : {
                            x: f,
                            y: h
                        };
                    return 0 >= b && Math.abs(b) > 1 && (b *= -1), Biltong.pointOnLine(d, i, b)
                };
                var j = function(a, b, c) {
                        return c >= Math.min(a, b) && c <= Math.max(a, b)
                    },
                    k = function(a, b, c) {
                        return Math.abs(c - a) < Math.abs(c - b) ? a : b
                    };
                this.findClosestPointOnPath = function(a, i) {
                    var l = {
                        d: 1 / 0,
                        x: null,
                        y: null,
                        l: null,
                        x1: e,
                        x2: f,
                        y1: g,
                        y2: h
                    };
                    if (0 === c) l.y = g, l.x = j(e, f, a) ? a : k(e, f, a);
                    else if (1 / 0 == c || c == -1 / 0) l.x = e, l.y = j(g, h, i) ? i : k(g, h, i);
                    else {
                        var m = g - c * e,
                            n = i - d * a,
                            o = (n - m) / (c - d),
                            p = c * o + m;
                        l.x = j(e, f, o) ? o : k(e, f, o), l.y = j(g, h, p) ? p : k(g, h, p)
                    }
                    var q = Biltong.lineLength([l.x, l.y], [e, g]);
                    return l.d = Biltong.lineLength([a, i], [l.x, l.y]), l.l = q / b, l
                }
            },
            Arc: function(a) {
                var b = (jsPlumb.Segments.AbstractSegment.apply(this, arguments), function(b, c) {
                        return Biltong.theta([a.cx, a.cy], [b, c])
                    }),
                    c = function(a, b) {
                        if (a.anticlockwise) {
                            var c = a.startAngle < a.endAngle ? a.startAngle + d : a.startAngle,
                                e = Math.abs(c - a.endAngle);
                            return c - e * b
                        }
                        var f = a.endAngle < a.startAngle ? a.endAngle + d : a.endAngle,
                            g = Math.abs(f - a.startAngle);
                        return a.startAngle + g * b
                    },
                    d = 2 * Math.PI;
                this.radius = a.r, this.anticlockwise = a.ac, this.type = "Arc", a.startAngle && a.endAngle ? (this.startAngle = a.startAngle, this.endAngle = a.endAngle, this.x1 = a.cx + this.radius * Math.cos(a.startAngle), this.y1 = a.cy + this.radius * Math.sin(a.startAngle), this.x2 = a.cx + this.radius * Math.cos(a.endAngle), this.y2 = a.cy + this.radius * Math.sin(a.endAngle)) : (this.startAngle = b(a.x1, a.y1), this.endAngle = b(a.x2, a.y2), this.x1 = a.x1, this.y1 = a.y1, this.x2 = a.x2, this.y2 = a.y2), this.endAngle < 0 && (this.endAngle += d), this.startAngle < 0 && (this.startAngle += d), this.segment = Biltong.quadrant([this.x1, this.y1], [this.x2, this.y2]);
                var e = this.endAngle < this.startAngle ? this.endAngle + d : this.endAngle;
                this.sweep = Math.abs(e - this.startAngle), this.anticlockwise && (this.sweep = d - this.sweep);
                var f = 2 * Math.PI * this.radius,
                    g = this.sweep / d,
                    h = f * g;
                this.getLength = function() {
                    return h
                }, this.getBounds = function() {
                    return {
                        minX: a.cx - a.r,
                        maxX: a.cx + a.r,
                        minY: a.cy - a.r,
                        maxY: a.cy + a.r
                    }
                };
                var i = 1e-10,
                    j = function(a) {
                        var b = Math.floor(a),
                            c = Math.ceil(a);
                        return i > a - b ? b : i > c - a ? c : a
                    };
                this.pointOnPath = function(b, d) {
                    if (0 === b) return {
                        x: this.x1,
                        y: this.y1,
                        theta: this.startAngle
                    };
                    if (1 == b) return {
                        x: this.x2,
                        y: this.y2,
                        theta: this.endAngle
                    };
                    d && (b /= h);
                    var e = c(this, b),
                        f = a.cx + a.r * Math.cos(e),
                        g = a.cy + a.r * Math.sin(e);
                    return {
                        x: j(f),
                        y: j(g),
                        theta: e
                    }
                }, this.gradientAtPoint = function(b, c) {
                    var d = this.pointOnPath(b, c),
                        e = Biltong.normal([a.cx, a.cy], [d.x, d.y]);
                    return this.anticlockwise || 1 / 0 != e && e != -1 / 0 || (e *= -1), e
                }, this.pointAlongPathFrom = function(b, c, d) {
                    var e = this.pointOnPath(b, d),
                        g = 2 * (c / f) * Math.PI,
                        h = this.anticlockwise ? -1 : 1,
                        i = e.theta + h * g,
                        j = a.cx + this.radius * Math.cos(i),
                        k = a.cy + this.radius * Math.sin(i);
                    return {
                        x: j,
                        y: k
                    }
                }
            },
            Bezier: function(a) {
                var b = (jsPlumb.Segments.AbstractSegment.apply(this, arguments), [{
                        x: a.x1,
                        y: a.y1
                    }, {
                        x: a.cp1x,
                        y: a.cp1y
                    }, {
                        x: a.cp2x,
                        y: a.cp2y
                    }, {
                        x: a.x2,
                        y: a.y2
                    }]),
                    c = {
                        minX: Math.min(a.x1, a.x2, a.cp1x, a.cp2x),
                        minY: Math.min(a.y1, a.y2, a.cp1y, a.cp2y),
                        maxX: Math.max(a.x1, a.x2, a.cp1x, a.cp2x),
                        maxY: Math.max(a.y1, a.y2, a.cp1y, a.cp2y)
                    };
                this.type = "Bezier";
                var d = function(a, b, c) {
                    return c && (b = jsBezier.locationAlongCurveFrom(a, b > 0 ? 0 : 1, b)), b
                };
                this.pointOnPath = function(a, c) {
                    return a = d(b, a, c), jsBezier.pointOnCurve(b, a)
                }, this.gradientAtPoint = function(a, c) {
                    return a = d(b, a, c), jsBezier.gradientAtPoint(b, a)
                }, this.pointAlongPathFrom = function(a, c, e) {
                    return a = d(b, a, e), jsBezier.pointAlongCurveFrom(b, a, c)
                }, this.getLength = function() {
                    return jsBezier.getLength(b)
                }, this.getBounds = function() {
                    return c
                }
            }
        };
        var a = function() {
            this.resetBounds = function() {
                this.bounds = {
                    minX: 1 / 0,
                    minY: 1 / 0,
                    maxX: -1 / 0,
                    maxY: -1 / 0
                }
            }, this.resetBounds()
        };
        jsPlumb.Connectors.AbstractConnector = function(b) {
            a.apply(this, arguments);
            var c = [],
                d = 0,
                e = [],
                f = [],
                g = b.stub || 0,
                h = jsPlumbUtil.isArray(g) ? g[0] : g,
                i = jsPlumbUtil.isArray(g) ? g[1] : g,
                j = b.gap || 0,
                k = jsPlumbUtil.isArray(j) ? j[0] : j,
                l = jsPlumbUtil.isArray(j) ? j[1] : j,
                m = null,
                n = !1,
                o = null;
            this.isEditable = function() {
                return !1
            }, this.setEdited = function(a) {
                n = a
            }, this.getPath = function() {}, this.setPath = function() {}, this.findSegmentForPoint = function(a, b) {
                for (var d = {
                    d: 1 / 0,
                    s: null,
                    x: null,
                    y: null,
                    l: null
                }, e = 0; e < c.length; e++) {
                    var f = c[e].findClosestPointOnPath(a, b);
                    f.d < d.d && (d.d = f.d, d.l = f.l, d.x = f.x, d.y = f.y, d.s = c[e], d.x1 = f.x1, d.x2 = f.x2, d.y1 = f.y1, d.y2 = f.y2, d.index = e)
                }
                return d
            };
            var p = function() {
                    for (var a = 0, b = 0; b < c.length; b++) {
                        var g = c[b].getLength();
                        f[b] = g / d, e[b] = [a, a += g / d]
                    }
                },
                q = function(a, b) {
                    b && (a = a > 0 ? a / d : (d + a) / d);
                    for (var g = e.length - 1, h = 1, i = 0; i < e.length; i++)
                        if (e[i][1] >= a) {
                            g = i, h = 1 == a ? 1 : 0 === a ? 0 : (a - e[i][0]) / f[i];
                            break
                        }
                    return {
                        segment: c[g],
                        proportion: h,
                        index: g
                    }
                },
                r = function(a, b, e) {
                    if (e.x1 != e.x2 || e.y1 != e.y2) {
                        var f = new jsPlumb.Segments[b](e);
                        c.push(f), d += f.getLength(), a.updateBounds(f)
                    }
                },
                s = function() {
                    d = c.length = e.length = f.length = 0
                };
            this.setSegments = function(a) {
                m = [], d = 0;
                for (var b = 0; b < a.length; b++) m.push(a[b]), d += a[b].getLength()
            };
            var t = function(a) {
                this.lineWidth = a.lineWidth;
                var b = Biltong.quadrant(a.sourcePos, a.targetPos),
                    c = a.targetPos[0] < a.sourcePos[0],
                    d = a.targetPos[1] < a.sourcePos[1],
                    e = a.lineWidth || 1,
                    f = a.sourceEndpoint.anchor.getOrientation(a.sourceEndpoint),
                    g = a.targetEndpoint.anchor.getOrientation(a.targetEndpoint),
                    j = c ? a.targetPos[0] : a.sourcePos[0],
                    m = d ? a.targetPos[1] : a.sourcePos[1],
                    n = Math.abs(a.targetPos[0] - a.sourcePos[0]),
                    o = Math.abs(a.targetPos[1] - a.sourcePos[1]);
                if (0 === f[0] && 0 === f[1] || 0 === g[0] && 0 === g[1]) {
                    var p = n > o ? 0 : 1,
                        q = [1, 0][p];
                    f = [], g = [], f[p] = a.sourcePos[p] > a.targetPos[p] ? -1 : 1, g[p] = a.sourcePos[p] > a.targetPos[p] ? 1 : -1, f[q] = 0, g[q] = 0
                }
                var r = c ? n + k * f[0] : k * f[0],
                    s = d ? o + k * f[1] : k * f[1],
                    t = c ? l * g[0] : n + l * g[0],
                    u = d ? l * g[1] : o + l * g[1],
                    v = f[0] * g[0] + f[1] * g[1],
                    w = {
                        sx: r,
                        sy: s,
                        tx: t,
                        ty: u,
                        lw: e,
                        xSpan: Math.abs(t - r),
                        ySpan: Math.abs(u - s),
                        mx: (r + t) / 2,
                        my: (s + u) / 2,
                        so: f,
                        to: g,
                        x: j,
                        y: m,
                        w: n,
                        h: o,
                        segment: b,
                        startStubX: r + f[0] * h,
                        startStubY: s + f[1] * h,
                        endStubX: t + g[0] * i,
                        endStubY: u + g[1] * i,
                        isXGreaterThanStubTimes2: Math.abs(r - t) > h + i,
                        isYGreaterThanStubTimes2: Math.abs(s - u) > h + i,
                        opposite: -1 == v,
                        perpendicular: 0 === v,
                        orthogonal: 1 == v,
                        sourceAxis: 0 === f[0] ? "y" : "x",
                        points: [j, m, n, o, r, s, t, u]
                    };
                return w.anchorOrientation = w.opposite ? "opposite" : w.orthogonal ? "orthogonal" : "perpendicular", w
            };
            return this.getSegments = function() {
                return c
            }, this.updateBounds = function(a) {
                var b = a.getBounds();
                this.bounds.minX = Math.min(this.bounds.minX, b.minX), this.bounds.maxX = Math.max(this.bounds.maxX, b.maxX), this.bounds.minY = Math.min(this.bounds.minY, b.minY), this.bounds.maxY = Math.max(this.bounds.maxY, b.maxY)
            }, this.pointOnPath = function(a, b) {
                var c = q(a, b);
                return c.segment && c.segment.pointOnPath(c.proportion, !1) || [0, 0]
            }, this.gradientAtPoint = function(a, b) {
                var c = q(a, b);
                return c.segment && c.segment.gradientAtPoint(c.proportion, !1) || 0
            }, this.pointAlongPathFrom = function(a, b, c) {
                var d = q(a, c);
                return d.segment && d.segment.pointAlongPathFrom(d.proportion, b, !1) || [0, 0]
            }, this.compute = function(a) {
                n || (o = t.call(this, a)), s(), this._compute(o, a), this.x = o.points[0], this.y = o.points[1], this.w = o.points[2], this.h = o.points[3], this.segment = o.segment, p()
            }, {
                addSegment: r,
                prepareCompute: t,
                sourceStub: h,
                targetStub: i,
                maxStub: Math.max(h, i),
                sourceGap: k,
                targetGap: l,
                maxGap: Math.max(k, l)
            }
        }, jsPlumbUtil.extend(jsPlumb.Connectors.AbstractConnector, a);
        var b = jsPlumb.Connectors.Straight = function() {
            this.type = "Straight";
            var a = jsPlumb.Connectors.AbstractConnector.apply(this, arguments);
            this._compute = function(b) {
                a.addSegment(this, "Straight", {
                    x1: b.sx,
                    y1: b.sy,
                    x2: b.startStubX,
                    y2: b.startStubY
                }), a.addSegment(this, "Straight", {
                    x1: b.startStubX,
                    y1: b.startStubY,
                    x2: b.endStubX,
                    y2: b.endStubY
                }), a.addSegment(this, "Straight", {
                    x1: b.endStubX,
                    y1: b.endStubY,
                    x2: b.tx,
                    y2: b.ty
                })
            }
        };
        jsPlumbUtil.extend(jsPlumb.Connectors.Straight, jsPlumb.Connectors.AbstractConnector), jsPlumb.registerConnectorType(b, "Straight"), jsPlumb.Endpoints.AbstractEndpoint = function(b) {
            a.apply(this, arguments);
            var c = this.compute = function() {
                var a = this._compute.apply(this, arguments);
                return this.x = a[0], this.y = a[1], this.w = a[2], this.h = a[3], this.bounds.minX = this.x, this.bounds.minY = this.y, this.bounds.maxX = this.x + this.w, this.bounds.maxY = this.y + this.h, a
            };
            return {
                compute: c,
                cssClass: b.cssClass
            }
        }, jsPlumbUtil.extend(jsPlumb.Endpoints.AbstractEndpoint, a), jsPlumb.Endpoints.Dot = function(a) {
            this.type = "Dot", jsPlumb.Endpoints.AbstractEndpoint.apply(this, arguments), a = a || {}, this.radius = a.radius || 10, this.defaultOffset = .5 * this.radius, this.defaultInnerRadius = this.radius / 3, this._compute = function(a, b, c) {
                this.radius = c.radius || this.radius;
                var d = a[0] - this.radius,
                    e = a[1] - this.radius,
                    f = 2 * this.radius,
                    g = 2 * this.radius;
                if (c.strokeStyle) {
                    var h = c.lineWidth || 1;
                    d -= h, e -= h, f += 2 * h, g += 2 * h
                }
                return [d, e, f, g, this.radius]
            }
        }, jsPlumbUtil.extend(jsPlumb.Endpoints.Dot, jsPlumb.Endpoints.AbstractEndpoint), jsPlumb.Endpoints.Rectangle = function(a) {
            this.type = "Rectangle", jsPlumb.Endpoints.AbstractEndpoint.apply(this, arguments), a = a || {}, this.width = a.width || 20, this.height = a.height || 20, this._compute = function(a, b, c) {
                var d = c.width || this.width,
                    e = c.height || this.height,
                    f = a[0] - d / 2,
                    g = a[1] - e / 2;
                return [f, g, d, e]
            }
        }, jsPlumbUtil.extend(jsPlumb.Endpoints.Rectangle, jsPlumb.Endpoints.AbstractEndpoint);
        var c = function() {
            jsPlumb.DOMElementComponent.apply(this, arguments), this._jsPlumb.displayElements = []
        };
        jsPlumbUtil.extend(c, jsPlumb.DOMElementComponent, {
            getDisplayElements: function() {
                return this._jsPlumb.displayElements
            },
            appendDisplayElement: function(a) {
                this._jsPlumb.displayElements.push(a)
            }
        }), jsPlumb.Endpoints.Image = function(a) {
            this.type = "Image", c.apply(this, arguments), jsPlumb.Endpoints.AbstractEndpoint.apply(this, arguments);
            var b = a.onload,
                d = a.src || a.url,
                e = a.cssClass ? " " + a.cssClass : "";
            this._jsPlumb.img = new Image, this._jsPlumb.ready = !1, this._jsPlumb.initialized = !1, this._jsPlumb.deleted = !1, this._jsPlumb.widthToUse = a.width, this._jsPlumb.heightToUse = a.height, this._jsPlumb.endpoint = a.endpoint, this._jsPlumb.img.onload = function() {
                null != this._jsPlumb && (this._jsPlumb.ready = !0, this._jsPlumb.widthToUse = this._jsPlumb.widthToUse || this._jsPlumb.img.width, this._jsPlumb.heightToUse = this._jsPlumb.heightToUse || this._jsPlumb.img.height, b && b(this))
            }.bind(this), this._jsPlumb.endpoint.setImage = function(a, c) {
                var d = a.constructor == String ? a : a.src;
                b = c, this._jsPlumb.img.src = d, null != this.canvas && this.canvas.setAttribute("src", this._jsPlumb.img.src)
            }.bind(this), this._jsPlumb.endpoint.setImage(d, b), this._compute = function(a) {
                return this.anchorPoint = a, this._jsPlumb.ready ? [a[0] - this._jsPlumb.widthToUse / 2, a[1] - this._jsPlumb.heightToUse / 2, this._jsPlumb.widthToUse, this._jsPlumb.heightToUse] : [0, 0, 0, 0]
            }, this.canvas = document.createElement("img"), this.canvas.style.margin = 0, this.canvas.style.padding = 0, this.canvas.style.outline = 0, this.canvas.style.position = "absolute", this.canvas.className = this._jsPlumb.instance.endpointClass + e, this._jsPlumb.widthToUse && this.canvas.setAttribute("width", this._jsPlumb.widthToUse), this._jsPlumb.heightToUse && this.canvas.setAttribute("height", this._jsPlumb.heightToUse), this._jsPlumb.instance.appendElement(this.canvas), this.attachListeners(this.canvas, this), this.actuallyPaint = function() {
                if (!this._jsPlumb.deleted) {
                    this._jsPlumb.initialized || (this.canvas.setAttribute("src", this._jsPlumb.img.src), this.appendDisplayElement(this.canvas), this._jsPlumb.initialized = !0);
                    var a = this.anchorPoint[0] - this._jsPlumb.widthToUse / 2,
                        b = this.anchorPoint[1] - this._jsPlumb.heightToUse / 2;
                    jsPlumbUtil.sizeElement(this.canvas, a, b, this._jsPlumb.widthToUse, this._jsPlumb.heightToUse)
                }
            }, this.paint = function(a, b) {
                null != this._jsPlumb && (this._jsPlumb.ready ? this.actuallyPaint(a, b) : window.setTimeout(function() {
                    this.paint(a, b)
                }.bind(this), 200))
            }
        }, jsPlumbUtil.extend(jsPlumb.Endpoints.Image, [c, jsPlumb.Endpoints.AbstractEndpoint], {
            cleanup: function() {
                this._jsPlumb.deleted = !0, this.canvas && this.canvas.parentNode.removeChild(this.canvas), this.canvas = null
            }
        }), jsPlumb.Endpoints.Blank = function() {
            jsPlumb.Endpoints.AbstractEndpoint.apply(this, arguments), this.type = "Blank", c.apply(this, arguments), this._compute = function(a) {
                return [a[0], a[1], 10, 0]
            }, this.canvas = document.createElement("div"), this.canvas.style.display = "block", this.canvas.style.width = "1px", this.canvas.style.height = "1px", this.canvas.style.background = "transparent", this.canvas.style.position = "absolute", this.canvas.className = this._jsPlumb.endpointClass, jsPlumb.appendElement(this.canvas), this.paint = function() {
                jsPlumbUtil.sizeElement(this.canvas, this.x, this.y, this.w, this.h)
            }
        }, jsPlumbUtil.extend(jsPlumb.Endpoints.Blank, [jsPlumb.Endpoints.AbstractEndpoint, c], {
            cleanup: function() {
                this.canvas && this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas)
            }
        }), jsPlumb.Endpoints.Triangle = function(a) {
            this.type = "Triangle", jsPlumb.Endpoints.AbstractEndpoint.apply(this, arguments), a = a || {}, a.width = a.width || 55, a.height = a.height || 55, this.width = a.width, this.height = a.height, this._compute = function(a, b, c) {
                var d = c.width || self.width,
                    e = c.height || self.height,
                    f = a[0] - d / 2,
                    g = a[1] - e / 2;
                return [f, g, d, e]
            }
        };
        var d = jsPlumb.Overlays.AbstractOverlay = function(a) {
            this.visible = !0, this.isAppendedAtTopLevel = !0, this.component = a.component, this.loc = null == a.location ? .5 : a.location, this.endpointLoc = null == a.endpointLocation ? [.5, .5] : a.endpointLocation
        };
        d.prototype = {
            cleanup: function() {
                this.component = null, this.canvas = null, this.endpointLoc = null
            },
            setVisible: function(a) {
                this.visible = a, this.component.repaint()
            },
            isVisible: function() {
                return this.visible
            },
            hide: function() {
                this.setVisible(!1)
            },
            show: function() {
                this.setVisible(!0)
            },
            incrementLocation: function(a) {
                this.loc += a, this.component.repaint()
            },
            setLocation: function(a) {
                this.loc = a, this.component.repaint()
            },
            getLocation: function() {
                return this.loc
            }
        }, jsPlumb.Overlays.Arrow = function(a) {
            this.type = "Arrow", d.apply(this, arguments), this.isAppendedAtTopLevel = !1, a = a || {};
            var b = jsPlumbUtil,
                c = Biltong;
            this.length = a.length || 20, this.width = a.width || 20, this.id = a.id;
            var e = (a.direction || 1) < 0 ? -1 : 1,
                f = a.paintStyle || {
                        lineWidth: 1
                    },
                g = a.foldback || .623;
            this.computeMaxSize = function() {
                return 1.5 * self.width
            }, this.draw = function(a, d) {
                var h, i, j, k, l;
                if (a.pointAlongPathFrom) {
                    if (b.isString(this.loc) || this.loc > 1 || this.loc < 0) {
                        var m = parseInt(this.loc, 10),
                            n = this.loc < 0 ? 1 : 0;
                        h = a.pointAlongPathFrom(n, m, !1), i = a.pointAlongPathFrom(n, m - e * this.length / 2, !1), j = c.pointOnLine(h, i, this.length)
                    } else if (1 == this.loc) {
                        if (h = a.pointOnPath(this.loc), i = a.pointAlongPathFrom(this.loc, -this.length), j = c.pointOnLine(h, i, this.length), -1 == e) {
                            var o = j;
                            j = h, h = o
                        }
                    } else if (0 === this.loc) {
                        if (j = a.pointOnPath(this.loc), i = a.pointAlongPathFrom(this.loc, this.length), h = c.pointOnLine(j, i, this.length), -1 == e) {
                            var p = j;
                            j = h, h = p
                        }
                    } else h = a.pointAlongPathFrom(this.loc, e * this.length / 2), i = a.pointOnPath(this.loc), j = c.pointOnLine(h, i, this.length);
                    k = c.perpendicularLineTo(h, j, this.width), l = c.pointOnLine(h, j, g * this.length);
                    var q = {
                            hxy: h,
                            tail: k,
                            cxy: l
                        },
                        r = f.strokeStyle || d.strokeStyle,
                        s = f.fillStyle || d.strokeStyle,
                        t = f.lineWidth || d.lineWidth,
                        u = {
                            component: a,
                            d: q,
                            lineWidth: t,
                            strokeStyle: r,
                            fillStyle: s,
                            minX: Math.min(h.x, k[0].x, k[1].x),
                            maxX: Math.max(h.x, k[0].x, k[1].x),
                            minY: Math.min(h.y, k[0].y, k[1].y),
                            maxY: Math.max(h.y, k[0].y, k[1].y)
                        };
                    return u
                }
                return {
                    component: a,
                    minX: 0,
                    maxX: 0,
                    minY: 0,
                    maxY: 0
                }
            }
        }, jsPlumbUtil.extend(jsPlumb.Overlays.Arrow, d), jsPlumb.Overlays.PlainArrow = function(a) {
            a = a || {};
            var b = jsPlumb.extend(a, {
                foldback: 1
            });
            jsPlumb.Overlays.Arrow.call(this, b), this.type = "PlainArrow"
        }, jsPlumbUtil.extend(jsPlumb.Overlays.PlainArrow, jsPlumb.Overlays.Arrow), jsPlumb.Overlays.Diamond = function(a) {
            a = a || {};
            var b = a.length || 40,
                c = jsPlumb.extend(a, {
                    length: b / 2,
                    foldback: 2
                });
            jsPlumb.Overlays.Arrow.call(this, c), this.type = "Diamond"
        }, jsPlumbUtil.extend(jsPlumb.Overlays.Diamond, jsPlumb.Overlays.Arrow);
        var e = function(a) {
                return null == a._jsPlumb.cachedDimensions && (a._jsPlumb.cachedDimensions = a.getDimensions()), a._jsPlumb.cachedDimensions
            },
            f = function(a) {
                jsPlumb.DOMElementComponent.apply(this, arguments), d.apply(this, arguments), this.id = a.id, this._jsPlumb.div = null, this._jsPlumb.initialised = !1, this._jsPlumb.component = a.component, this._jsPlumb.cachedDimensions = null, this._jsPlumb.create = a.create, this.getElement = function() {
                    if (null == this._jsPlumb.div) {
                        var b = this._jsPlumb.div = jsPlumb.getDOMElement(this._jsPlumb.create(this._jsPlumb.component));
                        b.style.position = "absolute";
                        var c = this._jsPlumb.instance.overlayClass + " " + (this.cssClass ? this.cssClass : a.cssClass ? a.cssClass : "");
                        b.className = c, this._jsPlumb.instance.appendElement(b), this._jsPlumb.instance.getId(b), this.attachListeners(b, this), this.canvas = b
                    }
                    return this._jsPlumb.div
                }, this.draw = function(a, b, c) {
                    var d = e(this);
                    if (null != d && 2 == d.length) {
                        var f = {
                            x: 0,
                            y: 0
                        };
                        if (c) f = {
                            x: c[0],
                            y: c[1]
                        };
                        else if (a.pointOnPath) {
                            var g = this.loc,
                                h = !1;
                            (jsPlumbUtil.isString(this.loc) || this.loc < 0 || this.loc > 1) && (g = parseInt(this.loc, 10), h = !0), f = a.pointOnPath(g, h)
                        } else {
                            var i = this.loc.constructor == Array ? this.loc : this.endpointLoc;
                            f = {
                                x: i[0] * a.w,
                                y: i[1] * a.h
                            }
                        }
                        var j = f.x - d[0] / 2,
                            k = f.y - d[1] / 2;
                        return {
                            component: a,
                            d: {
                                minx: j,
                                miny: k,
                                td: d,
                                cxy: f
                            },
                            minX: j,
                            maxX: j + d[0],
                            minY: k,
                            maxY: k + d[1]
                        }
                    }
                    return {
                        minX: 0,
                        maxX: 0,
                        minY: 0,
                        maxY: 0
                    }
                }
            };
        jsPlumbUtil.extend(f, [jsPlumb.DOMElementComponent, d], {
            getDimensions: function() {
                return jsPlumb.getSize(this.getElement())
            },
            setVisible: function(a) {
                this._jsPlumb.div.style.display = a ? "block" : "none"
            },
            clearCachedDimensions: function() {
                this._jsPlumb.cachedDimensions = null
            },
            cleanup: function() {
                null != this._jsPlumb.div && this._jsPlumb.instance.removeElement(this._jsPlumb.div)
            },
            computeMaxSize: function() {
                var a = e(this);
                return Math.max(a[0], a[1])
            },
            reattachListeners: function(a) {
                this._jsPlumb.div && this.reattachListenersForElement(this._jsPlumb.div, this, a)
            },
            paint: function(a) {
                this._jsPlumb.initialised || (this.getElement(), a.component.appendDisplayElement(this._jsPlumb.div), this.attachListeners(this._jsPlumb.div, a.component), this._jsPlumb.initialised = !0), this._jsPlumb.div.style.left = a.component.x + a.d.minx + "px", this._jsPlumb.div.style.top = a.component.y + a.d.miny + "px"
            }
        }), jsPlumb.Overlays.Custom = function() {
            this.type = "Custom", f.apply(this, arguments)
        }, jsPlumbUtil.extend(jsPlumb.Overlays.Custom, f), jsPlumb.Overlays.GuideLines = function() {
            var a = this;
            a.length = 50, a.lineWidth = 5, this.type = "GuideLines", d.apply(this, arguments), jsPlumb.jsPlumbUIComponent.apply(this, arguments), this.draw = function(b) {
                var c = b.pointAlongPathFrom(a.loc, a.length / 2),
                    d = b.pointOnPath(a.loc),
                    e = Biltong.pointOnLine(c, d, a.length),
                    f = Biltong.perpendicularLineTo(c, e, 40),
                    g = Biltong.perpendicularLineTo(e, c, 20);
                return {
                    connector: b,
                    head: c,
                    tail: e,
                    headLine: g,
                    tailLine: f,
                    minX: Math.min(c.x, e.x, g[0].x, g[1].x),
                    minY: Math.min(c.y, e.y, g[0].y, g[1].y),
                    maxX: Math.max(c.x, e.x, g[0].x, g[1].x),
                    maxY: Math.max(c.y, e.y, g[0].y, g[1].y)
                }