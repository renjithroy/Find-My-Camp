mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/outdoors-v12', // style URL
    center: campground.geometry.coordinates, // starting position [lng, lat]
    zoom: 9, // starting zoom
});

map.addControl(new mapboxgl.NavigationControl());

new mapboxgl.Marker({ color: 'black' })
    .setLngLat(campground.geometry.coordinates)
    .setPopup(
        new mapboxgl.Popup({ offset: 25 })
            .setHTML(
                `<h5>${campground.title}</h5>
                <p>${campground.location}</p>
                <button class="directions-button" onclick="getDirections()">Get Directions</button>`
            )
    )
    .addTo(map);

// Function to open Google Maps with directions
function getDirections() {
    const lat = campground.geometry.coordinates[1];
    const lng = campground.geometry.coordinates[0];
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

