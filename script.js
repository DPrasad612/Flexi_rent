// script.js -- frontend JS to talk to backend
document.addEventListener("DOMContentLoaded", () => {
  const API = "/api"; // same origin; server will serve frontend & API

  // ---- Search
  const searchInput = document.getElementById("search-location");
  const searchButton = document.getElementById("search-button");
  const resultsDiv = document.getElementById("results");

  searchButton.addEventListener("click", () => {
    const loc = (searchInput.value || "").trim();
    fetch(`${API}/search?location=${encodeURIComponent(loc)}`)
      .then(r => r.json())
      .then(renderHouses)
      .catch(err => {
        console.error(err);
        resultsDiv.innerHTML = `<p class="text-danger">Search failed. See console.</p>`;
      });
  });

  function renderHouses(houses) {
    resultsDiv.innerHTML = "";
    if (!Array.isArray(houses) || houses.length === 0) {
      resultsDiv.innerHTML = "<p>No houses found.</p>";
      return;
    }
    houses.forEach(h => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h5>${escapeHtml(h.title || "Untitled")}</h5>
        <p><strong>Location:</strong> ${escapeHtml(h.location || "")} &nbsp; <strong>Rent:</strong> ₹${h.rent || 0}</p>
        <p>${escapeHtml(h.description || "")}</p>
        <p><small>Owner: ${escapeHtml(h.owner_contact || "")}</small></p>
      `;
      resultsDiv.appendChild(card);
    });
  }

  // ---- Upload form
  const uploadForm = document.getElementById("upload-form");
  uploadForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const payload = {
      title: document.getElementById("upload-title").value.trim(),
      location: document.getElementById("upload-location").value.trim(),
      rent: Number(document.getElementById("upload-rent").value) || 0,
      description: document.getElementById("upload-address").value.trim(),
      owner_contact: document.getElementById("upload-phone").value.trim()
    };
    fetch(`${API}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(resp => {
        if (resp.status === "success") {
          alert("Uploaded successfully (id: " + resp.id + ")");
          uploadForm.reset();
        } else {
          alert("Upload failed: " + (resp.error || JSON.stringify(resp)));
        }
      })
      .catch(err => {
        console.error(err);
        alert("Upload failed — check console.");
      });
  });

  // ---- Move-in form
  const moveinForm = document.getElementById("movein-form");
  moveinForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const payload = {
      name: document.getElementById("movein-name").value.trim(),
      phone: document.getElementById("movein-phone").value.trim(),
      address: document.getElementById("movein-address").value.trim(),
      date: document.getElementById("movein-date").value,
      items: document.getElementById("movein-items").value.trim()
    };
    fetch(`${API}/movein`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(resp => {
        if (resp.status === "success") {
          alert("Move-in booked (id: " + resp.id + ")");
          moveinForm.reset();
        } else {
          alert("Booking failed: " + (resp.error || JSON.stringify(resp)));
        }
      })
      .catch(err => {
        console.error(err);
        alert("Booking failed — check console.");
      });
  });

  // ---- Vehicles
  const viewVehiclesBtn = document.getElementById("view-vehicles");
  const vehiclesList = document.getElementById("vehicles-list");
  viewVehiclesBtn.addEventListener("click", () => {
    fetch(`${API}/vehicles`)
      .then(r => r.json())
      .then(rows => {
        vehiclesList.innerHTML = "";
        if (!Array.isArray(rows) || rows.length === 0) {
          vehiclesList.innerHTML = "<p>No vehicles available.</p>";
          return;
        }
        rows.forEach(v => {
          const card = document.createElement("div");
          card.className = "card";
          card.innerHTML = `
            <h5>${escapeHtml(v.type || "Vehicle")} — ${escapeHtml(v.model || "")}</h5>
            <p>Rent/day: ₹${v.rent_per_day || 0} | Available: ${v.available ? "Yes" : "No"}</p>
          `;
          vehiclesList.appendChild(card);
        });
      })
      .catch(err => {
        console.error(err);
        vehiclesList.innerHTML = "<p class='text-danger'>Failed to load vehicles.</p>";
      });
  });

  // small helper
  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    }[s]));
  }
});
