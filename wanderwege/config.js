const Config = {
	ignoredKeys: ["BOUNDEDBY", "SHAPE", "SHAPE_LENGTH", "SHAPE_AREA", "OBJECTID", "GLOBALID", "GEOMETRY", "SHP", "SHP_AREA", "SHP_LENGTH","GEOM"],
	wfsImgPath: "../resources/img/",
	namedProjections: [
        ["EPSG:25833", "+title=ETRS89/UTM 33N +proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"]
    ],
    footer: {
        urls: [
            {
                "bezeichnung": "Geodatenservice",
                "url": "https://www.berlin.de/ba-mitte/politik-und-verwaltung/aemter/stadtentwicklungsamt/kataster-und-vermessung/",
                "alias": "Amt Biesenthal",
                "alias_mobil": "Amt Biesenthal"
            },
            {
                "bezeichnung": "",
                "url": "https://www.amt-biesenthal-barnim.de/impressum",
                "alias": "Impressum",
                "alias_mobil": "Impressum"
            },
            {
                "bezeichnung": "",
                "url": "https://www.amt-biesenthal-barnim.de/datenschutz",
                "alias": "Datenschutzerklärung",
                "alias_mobil": "Datenschutz"
            }
        ],
        showVersion: true
    },
    quickHelp: {
        imgPath: "../resources/img/"
    },
    layerConf: "../resources/services-internet.json",
    restConf: "../resources/rest-services-internet.json",
    styleConf: "../resources/style_v3.json",
    scaleLine: true,
    mouseHover: {
        numFeaturesToShow: 3,
        infoText: "..."
    },
    cswId: 'FBCSW'
};

// conditional export to make config readable by e2e tests
if (typeof module !== "undefined") {
    module.exports = Config;
}
