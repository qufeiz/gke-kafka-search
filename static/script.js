const BACKEND_URL = "https://my-cloud-backend-url.com"; // This is the backend URL, you connect to GCP here

function uploadFile() {
    // This function is used to upload a file to the backend
    let fileInput = document.getElementById("fileInput").files[0];
    if (!fileInput) {
        alert("Please select a file!");
        return;
    }

    let formData = new FormData();
    formData.append("file", fileInput);

    fetch(`${BACKEND_URL}/upload`, { method: "POST", body: formData })
        .then(response => response.json())
        .then(data => {
            document.getElementById("uploadStatus").innerHTML = 
                `<strong>Uploaded:</strong> ${fileInput.name} ✅`;
        })
        .catch(error => console.error("Error:", error));
}

function constructIndices() {
    // This function is used to construct the indices
    fetch(`${BACKEND_URL}/construct_indices`, { method: "POST" })
        .then(response => response.json())
        .then(data => document.getElementById("indexStatus").innerText = data.message);
}

function search() {
    // This function is used to search for a query
    let query = document.getElementById("searchInput").value;
    let resultsDiv = document.getElementById("searchResults");

    if (!query) {
        alert("Please enter a search term!");
        return;
    }

    resultsDiv.innerHTML = "<p>🔍 Searching...</p>";  // Show loading message

    fetch(`${BACKEND_URL}/search?q=${query}`)
        .then(response => response.json())
        .then(data => {
            resultsDiv.innerHTML = `<h5>Results for: ${data.term}</h5>`;
            let table = `<table class="table"><tr><th>Doc ID</th><th>File</th><th>Frequency</th></tr>`;
            data.results.forEach(r => {
                table += `<tr><td>${r.doc_id}</td><td>${r.file}</td><td>${r.freq}</td></tr>`;
            });
            table += "</table>";
            resultsDiv.innerHTML += table;
        });
}

function topN() {
    // This function is used to get the top N frequent terms
    let n = document.getElementById("nInput").value;
    fetch(`${BACKEND_URL}/top_n?n=${n}`)
        .then(response => response.json())
        .then(data => {
            let resultsDiv = document.getElementById("topNResults");
            resultsDiv.innerHTML = "<h5>Top-N Frequent Terms</h5>";
            let table = `<table class="table"><tr><th>Term</th><th>Frequency</th></tr>`;
            data.top_n.forEach(t => {
                table += `<tr><td>${t.term}</td><td>${t.freq}</td></tr>`;
            });
            table += "</table>";
            resultsDiv.innerHTML += table;
        });
}
