const BACKEND_URL = "http://34.122.38.150:3000"; // This is the backend URL, connect to GCP here

function uploadFile() {
    // upload a file to the backend
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
    let query = document.getElementById("searchInput").value;
    let resultsDiv = document.getElementById("searchResults");

    if (!query) {
        alert("Please enter a search term!");
        return;
    }

    resultsDiv.innerHTML = "<p> Sending search request...</p>";

    // Submit the search query
    fetch(`${BACKEND_URL}/search`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
    })
    .then(response => response.json())
    .then(data => {
        const jobId = data.jobId;
        resultsDiv.innerHTML = `<p>⏳ Processing... Job ID: ${jobId}</p>`;

        // Poll for result
        let attempts = 0;
        const maxAttempts = 15; // ~30s timeout

        const poll = setInterval(() => {
            fetch(`${BACKEND_URL}/result/${jobId}`)
                .then(res => res.json())
                .then(resultData => {
                    if (resultData.status === "Done") {
                        clearInterval(poll);
                        resultsDiv.innerHTML = `<h5>Results for: ${resultData.term}</h5>`;
                        let table = `<table class="table"><tr><th>File</th><th>Frequency</th></tr>`;
                        resultData.results.forEach(r => {
                            table += `<tr><td>${r.file}</td><td>${r.freq}</td></tr>`;
                        });
                        table += "</table>";
                        resultsDiv.innerHTML += table;
                    }
                })
                .catch(err => {
                    clearInterval(poll);
                    resultsDiv.innerHTML = `<p class="text-danger">⚠️ Error retrieving result</p>`;
                    console.error(err);
                });

            if (++attempts >= maxAttempts) {
                clearInterval(poll);
                resultsDiv.innerHTML = `<p class="text-warning">Request timed out. Try again later.</p>`;
            }
        }, 2000);
    })
    .catch(error => {
        resultsDiv.innerHTML = `<p class="text-danger">Failed to submit search</p>`;
        console.error("Search error:", error);
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
