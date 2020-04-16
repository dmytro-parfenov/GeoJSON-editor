let map = null;
let selectedFeature = null;
let newFeatureListener = null;
let currentInfoWindow = null;
let bufferedFeature = null;

function initMap() {
    map = new google.maps.Map(document.querySelector('#map'));
    const latLngBounds = new google.maps.LatLngBounds({lat: 0, lng: -180}, {lat: 0, lng: 180});
    map.fitBounds(latLngBounds);

    map.data.setControlPosition(google.maps.ControlPosition.TOP_CENTER);
    map.data.setControls(['Polygon', 'Point', 'LineString']);

    map.addListener('click', () => {
        closeInfoWindow();
        unsetEditable(selectedFeature);
    });

    map.addListener('rightclick', event => {
        closeInfoWindow();
        if (!bufferedFeature) {
            return;
        }

        currentInfoWindow = new google.maps.InfoWindow({
            content: '<button onclick="paste()">paste</button>',
            position: event.latLng
        });

        currentInfoWindow.open(map);
    });

    map.data.addListener('click', event => {
        closeInfoWindow();

        unsetEditable(selectedFeature);
        setEditable(event.feature);
    });

    map.data.addListener('rightclick', event => {
        closeInfoWindow();

        unsetEditable(selectedFeature);
        setEditable(event.feature);

        currentInfoWindow = new google.maps.InfoWindow({
            content: '<button onclick="remove()">remove</button>\n' +
                '<button onclick="copy()">copy</button>',
            position: event.latLng
        });

        currentInfoWindow.open(map);
    });
}

function closeInfoWindow() {
    if (!currentInfoWindow) {
        return;
    }

    currentInfoWindow.close();
}

function remove() {
    closeInfoWindow();

    if (!selectedFeature) {
        return;
    }

    map.data.remove(selectedFeature);
    selectedFeature = null;
}

function copy() {
    closeInfoWindow();

    bufferedFeature = selectedFeature;
}

function paste() {
    closeInfoWindow();

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

    map.data.overrideStyle(feature, {editable: true, draggable: true});
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

    clearData();

    map.data.loadGeoJson(url, null, event => {
        if (!event.length) {
            console.log('Data is empty');
            return;
        }


        const latitudes = [];
        const longitudes = [];

        event.forEach(feature => {
            feature.getGeometry().forEachLatLng(latLng => {
                latitudes.push(latLng.toJSON().lat);
                longitudes.push(latLng.toJSON().lng);
            });
        });

        const sw = {lat: Math.min(...latitudes), lng: Math.min(...longitudes)};
        const ne = {lat: Math.max(...latitudes), lng: Math.max(...longitudes)};

        const latLngBounds = new google.maps.LatLngBounds(sw, ne);
        map.fitBounds(latLngBounds);

        newFeatureListener = map.data.addListener('addfeature', event => {
            unsetEditable(selectedFeature);
            setEditable(event.feature);
        });
    });
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

function clearData() {
    map.data.forEach(feature => {
        map.data.remove(feature);
    });
}
