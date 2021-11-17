/* eslint-disable no-unused-vars */

const Config = {
    wfsImgPath: "../resources/img/",
    namedProjections: [
					// ETRS89 UTM  -- 25833 hinzugfuegt
            //["EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
            ["EPSG:25833", "+title=ETRS89/UTM 33N +proj=utm +zone=33 +ellps=WGS84 +towgs84=0,0,0,0,0,0,1 +units=m +no_defs"],
		            // Soldner Berlin --hinzugefuegt
            ["EPSG:3068", "+title=Soldner Berlin +proj=cass +lat_0=52.41864827777778 +lon_0=13.62720366666667 +x_0=40000 +y_0=10000 +ellps=bessel +datum=potsdam +units=m +no_defs"],
    ],
    footer: {
        urls: [{
            "bezeichnung": "Kartographie und Gestaltung: ",
            "url": "https://www.berlin.de/ba-mitte/politik-und-verwaltung/aemter/stadtentwicklungsamt/kataster-und-vermessung/",
            "alias": "Bezirksamt Mitte von Berlin, Fachbereich Vermessung",
            "alias_mobil": "BA Mitte, Verm"
            }],
        showVersion: true
        },
    
    alerting: {
        fetchBroadcastUrl: "../resources/broadcastedPortalAlerts.json"
    },

    quickHelp: {
        imgPath: "./resources/img/"
        },
    layerConf: "../resources/services-internet.json",
    restConf: "../resources/rest-services-internet.json",
    styleConf: "../resources/style_v3.json",
    scaleLine: true,
    mouseHover: {
        numFeaturesToShow: 5,
        infoText: "(weitere Objekte. Bitte zoomen.)"
        },
    useVectorStyleBeta: true
    };

// conditional export to make config readable by e2e tests
if (typeof module !== "undefined") {
    module.exports = Config;
                                   }
