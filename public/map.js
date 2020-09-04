// Get the modal
var modal = document.getElementById("map-box");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close-btn")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// Close the modal when
window.onclick = event => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Opens pop-up modal to display the map
function openMap() {
    modal.style.display = "inline-block";
    // document.body.focus({preventScroll: true});
}

// uses Google Maps API to load map of the building
async function loadMap(address, name) {
    let boxTitle = document.querySelector('.modal-content').children[0];
    boxTitle.textContent = name;

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
        content: `<h3>${name}</h3>${address}`
    }

    var map = new google.maps.Map(document.getElementById('map'), options);

    addMarker(markerInfo, map);
}

// fetches location information from Google Places API, given an address
function fetchLocationData(address) {
    const base = 'https://maps.googleapis.com/maps/api/geocode/json';
    const key = 'AIzaSyA-0H9VLPVX4ngWyuhBY7UxhKX3s8dyCBc';
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

