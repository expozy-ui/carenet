function initMap() {

  // --- Elements ---
  const mapEl = document.getElementById("map");
  const inputAddress = document.getElementById("address");
  const btnLocation = document.getElementById("location");

  const inputs = {
    city: document.getElementById('city'),
    post_code: document.getElementById('post_code'),
    country: document.getElementById('country'),
    streetName: document.getElementById('streetName'),
    streetNumber: document.getElementById('streetNumber'),
    country_code: document.getElementById('country_code'),
    // fullAddress: document.getElementById('finalGeoAddress'),
  };

  // --- MAP ---
  const map = new google.maps.Map(mapEl, {
    center: { lat: 42.69566314577448, lng: 23.310898688636605 },
    zoom: 13,
    streetViewControl: false
  });

  // --- AUTOCOMPLETE ---
  const autocomplete = new google.maps.places.Autocomplete(inputAddress, {
    fields: ["place_id", "geometry", "formatted_address", "address_components"],
  });
  autocomplete.bindTo("bounds", map);

  const geocoder = new google.maps.Geocoder();

  // --- MARKER ---
  let marker = new google.maps.Marker({
    map,
    draggable: true,
    visible: false
  });

  // -------------------------------
  //         HELPERS
  // -------------------------------

  function setMarker(position) {
    marker.setPosition(position);
    marker.setVisible(true);
  }

  function getAddressObject(components) {
    let obj = {};

    components.forEach(el => {
      const type = el.types[0];
      if (!type) return;

      if (type === "country") {
        obj.country = el.long_name;
        obj.country_code = el.short_name;
      } else {
        obj[type] = el.short_name;
      }
    });

    return obj;
  }

  function fillInputs(addr) {
    if (!addr) return;

    const f = {
      locality: 'city',
      postal_code: 'post_code',
      route: 'streetName',
      street_number: 'streetNumber',
      country: 'country',
      country_code: 'country_code',
    };

    Object.entries(f).forEach(([src, dest]) => {
      if (addr[src] && inputs[dest]) {
        inputs[dest].value = addr[src];
      }
    });

    // Build final address
    const parts = [
      addr.route,
      addr.street_number,
      addr.postal_code,
      addr.administrative_area_level_1,
      addr.locality,
      addr.country
    ].filter(Boolean);

    const finalAddress = parts.join(' ');

    inputAddress.value = finalAddress;
    ;

    // inputs.fullAddress.value = finalAddress;


    // Save in your proxy
    data.location = {
      city: addr.locality,
      country: addr.country,
      post_code: addr.postal_code,
      streetName: addr.route,
      streetNumber: addr.street_number
    };
  }

  function reverseGeocode(latLng) {
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === "OK" && results[0]) {
        const addr = getAddressObject(results[0].address_components);
        fillInputs(addr);
      }
    });
  }

  // -------------------------------
  //      EVENT HANDLERS
  // -------------------------------

  // Drag marker → update address
  marker.addListener("dragend", () => {
    const position = marker.getPosition();
    reverseGeocode(position);
  });

  // Drag map → move marker to center
  map.addListener("dragend", () => {
    const center = map.getCenter();
    setMarker(center);
    reverseGeocode(center);
  });

  // Select autocomplete result
  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) return;

    map.setCenter(place.geometry.location);
    map.setZoom(15);

    setMarker(place.geometry.location);

    const addr = getAddressObject(place.address_components);
    fillInputs(addr);
  });

  // Get current location
  btnLocation.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Your browser doesn't support geolocation.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        map.setCenter(loc);
        setMarker(loc);
        reverseGeocode(loc);
      },
      () => {
        alert("Не можахме да вземем местоположението.");
      }
    );
  });
}

window.initMap = initMap;
