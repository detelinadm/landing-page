async function setTile(url, elId, formatter) {
  const el = document.getElementById(elId);
  try {
    const res = await fetch(url);
    el.textContent = res.ok ? formatter(await res.json()) : `Error ${res.status}`;
  } catch {
    el.textContent = "Unavailable";
  }
}

setTile("/api/health", "tileHealth", (d) => d.status || "ok");
setTile("/api/version", "tileVersion", (d) => `${d.git_sha || "local"} • ${d.build_time || "local"}`);
setTile("/api/uptime", "tileUptime", (d) => `${d.uptime || "-"}`);

const funResult = document.getElementById("funResult");
const incidentModal = document.getElementById("incidentModal");
const incidentContent = document.getElementById("incidentContent");
const incidentClose = document.getElementById("incidentClose");

function openIncidentModal(html) {
  incidentContent.innerHTML = html;
  incidentModal.classList.add("open");
  incidentModal.setAttribute("aria-hidden", "false");
}

function closeIncidentModal() {
  incidentModal.classList.remove("open");
  incidentModal.setAttribute("aria-hidden", "true");
  incidentContent.innerHTML = "";
}

// Close on X
incidentClose.addEventListener("click", closeIncidentModal);

// Close when clicking backdrop
incidentModal.addEventListener("click", (e) => {
  if (e.target?.dataset?.close === "true") closeIncidentModal();
});

// Close on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && incidentModal.classList.contains("open")) {
    closeIncidentModal();
  }
});


document.getElementById("hireNo").addEventListener("click", () => {
  const incidentId = "INC-" + Math.floor(1000 + Math.random() * 9000);
  const now = new Date().toLocaleString();

  openIncidentModal(`
    <div class="incident">
      <div class="incident-header">
        <span class="badge badge-sev1">SEV-1</span>
        <span class="badge badge-status">Investigating</span>
      </div>

      <h3 id="incidentTitle" class="incident-title">Incident created: Hiring decision "No"</h3>
      <p class="incident-meta mono">${incidentId} • ${now}</p>

      <p class="incident-meta">
        <strong>Impact:</strong> Candidate confidence degraded.<br/>
        <strong>Suspected cause:</strong> Insufficient evidence reviewed.<br/>
        <strong>Next steps:</strong> Review health, version, and recent deployments.
      </p>

      <div class="incident-actions">
        <a class="btn btn-primary" href="#dashboard" onclick="document.getElementById('incidentClose').click()">Open dashboard</a>
        <button id="resolveIncident" class="btn" type="button">Mark resolved</button>
      </div>
    </div>
  `);

  setTimeout(() => {
    const resolve = document.getElementById("resolveIncident");
    if (resolve) {
      resolve.addEventListener("click", () => {
        incidentContent.innerHTML = `<p class="small">Incident resolved. Thanks for the honest feedback </p>`;
      });
    }
  }, 0);
});



document.getElementById("hireYes").addEventListener("click", () => {
  // Confetti burst 
  if (typeof confetti === "function") {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }

  openIncidentModal(`
    <div class="success">
      <div class="incident-header">
        <span class="badge badge-success">HIRED </span>
        <span class="badge badge-status">Celebrating</span>
      </div>

      <h3 id="incidentTitle" class="incident-title">Offer accepted (in spirit)</h3>
      <p class="incident-meta">Next step: collect your prize.</p>

      <div class="incident-actions">
        <button id="collectPrize" class="btn btn-primary" type="button">Collect your prize</button>
        <button id="closeSuccess" class="btn" type="button">Not now</button>
      </div>
    </div>
  `);

  setTimeout(() => {
    const collect = document.getElementById("collectPrize");
    const closeBtn = document.getElementById("closeSuccess");

    if (collect) {
      collect.addEventListener("click", () => {
        openIncidentModal(`
            <div class="success">
              <div class="incident-header">
                <span class="badge badge-success">PRIZE </span>
                <span class="badge badge-status">Delivered</span>
              </div>
              <div class="prize-wrap">
                <div class="prize-zoom">
                  <img class="prize-img" src="/static/img/rickroll.jpg" alt="Rickroll prize" />
                </div>
              </div>

              <div class="incident-actions">
                <button id="closePrize" class="btn btn-primary" type="button">Close</button>
              </div>
            </div>
          `);


        setTimeout(() => {
          const closePrize = document.getElementById("closePrize");
          if (closePrize) {
            closePrize.addEventListener("click", () => {
              document.getElementById("incidentClose").click();
            });
          }
        }, 0);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        document.getElementById("incidentClose").click();
      });
    }
  }, 0);
});


document.getElementById("askBtn").addEventListener("click", async () => {
  const q = document.getElementById("cvQuestion").value.trim();
  const out = document.getElementById("cvAnswer");

  if (!q) {
    out.textContent = "Type a question first";
    return;
  }

  out.textContent = "Thinking…";

  try {
    const res = await fetch("/api/ask-cv", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({question: q})
    });

    const data = await res.json();
    if (!res.ok) {
      out.textContent = data.error || data.detail || `Error ${res.status}`;
      return;
    }

    out.textContent = data.answer + (data.cached ? "\n\n(cached)" : "");
  } catch (e) {
    out.textContent = "Request failed. Is the server running?";
  }
});



