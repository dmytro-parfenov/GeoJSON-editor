let map = null;
let selectedFeature = null;
let newFeatureListener = null;
let currentInfoWindow = null;
let bufferedFeature = null;

function initMap() {
    map = new google.maps.Map(document.querySelector('#map'));

    map.data.setControlPosition(google.maps.ControlPosition.TOP_CENTER);
    map.data.setControls(['Polygon', 'Point', 'LineString']);

    reloadGeoJson('https://storage.googleapis.com/mapsdevsite/json/google.json');

    map.addListener('click', () => {
        unsetEditable(selectedFeature);
    });

    map.addListener('rightclick', event => {
        if (!bufferedFeature) {
            return;
        }

        if (currentInfoWindow) {
            currentInfoWindow.close();
        }

        currentInfoWindow = new google.maps.InfoWindow({
            content: '<button onclick="paste()">paste</button>',
            position: event.latLng
        });

        currentInfoWindow.open(map);
    });

    map.data.addListener('click', event => {
        unsetEditable(selectedFeature);
        setEditable(event.feature);
    });

    map.data.addListener('rightclick', event => {
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }

        selectedFeature = event.feature;

        currentInfoWindow = new google.maps.InfoWindow({
            content: '<button onclick="remove()">remove</button>\n' +
                '<button onclick="copy()">copy</button>',
            position: event.latLng
        });

        currentInfoWindow.open(map);
    });
}

function remove() {
    if (currentInfoWindow) {
        currentInfoWindow.close();
    }

    if (!selectedFeature) {
        return;
    }

    map.data.remove(selectedFeature);
    selectedFeature = null;
}

function copy() {
    if (currentInfoWindow) {
        currentInfoWindow.close();
    }

    bufferedFeature = selectedFeature;
}

function paste() {
    if (currentInfoWindow) {
        currentInfoWindow.close();
    }

    if (!bufferedFeature) {
        return;
    }

    const feature = new google.maps.Data.Feature({geometry: bufferedFeature.getGeometry()});

    map.data.add(feature);
}

function setEditable(feature) {
    if (!feature) {
        return;
    }

    selectedFeature = feature;

    map.data.overrideStyle(feature, {editable: true, draggable: true, fillColor: 'red'});
}

function unsetEditable(feature) {
    if (!feature) {
        return;
    }

    selectedFeature = null;

    map.data.overrideStyle(feature, {editable: false, draggable: false});
}

function reloadGeoJson(url) {
    google.maps.event.removeListener(newFeatureListener);

    map.data.forEach(feature => {
        map.data.remove(feature);
    });

    map.data.loadGeoJson(url, null, event => {
        if (!event.length) {
            return;
        }

        const geometry = event[0].getGeometry();
        const latLng = getGeometryCenter(geometry);

        map.setCenter(latLng);
        map.setZoom(4);

        newFeatureListener = map.data.addListener('addfeature', event => {
            unsetEditable(selectedFeature);
            setEditable(event.feature);
        });
    });
}

function getGeometryCenter(geometry) {
    const latitudes = [];
    const longitudes = [];

    geometry.forEachLatLng(latLng => {
        latitudes.push(latLng.toJSON().lat);
        longitudes.push(latLng.toJSON().lng);
    });

    return new google.maps.LatLng({
        lat: getAvgValue(latitudes),
        lng: getAvgValue(longitudes)
    });
}

function getAvgValue(values) {
    if (!values.length) {
        return 0;
    }

    const total = values.reduce((previous, current) => previous += current, 0);

    return total / values.length;
}

function importGeoJson(input) {
    let file = input.files[0];
    const objectURL = URL.createObjectURL(file);
    reloadGeoJson(objectURL);
}

function exportGeoJson() {
    map.data.toGeoJson(event => {
        var data = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(event))}`;
        const a = document.createElement('a');
        a.download = "map.json";
        a.href = data;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}
