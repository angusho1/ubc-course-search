// Get the modal
var modal = document.getElementById("map-box");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close-btn")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function openMap() {
    modal.style.display = "inline-block";
    // document.body.focus({preventScroll: true});
}


// let googleMap;
// var vancouver = {lat: 49.246292, lng: -123.116226};
// var options = {
//     zoom: 12,
//     center: vancouver
// }

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

function fetchLocationData(address) {
    const base = 'https://maps.googleapis.com/maps/api/geocode/json';
    const key = 'AIzaSyA-0H9VLPVX4ngWyuhBY7UxhKX3s8dyCBc';
    const url = `${base}?key=${key}&address="${address}"`;
    return fetch(url)
        .then(res => res.json());
}

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

