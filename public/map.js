loadMapsScript();

// Get the modal
var modal = document.getElementById("map-box");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close-btn")[0];

// When the user clicks on <span> (x), close the modal
span.addEventListener('click', () => {
    modal.style.display = "none";
    hideMap();
});

// Close the modal when
window.addEventListener('click', (e) => {
    if (e.target == modal) {
        modal.style.display = "none";
        hideMap();
    }
});


function loadMapsScript() {
    // Make Google Maps API Call
    let maps_script = document.createElement('script');
    maps_script.setAttribute('src', `https://maps.googleapis.com/maps/api/js?key=${config.MAPS_KEY}`);
    maps_script.defer = true;
    document.body.appendChild(maps_script);
}

// Opens pop-up modal to display the map
function openMap(building, mapId) {
    let boxTitle = document.getElementById('building-name');
    boxTitle.textContent = building;

    const map = document.getElementById(mapId);
    map.style.display = 'block';
    modal.style.display = "inline-block";
    // document.body.focus({preventScroll: true});
}

function hideMap() {
    document.querySelectorAll('.map').forEach(m => {
        m.style.display = 'none';
    });
}

// uses Google Maps API to load map of the building
async function loadMap(building, address, id) {
    let lat;
    let lng;
    await fetchLocationData(address)
        .then(res => {
            lat = res.results[0].geometry.location.lat;
            lng = res.results[0].geometry.location.lng;
        });

    let coords = {lat: lat, lng: lng};
    let options = {
        zoom: 16,
        center: coords
    };

    let markerInfo = {
        coords: coords,
        content: `<h3>${building}</h3>${address}`
    }

    const newMap = document.createElement('div');
    const mapId = `map-${id}`;
    newMap.id = mapId;
    newMap.classList = 'map';

    // modal.firstElementChild.appendChild(newMap);
    document.getElementById('map-container').appendChild(newMap);

    var map = new google.maps.Map(document.getElementById(mapId), options);

    addMarker(markerInfo, map);

    newMap.style.display = 'none';
}

// fetches location information from Google Geocoding API, given an address
function fetchLocationData(address) {
    const base = 'https://maps.googleapis.com/maps/api/geocode/json';
    const key = config.GEOCODING_KEY;
    const url = `${base}?key=${key}&address="${address}"`;
    return fetch(url)
        .then(res => res.json());
}


// Adds a marker to the specified location on the map
function addMarker(info, map) {
    var marker = new google.maps.Marker({
        position: info.coords,
        map: map,
    });

    // if (info.icon) {
    //     marker.setIcon(info.icon);
    // }

    let infoWindow;
    if (info.content) {
        infoWindow = new google.maps.InfoWindow({
            content: info.content
        });
    }

    // marker.addListener('click', function() {
    //     infoWindow.open(map, marker);
    // });

    google.maps.event.addListener(marker, 'click', function() {
        infoWindow.open(map,marker);
     });
     
    infoWindow.open(map,marker);
}

